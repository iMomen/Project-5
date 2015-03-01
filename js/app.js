function appViewModel() {
  var self = this; 
  var map;
  var service;
  var infowindow;
  var chapelHill = new google.maps.LatLng(35.908759, -79.048100);
  var markersArray = [];
  var marker;

  self.allPlaces = ko.observableArray([]);

  self.clickMarker = function(place) {
    for(var e = 0; e < markersArray.length; e++)
    if(place.place_id === markersArray[e].place_id) {      
      map.panTo(markersArray[e].position);      
      var contentString = place.name;
      infowindow.setContent(contentString);
      infowindow.open(map, markersArray[e]);
      markersArray[e].setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function(){markersArray[e].setAnimation(null);}, 1500);
    }
  }

  function toggleBounce() {
    if (marker.getAnimation() != null) {
      marker.setAnimation(null);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
    setTimeout(toggleBounce, 1500);    
  }

  function getAllPlaces(place){
    var myPlace = {};
    myPlace.place_id = place.place_id;
    myPlace.position = place.geometry.location.toString();
    myPlace.name = place.name;
    
    self.allPlaces.push(myPlace);
  }

  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: chapelHill,
    zoom: 15
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

  function createMarker(place) {
    var marker = new google.maps.Marker({
      map: map,
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      name: place.name.toLowerCase(),
      position: place.geometry.location,
      place_id: place.place_id,
      animation: google.maps.Animation.DROP
    });   
    var contentString = place.name
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