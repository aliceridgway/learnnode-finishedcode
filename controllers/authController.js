const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

// Crypto to generate password reset tokens
const crypto = require('crypto');


exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
  });

exports.isLoggedIn = (req,res,next) => {
    if (req.isAuthenticated()){
      return next();
    }

    res.redirect('/login');
}
  
exports.forgot = async (req,res) => {
  // 1. See if there is a user with the supplied email address

  const user = await User.findOne({email: req.body.email});

  if(!user){
    req.flash('success','A reset token has been sent!');
    return res.redirect('login');
  }

  // 2. Set reset tokens and expiry on their account

  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  // 3. Send them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}. Expires at ${user.resetPasswordExpires}`;
  req.flash('success',`token: ${resetURL}`);

  await mail.send({
    user,
    subject:'password reset',
    resetURL,
    filename:'password-reset'
  });

  // 4. Redirect them to the login page
  res.redirect('/login');
}

exports.reset = async (req,res) => {

  const user = await User.findOne({
    resetPasswordToken:req.params.token,
    resetPasswordExpires: {$gt: Date.now() }
  });

  if (!user) {
    req.flash('error','token expired');
    return res.redirect('/login');
  }

  res.render('reset',{title:"Please reset your password"});
}

exports.validatePasswordReset = (req,res,next) =>{

  if (req.body.password === req.body['confirm-password']){
    return next();
  }

  req.flash('error','passwords do not match!');
  res.redirect('back');
};

exports.updatePassword = async (req,res) => {

  const user = await User.findOne({
    resetPasswordToken:req.params.token,
    resetPasswordExpires: {$gt: Date.now() }
  });

  if (!user) {
    req.flash('error','token expired');
    return res.redirect('/login');
  };

  const setPassword = promisify(user.setPassword,user);
  await setPassword(req.body.password);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  const updatedUser = await user.save();
  await req.login(updatedUser);
  req.flash('success','your password has been reset');
  res.redirect('/');



};



exports.logout = (req,res) => { 
  req.logout();
  req.flash('success','you are now logged out');
  res.redirect('/');
}