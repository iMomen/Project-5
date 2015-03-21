function appViewModel() {
  var self = this; 
  var map;
  var service;
  var infowindow;
  var lat = 35.908759;
  var lng = -79.048100;
  var chapelHill = new google.maps.LatLng(lat, lng);
  var markersArray = [];
  var marker;

  self.allPlaces = ko.observableArray([]);
  self.foursquareInfo = '';

  // Foursquare Credentials
  var clientID = 'UVSLUM00CXLUB1P0UKPJSLDTG0VVYQ2E20W1C045PBU1OJNZ';
  var clientSecret = 'JERNMOY0EUXF4LGZTWDLLJFR2CXWDSZWL1JU2W5CS1POPZBF';

  this.getFoursquareInfo = function(point) {
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20150321' + '&ll=' +lat+ ',' +lng+ '&query=\'' +point.name +'\'&limit=1';
    
    $.getJSON(foursquareURL)
      .done(function(response) {
        self.foursquareInfo = '<p>From Foursquare:<br>';
        var venue = response.response.venues[0];
        var venueID = venue.id;
        var venueName = venue.name;
            if (venueName !== null && venueName !== undefined){
                self.foursquareInfo += 'name: ' +
                  venueName + '<br>';
            }        
        var phoneNum = venue.contact.formattedPhone;
            if (phoneNum !== null && phoneNum !== undefined){
                self.foursquareInfo += 'phone: ' +
                  phoneNum + '<br>';
            }
      })
  };  
 
  /*
  Function that will pan to the position and open an info window of an item clicked in the list.
  */
  self.clickMarker = function(place) {
    for(var e = 0; e < markersArray.length; e++)      
    if(place.place_id === markersArray[e].place_id) { 
      self.getFoursquareInfo(place);     
      map.panTo(markersArray[e].position);            
      var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + self.foursquareInfo;
      
      infowindow.setContent(contentString);
      infowindow.open(map, markersArray[e]);  
      markersArray[e].setAnimation(google.maps.Animation.DROP);      
    }
  }


  /*
  function that gets the information from all the places that we are going to search and also pre-populate.  Pushes this info to the allPlaces array for knockout.
  */
  function getAllPlaces(place){
    var myPlace = {};    
    myPlace.place_id = place.place_id;
    myPlace.position = place.geometry.location.toString();
    myPlace.name = place.name;

    var address;
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }
    myPlace.address = address;
    
    self.allPlaces.push(myPlace);                
  }

  /*
  Loads the map as well as position the search bar and list.  On a search, clearOverlays removes all markers already on the map and removes all info in allPlaces.  Then, once a search is complete, populates more markers and sends the info to getAllPlaces to populate allPlaces again.
  */
  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: chapelHill,    
    });
    getPlaces();

    var list = (document.getElementById('list'));
    map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(list);
    var input = (document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    var searchBox = new google.maps.places.SearchBox(
      (input));
    google.maps.event.addListener(searchBox, 'places_changed', function() {
      var places = searchBox.getPlaces();
      clearOverlays();
      self.allPlaces.removeAll();
      var bounds = new google.maps.LatLngBounds();

      for(var i=0, place; i<10; i++){
        if (places[i] !== undefined){
          place = places[i];

          getAllPlaces(place);
          createMarker(place);
          bounds.extend(place.geometry.location);          
        }        
      } 
      map.fitBounds(bounds);     
    });
    google.maps.event.addListener(map, 'bounds_changed', function(){
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });      
  }

  /*
  Function to pre-populate the map with place types.  nearbySearch retuns up to 20 places.
  */
  function getPlaces() {
    var request = {
      location: chapelHill,
      radius: 600,
      types: ['restaurant', 'bar', 'cafe', 'food']
    };

    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);    
  }

  /*
  Gets the callback from Google and creates a marker for each place.  Sends info to getAllPlaces.
  */
  function callback(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
      bounds = new google.maps.LatLngBounds();
      results.forEach(function (place){
        place.marker = createMarker(place);
        bounds.extend(new google.maps.LatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng()));
      })
      map.fitBounds(bounds);
      results.forEach(getAllPlaces);                 
    }
  }

  /*
  Function to create a marker at each place.  This is called on load of the map with the pre-populated list, and also after each search.  Also sets the content of each place's infowindow.
  */
  function createMarker(place) {
    var marker = new google.maps.Marker({
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      name: place.name.toLowerCase(),
      position: place.geometry.location,
      place_id: place.place_id,
      animation: google.maps.Animation.DROP
    });    
    var address;
    if (place.vicinity !== undefined) {
      address = place.vicinity;
    } else if (place.formatted_address !== undefined) {
      address = place.formatted_address;
    }       
    var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + address + '</div>' + self.foursquareInfo ;

    google.maps.event.addListener(marker, 'click', function() {      
      infowindow.setContent(contentString);      
      infowindow.open(map, this);
      map.panTo(marker.position); 
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){marker.setAnimation(null);}, 1450);
    });

    markersArray.push(marker);
    return marker;

  }

  /*
  called after a search, this function clears any markes in the markersArray so that we can start with fresh map with new markers.
  */
  function clearOverlays() {
    for (var i = 0; i < markersArray.length; i++ ) {
     markersArray[i].setMap(null);
    }
    markersArray.length = 0;
  }  

  google.maps.event.addDomListener(window, 'load', initialize);
};

$(function(){
ko.applyBindings(new appViewModel());
});