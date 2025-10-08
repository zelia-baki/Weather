import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// VOS DONNÉES RÉELLES
const TREE_COVER_DATA = [
    
];

const DEFORESTATION_DATA = [
    
];

const TestMap = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap', 'points', 'both'
    const [stats, setStats] = useState({ total: 0, avgCover: 0 });

    // Calculer les statistiques
    useEffect(() => {
        const total = TREE_COVER_DATA.length;
        const avgCover = Math.round(
            TREE_COVER_DATA.reduce((sum, d) => sum + d.wri_tropical_tree_cover_extent__decile, 0) / total
        );
        setStats({ total, avgCover });
    }, []);

    // Convertir les données en GeoJSON
    const createGeoJSON = (data) => ({
        type: 'FeatureCollection',
        features: data.map(item => ({
            type: 'Feature',
            properties: {
                value: item.wri_tropical_tree_cover_extent__decile,
                driver: item.tsc_tree_cover_loss_drivers__driver || 'N/A'
            },
            geometry: {
                type: 'Point',
                coordinates: [item.longitude, item.latitude]
            }
        }))
    });

    // Initialiser la carte
    useEffect(() => {
        if (map.current) return;

        // IMPORTANT: Remplacez par votre vrai token Mapbox
        mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: [32.92, 0.198],
            zoom: 14
        });

        const treeCoverGeoJSON = createGeoJSON(TREE_COVER_DATA);

        map.current.on('load', () => {
            // Ajouter la source de données
            map.current.addSource('tree-cover-data', {
                type: 'geojson',
                data: treeCoverGeoJSON
            });

            // Layer 1: Heatmap
            map.current.addLayer({
                id: 'tree-heatmap',
                type: 'heatmap',
                source: 'tree-cover-data',
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'value'],
                        0, 0,
                        100, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        20, 3
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(247,252,245,0)',
                        0.2, '#c7e9c0',
                        0.4, '#74c476',
                        0.6, '#238b45',
                        0.8, '#006d2c',
                        1, '#00441b'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 5,
                        20, 30
                    ],
                    'heatmap-opacity': 0.7
                }
            });

            // Layer 2: Points individuels
            map.current.addLayer({
                id: 'tree-points',
                type: 'circle',
                source: 'tree-cover-data',
                minzoom: 13,
                layout: {
                    'visibility': 'none'
                },
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        13, 3,
                        20, 10
                    ],
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'value'],
                        0, '#f7fcf5',
                        20, '#c7e9c0',
                        40, '#74c476',
                        60, '#238b45',
                        80, '#006d2c',
                        100, '#00441b'
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                }
            });

            // Popup
            const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            map.current.on('mouseenter', 'tree-points', (e) => {
                map.current.getCanvas().style.cursor = 'pointer';
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { value, driver } = e.features[0].properties;

                popup
                    .setLngLat(coordinates)
                    .setHTML(`
            <div style="padding: 5px;">
              <strong>Couverture:</strong> ${value}%<br>
              <strong>Driver:</strong> ${driver}
            </div>
          `)
                    .addTo(map.current);
            });

            map.current.on('mouseleave', 'tree-points', () => {
                map.current.getCanvas().style.cursor = '';
                popup.remove();
            });

            // Ajouter les contrôles de navigation
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        });
    }, []);

    // Changer le mode de visualisation
    useEffect(() => {
        if (!map.current || !map.current.getLayer('tree-heatmap')) return;

        switch (viewMode) {
            case 'heatmap':
                map.current.setLayoutProperty('tree-heatmap', 'visibility', 'visible');
                map.current.setLayoutProperty('tree-points', 'visibility', 'none');
                break;
            case 'points':
                map.current.setLayoutProperty('tree-heatmap', 'visibility', 'none');
                map.current.setLayoutProperty('tree-points', 'visibility', 'visible');
                break;
            case 'both':
                map.current.setLayoutProperty('tree-heatmap', 'visibility', 'visible');
                map.current.setLayoutProperty('tree-points', 'visibility', 'visible');
                break;
        }
    }, [viewMode]);

    return (
        <></>
    );
};

export default TestMap;