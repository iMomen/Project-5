function appViewModel() {
  var map;
  var service;
  var infowindow;
  var chapelHill = new google.maps.LatLng(35.908759, -79.048100);
  var bounds;
  var marker;

  function initialize() {
    map = new google.maps.Map(document.getElementById('map-canvas'), {
    center: chapelHill,
    zoom: 15
    });
    getPlaces();

    var input = (document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

   marker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29),
      animation: google.maps.Animation.BOUNCE
    });

    google.maps.event.addListener(autocomplete, 'place_changed', function() {
      infowindow.close();
      marker.setVisible(false);
     var place = autocomplete.getPlace();
      if (!place.geometry){
      return;
     }

      if (place.geometry.viewport){
       map.fitBounds(place.geometry.viewport);
     } else {
       map.setCenter(place.geometry.location);
       map.setZoom(17);
      }
      marker.setPosition(place.geometry.location);
      marker.setVisible(true);

      var address = '';
     if (place.address_components){
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
       ].join(' ');
     }

      infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
      infowindow.open(map, marker);
    })
  }

  function getPlaces() {
    var request = {
      location: chapelHill,
      radius: 600,
      types: ['restaurant', 'bar', 'food']
    };

    infowindow = new google.maps.InfoWindow();
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, callback);

  }

  function callback(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK){
      for (var i = 0; i < results.length; i++){
        var place = results[i];
        createMarker(results[i]);
      }
    }
  }

  function createMarker(place) {
    var placeLoc = place.geometry.location;
    marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location,
      animation: google.maps.Animation.DROP
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(place.name);
      infowindow.open(map, this);      
    });
  }

  google.maps.event.addDomListener(window, 'load', initialize);
};

ko.applyBindings(new appViewModel());
