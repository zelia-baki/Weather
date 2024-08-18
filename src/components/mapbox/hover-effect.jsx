import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-100.486052, 37.830348],
      zoom: 2
    });

    let hoveredPolygonId = null;

    mapRef.current.on('load', () => {
      mapRef.current.addSource('states', {
        type: 'geojson',
        data: 'https://docs.mapbox.com/mapbox-gl-js/assets/us_states.geojson'
      });

      // The feature-state dependent fill-opacity expression will render the hover effect
      // when a feature's hover state is set to true.
      mapRef.current.addLayer({
        id: 'state-fills',
        type: 'fill',
        source: 'states',
        layout: {},
        paint: {
          'fill-color': '#627BC1',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1,
            0.5
          ]
        }
      });

      mapRef.current.addLayer({
        id: 'state-borders',
        type: 'line',
        source: 'states',
        layout: {},
        paint: {
          'line-color': '#627BC1',
          'line-width': 2
        }
      });

      mapRef.current.on('mousemove', 'state-fills', (e) => {
        if (e.features.length > 0) {
          if (hoveredPolygonId !== null) {
            mapRef.current.setFeatureState(
              { source: 'states', id: hoveredPolygonId },
              { hover: false }
            );
          }
          hoveredPolygonId = e.features[0].id;
          mapRef.current.setFeatureState(
            { source: 'states', id: hoveredPolygonId },
            { hover: true }
          );
        }
      });

      mapRef.current.on('mouseleave', 'state-fills', () => {
        if (hoveredPolygonId !== null) {
          mapRef.current.setFeatureState(
            { source: 'states', id: hoveredPolygonId },
            { hover: false }
          );
        }
        hoveredPolygonId = null;
      });
    });
  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }} />;
};

export default MapboxExample;