"use strict";// overcome current Chrome and Firefox issues with ECMA6 stuff like classes
/***********************************************************
 * Airsuck Maps system setup
 * v. 0.1
 *
 * Licensed under GPL V3
 * https://github.com/ThreeSixes/airSuck
 *
 * Deps: jQuery, Leaflet JS API loaded
 **********************************************************/

/***************************************************
 * INITIALIZE MAPS
 * Using Leaflet, no Google Map available
 **************************************************/
// Initialize the map.
function initMap() {
  if(debug){console.log("Maps loading...");}
  
  // Attempt to detect user location if turned on
  if (useLocation) {
    $.ajax( { url: '//freegeoip.net/json/', type: 'POST', dataType: 'jsonp',
      success: function(location) {
        // update the lat and lng if we can detect them
        defaultLng = location.longitude;
        defaultLat = location.latitude;
        if(debug){console.log("Got lat/lng: " + defaultLat + ", " + defaultLng);}
      }
    } );
  }
  
  // Set up the map object.
  map = new L.Map(document.getElementById('map')).setView([defaultLat, defaultLng], defaultZoom);

  provider = L.tileLayer.provider('OpenStreetMap.BlackAndWhite');

  // Set default map Layer to Mapnik
  map.addLayer(provider);

  let baseLayers = {
    "Black and White": L.tileLayer.provider("OpenStreetMap.BlackAndWhite"),
    "OpenTopo": L.tileLayer.provider('OpenTopoMap'),
    "OpenStreetMap": L.tileLayer.provider('OpenStreetMap.Mapnik')
  };

  let overlays = {
    "OpenSeaMap": L.tileLayer.provider('OpenSeaMap')
  };

  L.control.layers(baseLayers, overlays).addTo(map);

  // Set the selectbox to OpenStreetMap.BlackAndWhite
  styleSelectBox.options[2].selected = true;
  
  // The map loaded.
  mapLoaded = true;
}
