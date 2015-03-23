function appViewModel() {
  var self = this; 
  var map;
  var service;
  var infowindow;
  var lat = '';
  var lng = '';
  var chapelHill = new google.maps.LatLng(35.908759, -79.048100);
  var markersArray = [];  

  // array to hold info for knockout
  self.allPlaces = ko.observableArray([]);

  // string to hold foursquare information
  self.foursquareInfo = '';

  // Finds the center of the map to get lat and lng values
  function computeCenter() {
    var latAndLng = map.getCenter();
      lat = latAndLng.lat();
      lng = latAndLng.lng(); 
  }

  
  /*
  Loads the map as well as position the search bar and list.  On a search, clearOverlays removes all markers already on the map and removes all info in allPlaces.  Then, once a search is complete, populates more markers and sends the info to getAllPlaces to populate allPlaces again.
  */
  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: chapelHill,    
    });
    getPlaces();
    computeCenter();       

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
      computeCenter();                
    });
    google.maps.event.addListener(map, 'bounds_changed', function(){
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });   
    // Handles an event where Google Maps taks too long to load
    var timer = window.setTimeout(failedToLoad, 5000);
    google.maps.event.addListener(map, 'tilesloaded', function() {
      window.clearTimeout(timer);
    });
  }
  // Will let the user know when Google Maps fails to load.
  function failedToLoad() {
    $('#map-canvas').html("Google Maps Failed to Load");
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
      });
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

  // Foursquare Credentials
  var clientID = 'UVSLUM00CXLUB1P0UKPJSLDTG0VVYQ2E20W1C045PBU1OJNZ';
  var clientSecret = 'JERNMOY0EUXF4LGZTWDLLJFR2CXWDSZWL1JU2W5CS1POPZBF';

  this.getFoursquareInfo = function(point) {
    // creats our foursquare URL
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20150321' + '&ll=' +lat+ ',' +lng+ '&query=\'' +point.name +'\'&limit=1';
    
    $.getJSON(foursquareURL)
      .done(function(response) {
        self.foursquareInfo = '<p>Foursquare:<br>';
        var venue = response.response.venues[0];         
        // Name       
        var venueName = venue.name;
            if (venueName !== null && venueName !== undefined) {
                self.foursquareInfo += 'Name: ' +
                  venueName + '<br>';
            } else {
              self.foursquareInfo += 'Name: Not Found';
            }   
        // Phone Number     
        var phoneNum = venue.contact.formattedPhone;
            if (phoneNum !== null && phoneNum !== undefined) {
                self.foursquareInfo += 'Phone: ' +
                  phoneNum + '<br>';
            } else {
              self.foursquareInfo += 'Phone: Not Found';
            }
        // Twitter
        var twitterId = venue.contact.twitter;
            if (twitterId !== null && twitterId !== undefined) {
              self.foursquareInfo += 'twitter: @' +
                  twitterId + '<br>';
            } 
      });
  };  
 
  /*
  Function that will pan to the position and open an info window of an item clicked in the list.
  */
  self.clickMarker = function(place) {
    var marker;

    for(var e = 0; e < markersArray.length; e++) {      
      if(place.place_id === markersArray[e].place_id) { 
        marker = markersArray[e];
        break; 
      }
    } 
    self.getFoursquareInfo(place);         
    map.panTo(marker.position);   

    // waits 300 milliseconds for the getFoursquare async function to finish
    setTimeout(function() {
      var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>' + self.foursquareInfo;
      infowindow.setContent(contentString);
      infowindow.open(map, marker); 
      marker.setAnimation(google.maps.Animation.DROP); 
    }, 300);     
  };


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
  called after a search, this function clears any markers in the markersArray so that we can start with fresh map with new markers.
  */
  function clearOverlays() {
    for (var i = 0; i < markersArray.length; i++ ) {
     markersArray[i].setMap(null);
    }
    markersArray.length = 0;
  } 

  google.maps.event.addDomListener(window, 'load', initialize);
}

$(function(){
ko.applyBindings(new appViewModel());
});