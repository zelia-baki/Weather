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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-77.04, 38.907],
      zoom: 11.15
    });

    mapRef.current.on('load', () => {
      mapRef.current.addSource('places', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Make it Mount Pleasant</strong><p>Make it Mount Pleasant is a handmade and vintage market and afternoon of live entertainment and kids activities. 12:00-6:00 p.m.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.038659, 38.931567]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Mad Men Season Five Finale Watch Party</strong><p>Head to Lounge 201 (201 Massachusetts Avenue NE) Sunday for a Mad Men Season Five Finale Watch Party, complete with 60s costume contest, Mad Men trivia, and retro food and drink. 8:00-11:00 p.m. $10 general admission, $20 admission and two hour open bar.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.003168, 38.894651]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Big Backyard Beach Bash and Wine Fest</strong><p>EatBar (2761 Washington Boulevard Arlington VA) is throwing a Big Backyard Beach Bash and Wine Fest on Saturday, serving up conch fritters, fish tacos and crab sliders, and Red Apron hot dogs. 12:00-3:00 p.m. $25.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.090372, 38.881189]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Ballston Arts & Crafts Market</strong><p>The Ballston Arts & Crafts Market sets up shop next to the Ballston metro this Saturday for the first of five dates this summer. Nearly 35 artists and crafters will be on hand selling their wares. 10:00-4:00 p.m.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.111561, 38.882342]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  "<strong>Seersucker Bike Ride and Social</strong><p>Feeling dandy? Get fancy, grab your bike, and take part in this year's Seersucker Social bike ride from Dandies and Quaintrelles. After the ride enjoy a lawn party at Hillwood with jazz, cocktails, paper hat-making, and more. 11:00-7:00 p.m.</p>"
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.052477, 38.943951]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Capital Pride Parade</strong><p>The annual Capital Pride Parade makes its way through Dupont this Saturday. 4:30 p.m. Free.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.043444, 38.909664]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Muhsinah</strong><p>Jazz-influenced hip hop artist Muhsinah plays the Black Cat (1811 14th Street NW) tonight with Exit Clov and Gods’illa. 9:00 p.m. $12.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.031706, 38.914581]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  "<strong>A Little Night Music</strong><p>The Arlington Players' production of Stephen Sondheim's <em>A Little Night Music</em> comes to the Kogod Cradle at The Mead Center for American Theater (1101 6th Street SW) this weekend and next. 8:00 p.m.</p>"
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.020945, 38.878241]
              }
            },
            {
              type: 'Feature',
              properties: {
                description:
                  '<strong>Truckeroo</strong><p>Truckeroo brings dozens of food trucks, live music, and games to half and M Street SE (across from Navy Yard Metro Station) today from 11:00 a.m. to 11:00 p.m.</p>'
              },
              geometry: {
                type: 'Point',
                coordinates: [-77.007481, 38.876516]
              }
            }
          ]
        }
      });

      mapRef.current.addLayer({
        id: 'places',
        type: 'circle',
        source: 'places',
        paint: {
          'circle-color': '#4264fb',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      mapRef.current.on('mouseenter', 'places', (e) => {
        mapRef.current.getCanvas().style.cursor = 'pointer';

        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates).setHTML(description).addTo(mapRef.current);
      });

      mapRef.current.on('mouseleave', 'places', () => {
        mapRef.current.getCanvas().style.cursor = '';
        popup.remove();
      });
    });
  }, []);

  return (
    <>
      <div id="map" ref={mapContainerRef} style={{ height: '100%' }}></div>
    </>
  );
};

export default MapboxExample;