function appViewModel() {
  var self = this; 
  var map;
  var service;
  var infowindow;
  var chapelHill = new google.maps.LatLng(35.908759, -79.048100);
  var markersArray = [];

  self.allPlaces = ko.observableArray([]);



  function populateAllPlaces(place){
    var myPlace = {};
    var address;
    myPlace.place_id = place.place_id;
    myPlace.position = place.geometry.location.toString();
    myPlace.name = place.name;

    if (place.vicinity !== undefined){
      address = place.vicinity;
    } else if (place.formatted_address !== undefined){
      address = place.formatted_address;
    }
    myPlace.address = address;
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

          if (place.name == undefined){
            place.name = 'Unkown Name';
          }
          if (place.formatted_address == undefined){
            place.formatted_address = 'Unknown Address';
          }

          populateAllPlaces(place);
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
      results.forEach(populateAllPlaces);
    }
  }

  function createMarker(place) {
    var marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      animation: google.maps.Animation.DROP
    });
    var address;
    if (place.vicinity !== undefined){
      address = place.vicinity;
    } else if (place.formatted_address !== undefined){
      address = place.formatted_address;
    }
    var contentString = '<div class="strong">' +place.name+ '</div><div>' + address + '</div>';
    markersArray.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(contentString);
      infowindow.open(map, this);      
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