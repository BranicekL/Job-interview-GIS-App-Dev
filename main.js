import './style.css';
import { Map, View, Feature, Overlay } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import Draw from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import { TileWMS } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import Icon from 'ol/style/Icon';
import ScaleLine from 'ol/control/ScaleLine.js';
import { Fill, Stroke, Style } from 'ol/style';
import Point from 'ol/geom/Point';



// default zoomed location Banska Stiavnica
const defaultLocation = fromLonLat([18.899081, 48.457562]);

// Holy Trinity Square, Banska Stiavnica - Plague column :D
const hTSquare = fromLonLat([18.892513650847025, 48.459670432933194 ]);

// map marker of Holy Trinity Square
const hTSquareMarker = new Feature({
  geometry: new Point(hTSquare)
});

hTSquareMarker.setStyle(new Style({
  image: new Icon({
    src: 'https://openlayers.org/en/latest/examples/data/icon.png',
    anchor: [0.5, 1],
    scale: 0.7
  })
}));

// Vector map layer with marker styled above
const vectorLayer = new VectorLayer({
  source: new VectorSource({
    features: [hTSquareMarker]
  })
});

const floodLayer = new TileLayer({
  source: new TileWMS({
    url:'https://mpt.svp.sk/server/services/inspire/INSPIRE_MPO/MapServer/WMSServer?',
    params: {
      'LAYERS': '0',
      'TILED': true,
      'FORMAT': 'image/png',
      'TRANSPARENT': true,
      'INFO_FORMAT': 'text/html',
      'QUERY_LAYERS':'0'
    },
    serverType: 'mapserver',
    crossOrigin: 'anonymous'
  }),
});

const roadLayer = new TileLayer({
  source: new TileWMS({
    url: 'https://ismcs.cdb.sk/inspire/services/INSPIRE/InspireView/MapServer/WMSServer',
    params: {
      'LAYERS': 'TN.RoadTransportNetwork.RoadLink',
      'TILED': true,
      'FORMAT': 'image/png',
      'TRANSPARENT': true,
      'QUERY_LAYERS': 'TN.RoadTransportNetwork.RoadLink',
      'INFO_FORMAT': 'text/html'
    },
    serverType: 'mapserver',
    crossOrigin: 'anonymous'
  })
});

// geoJSON layer for new and old castle in BS
const geoJsonLayer = new VectorLayer({
  source: new VectorSource({
    url:'/geojson/map.geojson',
    format: new GeoJSON()
  }),
  style: new Style({
    image: new Icon({
      src: 'https://openlayers.org/en/latest/examples/data/icon.png',
      anchor: [0.5, 1],
      scale: 0.7
    })
  })
})

// popup elements
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const closer = document.getElementById('popup-closer');

// anchor the popup to the map
const popup = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250
    }
  }
});

closer.onclick = function () {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

const drawSource = new VectorSource();

const drawLayer = new VectorLayer({
  source: drawSource,
  style: new Style({
    fill: new Fill({
      color: 'rgba(0, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#00ffff',
      width: 2,
    }),
  })
});

const drawInteraction = new Draw({
  source: drawSource,
  type: 'Polygon'
});

/*
const envZataz = new VectorSource({
  format: new GeoJSON(),
  url: function (extent) {
    return 'https://arc.sazp.sk/arcgis/services/env_zataze/environmentalna_zataz/MapServer/WFSServer?' +
      'service=WFS&' +
      'version=2.0.0&' +
      'request=GetFeature&' +
      'typeName=env_zataze:environmentalna_zataz&' +
      'outputFormat=application/json&' +
      'srsname=EPSG:3857&' +
      'bbox=' + extent.join(',') + ',EPSG:3857';
  },
  strategy: bboxStrategy,
});

const envZataz = new VectorSource(); 
const envZatazLayer = new VectorLayer({
  source: envZataz,
  style: new Style({
    stroke: new Stroke({
      color: 'red',
      width: 2
    }),
    fill: new Fill({
      color: 'rgba(255,0,0,0.2)'
    })
  })
});

drawInteraction.on('drawend', function (event) {
  const feature = event.feature;
  const geometry = feature.getGeometry();
  const extent = geometry.getExtent();

  const wfsUrl = 'https://arc.sazp.sk/arcgis/services/env_zataze/environmentalna_zataz/MapServer/WFSServer?' +
    'service=WFS&' +
    'version=2.0.0&' +
    'request=GetFeature&' +
    'typeName=env_zataze:environmentalna_zataz&' +
    'srsname=EPSG:3857&' +
    'outputFormat=text/xml; subtype=gml/3.2&' +
    'bbox=' + extent.join(',') + ',EPSG:3857';

  fetch(wfsUrl)
    .then(response => response.text())
    .then(gmlText => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gmlText, 'text/xml');

      const gmlFormat = new WFS({
        gmlFormat: new GML3()
      });

      const features = gmlFormat.readFeatures(xmlDoc, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
      });

      envZataz.clear();
      envZataz.addFeatures(features);

      if (features.length === 0) {
        alert('No environmental pollution found in area.');
      }
    })
    .catch(error => {
      console.error('Failed to load WFS:', error);
      alert('Failed to load.');
    });
});


const envZatazLayer = new VectorLayer({
  source: envZataz,
});
*/

// map constructor --------------------------------------------------------------------------
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
    vectorLayer,
    floodLayer,
    roadLayer,
    geoJsonLayer,
    drawLayer,
    //envZatazLayer
  ],
  view: new View({
    center: defaultLocation,
    zoom: 14,
  }),
  controls:[
    new ScaleLine()
  ],
  overlays: [
    popup
  ]
});


map.on('singleclick', function (evt) {
  const viewResolution = map.getView().getResolution();

  // floodURL
  const floodUrl = floodLayer.getSource().getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
    {
      'INFO_FORMAT': 'text/html',
      'QUERY_LAYERS': '0'
    }
  );

  //roadURL
  const roadUrl = roadLayer.getSource().getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
    {
      'INFO_FORMAT': 'text/html',
      'QUERY_LAYERS': 'TN.RoadTransportNetwork.RoadLink'
    }
  );

  const requests = [];
  if(floodUrl){
    requests.push(fetch(floodUrl)
    .then(function(response){
      return response.text();
    }))
  }; 

  if(roadUrl){
    requests.push(fetch(roadUrl)
    .then(function(response){
      return response.text();
    }))
  };
  
  if (requests.length > 0){
    Promise.all(requests).then(responses => {
      const joined = responses.filter(Boolean).join('<hr>');
      content.innerHTML = joined || '<p>No data</p>';
      popup.setPosition(evt.coordinate);
    
    }).catch(err => {
      console.error('GetFeatureInfo error', err);
      content.innerHTML = '<p>Error loading info</p>'; 
      popup.setPosition(evt.coordinate);
    });
  } else{
    content.innerHTML = '<p>No data</p>';
    popup.setPosition(evt.coordinate);
  }
});

// side popup menu toggle ---------------------------------------------------------------------------
const tocToggle = document.getElementById('toc-toggle');
const tocPanel = document.getElementById('toc-popup');

tocToggle.addEventListener('click', () => {
  const isVisible = tocPanel.style.display === 'block';
  tocPanel.style.display = isVisible ? 'none' : 'block';
  tocToggle.classList.toggle('open');
});

// side popup layers checkbocks 
const floodCheck = document.getElementById('toggle-flood');
const roadCheck = document.getElementById('toggle-road');
const geoJsonCheck = document.getElementById('toggle-geoJson');
const squareCheck = document.getElementById('toggle-square');
const polygonCheck = document.getElementById('toggle-polygon');

floodCheck.addEventListener('change', () => {
  floodLayer.setVisible(floodCheck.checked);
});

roadCheck.addEventListener('change', () => {
  roadLayer.setVisible(roadCheck.checked);
});

geoJsonCheck.addEventListener('change', () => {
  //console.log('GeoJSON checkbox changed:', geoJsonCheck.checked);
  geoJsonLayer.setVisible(geoJsonCheck.checked);
  //console.log('Layer visible:', geoJsonLayer.getVisible());
});

polygonCheck.addEventListener('change', () => {
  if (polygonCheck.checked) {
    map.addInteraction(drawInteraction);
  } else {
    map.removeInteraction(drawInteraction);
  }
});

// clear previous drawn polygons
drawInteraction.on('drawstart', function () {
  drawSource.clear();
});

/*squareCheck.addEventListener('change', () => {
  hTSquareMarker.setVisible(squareCheck.checked);
});
*/
squareCheck.addEventListener('change', () => {
  if(squareCheck.checked){
    hTSquareMarker.setStyle(new Style({
      image: new Icon({
        src: 'https://openlayers.org/en/latest/examples/data/icon.png',
        anchor: [0.5, 1],
        scale: 0.7
      })
    }));
  }else{
    hTSquareMarker.setStyle(null);
  }
})