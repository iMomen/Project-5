function appViewModel() {
  var self = this; 
  var map;
  var service;
  var infowindow;
  var chapelHill = new google.maps.LatLng(35.908759, -79.048100);
  var markersArray = [];
  var marker;

  self.allPlaces = ko.observableArray([]);

  /*
  Function that will pan to the position and open an info window of an item clicked in the list.
  */
  self.clickMarker = function(place) {
    for(var e = 0; e < markersArray.length; e++)
    if(place.place_id === markersArray[e].place_id) {      
      map.panTo(markersArray[e].position);      
      var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + place.address + '</div>';
      infowindow.setContent(contentString);
      infowindow.open(map, markersArray[e]);
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
    marker.address = address;   
    var contentString = '<div style="font-weight: bold">' + place.name + '</div><div>' + marker.address + '</div>';
    markersArray.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(contentString);
      infowindow.open(map, this);
      map.panTo(marker.position); 
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){marker.setAnimation(null);}, 1450);
    });
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