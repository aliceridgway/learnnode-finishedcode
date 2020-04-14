import axios from 'axios';
import { $ } from './bling';
import { Store } from 'express-session';

const mapOptions = {
    center: {lat:43.2 , lng:-79.8},
    zoom:12
};

function loadPlaces( map, lat =43.2, lng =-79.8){
    console.log('hello from loadPlaces!');
    
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
        const places = res.data;
        console.log(places);

        if(!places.length){
            alert('no places found!');
            return;
        }

        // create bounds

        const bounds = new google.maps.LatLngBounds();
        const infoWindow = new google.maps.InfoWindow();

        const markers = places.map(place => {
            const [placeLng, placeLat] = place.location.coordinates;
            const position = {lat:placeLat, lng:placeLng};
            bounds.extend(position);
            const marker = new google.maps.Marker({
                map: map,
                position: position
            });

            // add data to the marker
            marker.place = place;
            return marker
        });

        // when someone clicks a marker, show details
        markers.forEach(marker => marker.addListener('click', function(){
            const html = `
                <div class="popup">
                    <a href="/store/${this.place.slug}">
                        <img src="/uploads/${this.place.photo || 'store.png'}" alt=${this.place.name} />
                        <p>${this.place.name} - ${this.place.location.address}</p>
                    </a>
                </div>
            `;
            infoWindow.setContent(html);
            infoWindow.open(map, this);
        }))

        // then zoom to fit all the markers perfectly
        map.setCenter(bounds.getCenter());
        map.fitBounds(bounds);

    });


}

function makeMap(mapDiv){
    if(!mapDiv) return;

    // make the map
    const map = new google.maps.Map(mapDiv,mapOptions);
    loadPlaces(map);

    const input = $('[name="geolocate"]');
    

    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        loadPlaces(map,place.geometry.location.lat(), place.geometry.location.lng());
        console.log(place);
    });
}


export default makeMap;