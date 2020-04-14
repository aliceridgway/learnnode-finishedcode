import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores){
    return stores.map(store => {
        return `<a href="/store/${store.slug}" class="search__result">
                    <strong>${store.name}</strong>
                </a>`
    }).join('');
}

function typeAhead(search){

    if(!search) return;

    console.log(search);
    const searchInput = search.querySelector('input[name="search"]');
    console.log(searchInput);
    const searchResults = search.querySelector('.search__results');
    console.log(searchResults);

    searchInput.on('input', function() {

        // quit if there is no search input
        if(!this.value){
            searchResults.style.display='none';
            return
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML='';

        axios
            .get(`api/search?q=${this.value}`)
            .then(res => {
                if(res.data.length){
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data)); 
                    return
                }

                // if no results
                searchResults.innerHTML = `<div class="search__result"> No results for ${this.value} found </div>`
            }
            ).catch(error => {
                console.log(error);
            });
        
    
        // handle keyboard inputs

        searchInput.on('keyup', (e) => {

            if (![13,38,40].includes(e.keyCode)){
                return; // only do something if up, down or enter have been pressed
            }

            const activeClass = 'search__result--active';
            const current = search.querySelector(`.${activeClass}`);
            const items = search.querySelectorAll('.search__result');
            let next;

            if(e.keyCode === 40 && current){
                next = current.nextElementSibling || items[0];
            } else if(e.keyCode === 40){
                next = items[0];
            } else if (e.keyCode === 38 && current){
                next = current.previousElementSibling || items[items.length-1]
            } else if (e.keyCode === 38){
                next = items[items.length-1];
            } else if (e.keyCode === 13 && current.href){
                window.location = current.href;
                return
            }

            if (current) {
                current.classList.remove(activeClass);
            }
            next.classList.add(activeClass);
        });


    });



 
}

export default typeAhead;