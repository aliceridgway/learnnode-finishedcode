const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req,res) => {
    res.render('login',{title:'Log in'})
}

exports.registerForm = (req,res) => {
    res.render('register',{title:'Register'})
}

exports.validateRegister = (req,res,next) => {

    req.sanitizeBody('name');
    req.checkBody('name','You must supply a name').notEmpty();
    req.checkBody('email','Please supply a valid email').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        gmail_remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false

    });
    req.checkBody('password','Please supply a password').notEmpty();
    req.checkBody('confirm-password','Confirmed password cannot be blank').notEmpty();
    req.checkBody('confirm-password','Your passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register',{title:'Register', body:req.body, flashes: req.flash()});
        return;
    }

    next();
}

exports.register = async (req,res,next) => {
    const user = new User({name:req.body.name, email:req.body.email});
    const register = promisify(User.register, User);
    await register(user,req.body.password);
    console.log('register complete!');
    next(); // pass to auth controller login
}

exports.account = (req,res) => {
    res.render('account',{title:'Edit your account'});
}

exports.updateAccount = async (req,res) => {
    
    const updates ={
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        {_id:req.user._id},
        {$set: updates},
        {new:true, runValidators: true, context:'query'}
    );
    req.flash('success','account updated!');
    res.redirect('back');


}