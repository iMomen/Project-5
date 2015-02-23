function initialize() {
  var mapOptions = {
      center: { lat: 35.908759, lng: -79.048046},
      zoom: 15
      };
        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
      }

google.maps.event.addDomListener(window, 'load', initialize);



