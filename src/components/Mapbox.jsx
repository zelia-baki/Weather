import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const [moveEvent, setMoveEvent] = useState();

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-74.5, 40],
      zoom: 9
    });

    mapRef.current.on('mousemove', (e) => {
      setMoveEvent(e);
    });

    return () => mapRef.current.remove();
  }, []);

  return (
    <>
      <div
        id="map"
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          height: '100%',
          width: '100%'
        }}
      ></div>
      <pre
        id="info"
        style={{
          display: 'table',
          position: 'relative',
          margin: '0px auto',
          wordWrap: 'anywhere',
          whiteSpace: 'pre-wrap',
          padding: '10px',
          border: 'none',
          borderRadius: '3',
          fontSize: '12',
          textAlign: 'center',
          color: '#222',
          background: '#fff'
        }}
      >
        {moveEvent && (
          <>
            {JSON.stringify(moveEvent.point)}
            <br />
            {JSON.stringify(moveEvent.lngLat.wrap())}
          </>
        )}
      </pre>
    </>
  );
};

export default MapboxExample;