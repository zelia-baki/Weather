// ForestMap.jsx - Interactive map component
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const ForestMap = ({
    treeCoverData = [],
    deforestationData = [],
    mapboxToken,
    initialCenter = null,
    initialZoom = 14,
    title = "Forest Analysis",
    subtitle = null
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [viewMode, setViewMode] = useState('both'); // ✅ both by default
    const [stats, setStats] = useState({ total: 0, avgCover: 0, bounds: null });
    const [imageSize, setImageSize] = useState({ width: 400, height: 400 });
    const [isCapturing, setIsCapturing] = useState(false);

    // Calculate statistics and geographic bounds
    useEffect(() => {
        if (treeCoverData.length === 0) return;

        const total = treeCoverData.length;
        const avgCover = Math.round(
            treeCoverData.reduce((sum, d) => sum + d.wri_tropical_tree_cover_extent__decile, 0) / total
        );

        const lats = treeCoverData.map(d => d.latitude);
        const lngs = treeCoverData.map(d => d.longitude);

        const bounds = {
            minLat: Math.min(...lats),
            maxLat: Math.max(...lats),
            minLng: Math.min(...lngs),
            maxLng: Math.max(...lngs),
            centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
            centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2
        };

        setStats({ total, avgCover, bounds });
    }, [treeCoverData]);

    // Convert data to GeoJSON
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

    // Function to capture map as image
    const captureMapImage = () => {
        if (!map.current) return;

        setIsCapturing(true);

        setTimeout(() => {
            const canvas = map.current.getCanvas();
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = imageSize.width;
            exportCanvas.height = imageSize.height;
            const ctx = exportCanvas.getContext('2d');

            const sourceSize = Math.min(canvas.width, canvas.height);
            const sourceX = (canvas.width - sourceSize) / 2;
            const sourceY = (canvas.height - sourceSize) / 2;

            ctx.drawImage(
                canvas,
                sourceX, sourceY, sourceSize, sourceSize,
                0, 0, imageSize.width, imageSize.height
            );

            exportCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `forest-map-${imageSize.width}x${imageSize.height}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
                setIsCapturing(false);
            });
        }, 500);
    };

    // Auto center on data
    const centerOnData = () => {
        if (!map.current || !stats.bounds) return;

        map.current.fitBounds([
            [stats.bounds.minLng, stats.bounds.minLat],
            [stats.bounds.maxLng, stats.bounds.maxLat]
        ], {
            padding: 50,
            duration: 1000
        });
    };

    // Initialize map
    useEffect(() => {
        if (map.current || treeCoverData.length === 0 || !mapboxToken) return;

        mapboxgl.accessToken = mapboxToken;

        const shouldAutoCenter = !initialCenter;

        const center = initialCenter || [
            stats.bounds?.centerLng || 32.92,
            stats.bounds?.centerLat || 0.198
        ];

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: center,
            zoom: initialZoom,
            preserveDrawingBuffer: true
        });

        const treeCoverGeoJSON = createGeoJSON(treeCoverData);

        map.current.on('load', () => {
            map.current.addSource('tree-cover-data', {
                type: 'geojson',
                data: treeCoverGeoJSON
            });

            // Heatmap layer
            map.current.addLayer({
                id: 'tree-heatmap',
                type: 'heatmap',
                source: 'tree-cover-data',
                paint: {
                    'heatmap-weight': ['interpolate', ['linear'], ['get', 'value'], 0, 0, 100, 1],
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 20, 3],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(247,252,245,0)',
                        0.2, '#c7e9c0',
                        0.4, '#74c476',
                        0.6, '#238b45',
                        0.8, '#006d2c',
                        1, '#00441b'
                    ],
                    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 20, 30],
                    'heatmap-opacity': 0.7
                }
            });

            // Points layer
            map.current.addLayer({
                id: 'tree-points',
                type: 'circle',
                source: 'tree-cover-data',
                minzoom: 13,
                layout: { 'visibility': 'none' },
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 3, 20, 10],
                    'circle-color': [
                        'interpolate', ['linear'], ['get', 'value'],
                        0, '#f7fcf5', 20, '#c7e9c0', 40, '#74c476',
                        60, '#238b45', 80, '#006d2c', 100, '#00441b'
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                }
            });

            // 🟢 Apply initial visibility after layers are ready
            setTimeout(() => {
                const visibility = {
                    heatmap: { heatmap: 'visible', points: 'none' },
                    points: { heatmap: 'none', points: 'visible' },
                    both: { heatmap: 'visible', points: 'visible' }
                };
                const mode = visibility[viewMode];
                map.current.setLayoutProperty('tree-heatmap', 'visibility', mode.heatmap);
                map.current.setLayoutProperty('tree-points', 'visibility', mode.points);
            }, 100);

            // Popup
            const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

            map.current.on('mouseenter', 'tree-points', (e) => {
                map.current.getCanvas().style.cursor = 'pointer';
                const coordinates = e.features[0].geometry.coordinates.slice();
                const { value, driver } = e.features[0].properties;
                popup.setLngLat(coordinates)
                    .setHTML(`<div style="padding: 5px;">
                        <strong>Coverage:</strong> ${value}%<br>
                        <strong>Driver:</strong> ${driver}
                    </div>`)
                    .addTo(map.current);
            });

            map.current.on('mouseleave', 'tree-points', () => {
                map.current.getCanvas().style.cursor = '';
                popup.remove();
            });

            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            if (shouldAutoCenter && stats.bounds) {
                setTimeout(() => centerOnData(), 1000);
            }
        });
    }, [treeCoverData, mapboxToken, stats.bounds, initialCenter]);

    // Change visualization mode dynamically
    useEffect(() => {
        if (!map.current || !map.current.getLayer('tree-heatmap')) return;

        const visibility = {
            heatmap: { heatmap: 'visible', points: 'none' },
            points: { heatmap: 'none', points: 'visible' },
            both: { heatmap: 'visible', points: 'visible' }
        };

        const mode = visibility[viewMode];
        map.current.setLayoutProperty('tree-heatmap', 'visibility', mode.heatmap);
        map.current.setLayoutProperty('tree-points', 'visibility', mode.points);
    }, [viewMode]);

    // Auto re-center when bounds update
    useEffect(() => {
        if (map.current && stats.bounds) {
            map.current.fitBounds([
                [stats.bounds.minLng, stats.bounds.minLat],
                [stats.bounds.maxLng, stats.bounds.maxLat]
            ], {
                padding: 50,
                duration: 0
            });
        }
    }, [stats.bounds]);

    if (treeCoverData.length === 0) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">📁 No Data</h2>
                    <p className="text-gray-600">Please provide data via props</p>
                </div>
            </div>
        );
    }

    if (!mapboxToken) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Missing Token</h2>
                    <p className="text-gray-600">Please provide a Mapbox token via <code>mapboxToken</code> prop</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen">
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Information panel */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
                <h3 className="text-lg font-bold text-green-800 mb-2">🌲 {title}</h3>
                {subtitle && <p className="text-sm text-gray-600 mb-1">{subtitle}</p>}
                <p className="text-sm text-gray-600 mb-1">
                    <strong>Center:</strong> {stats.bounds ?
                        `${stats.bounds.centerLat.toFixed(3)}°N, ${stats.bounds.centerLng.toFixed(3)}°E` :
                        'Calculating...'}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-gray-50 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.total}</div>
                        <div className="text-xs text-gray-600">Data Points</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.avgCover}%</div>
                        <div className="text-xs text-gray-600">Avg. Coverage</div>
                    </div>
                </div>

                <button
                    onClick={centerOnData}
                    className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition"
                >
                    🎯 Re-center on Data
                </button>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
                <h4 className="text-xs font-bold text-gray-700 mb-2">Display Mode</h4>
                {['heatmap', 'points', 'both'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`block w-full px-4 py-2 mb-2 rounded text-sm font-medium transition ${viewMode === mode
                                ? 'bg-green-700 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {mode === 'heatmap' ? 'Heatmap' : mode === 'points' ? 'Points' : 'Both'}
                    </button>
                ))}

                <div className="border-t border-gray-200 mt-3 pt-3">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">Screenshot</h4>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                            type="number"
                            value={imageSize.width}
                            onChange={(e) => setImageSize({ ...imageSize, width: parseInt(e.target.value) || 400 })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="Width"
                        />
                        <input
                            type="number"
                            value={imageSize.height}
                            onChange={(e) => setImageSize({ ...imageSize, height: parseInt(e.target.value) || 400 })}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                            placeholder="Height"
                        />
                    </div>
                    <button
                        onClick={captureMapImage}
                        disabled={isCapturing}
                        className={`block w-full px-4 py-2 rounded text-sm font-medium transition ${isCapturing
                                ? 'bg-gray-400 text-white cursor-wait'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isCapturing ? '⏳ Capturing...' : '📸 Capture'}
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-8 right-4 bg-white rounded-lg shadow-lg p-4 z-10">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Forest Coverage</h4>
                <div className="space-y-2">
                    {[
                        { color: '#f7fcf5', label: '0-10%' },
                        { color: '#c7e9c0', label: '20-30%' },
                        { color: '#74c476', label: '40-50%' },
                        { color: '#238b45', label: '60-70%' },
                        { color: '#006d2c', label: '80-90%' },
                        { color: '#00441b', label: '90-100%' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center">
                            <div
                                className="w-8 h-4 border border-gray-300 mr-2"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-gray-700">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ForestMap;