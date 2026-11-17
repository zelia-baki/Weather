import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axiosInstance from '../../axiosInstance';
import 'mapbox-gl/dist/mapbox-gl.css';

// Carte de synthèse du tableau de bord : un point par ferme/forêt (centroïde,
// calculé et mis en cache côté serveur), regroupés en clusters. Les contours
// complets ne sont plus téléchargés ici (50 000+ fermes = 1,2 M de points).

const GLOW = ['#6366f1', '#a855f7', '#f87171', '#fbbf24'];

const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const MapboxExample = ({ ownerType = null, showControls = true, height = "100%", styleType = "dark" }) => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const dataRef = useRef({ type: 'FeatureCollection', features: [] });
  const boundsRef = useRef(null);
  const location = useLocation();

  const owner_type = ownerType || location.state?.owner_type || "farmer";

  const [notification, setNotification] = useState(null);
  const [totalArea, setTotalArea] = useState(0);
  const [polygonCount, setPolygonCount] = useState(0);

  const mapStyle = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    light: 'mapbox://styles/mapbox/light-v11',
  }[styleType] || 'mapbox://styles/mapbox/dark-v11';

  // ── Carte + couches ────────────────────────────────────────────────────────
  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [32.5825, 0.3476],
      zoom: 5,
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('entities', {
        type: 'geojson', data: dataRef.current,
        cluster: true, clusterMaxZoom: 12, clusterRadius: 45,
      });
      map.addLayer({
        id: 'entity-clusters-glow', type: 'circle', source: 'entities', filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], GLOW[0], 100, GLOW[1], 1000, GLOW[2], 5000, GLOW[3]],
          'circle-radius': ['step', ['get', 'point_count'], 24, 100, 30, 1000, 38, 5000, 46],
          'circle-opacity': 0.18, 'circle-blur': 0.6,
        },
      });
      map.addLayer({
        id: 'entity-clusters', type: 'circle', source: 'entities', filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], GLOW[0], 100, GLOW[1], 1000, GLOW[2], 5000, GLOW[3]],
          'circle-radius': ['step', ['get', 'point_count'], 14, 100, 18, 1000, 24, 5000, 30],
          'circle-opacity': 0.75,
          'circle-stroke-width': 1.5, 'circle-stroke-color': 'rgba(255,255,255,0.6)',
        },
      });
      map.addLayer({
        id: 'entity-cluster-count', type: 'symbol', source: 'entities', filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'], 'text-size': 11,
        },
        paint: { 'text-color': '#fff' },
      });
      map.addLayer({
        id: 'entity-points', type: 'circle', source: 'entities', filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 15, 8],
          'circle-opacity': 0.85, 'circle-blur': 0.2,
          'circle-stroke-width': 1, 'circle-stroke-color': 'rgba(255,255,255,0.7)',
        },
      });
      if (boundsRef.current) map.fitBounds(boundsRef.current, { padding: 50, duration: 0 });
    });

    map.on('click', 'entity-clusters', (e) => {
      const f = e.features[0];
      map.getSource('entities').getClusterExpansionZoom(f.properties.cluster_id, (err, z) => {
        if (!err) map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 });
      });
    });

    map.on('click', 'entity-points', (e) => {
      const p = e.features[0].properties;
      const color = p.color;
      const deleteBtn = showControls
        ? `<button class="delete-btn" data-owner-id="${escapeHtml(p.owner_id)}"
                   style="margin-top: 10px; padding: 8px 16px; background: linear-gradient(45deg, #ff0040, #ff4081);
                          color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
             Delete Polygon
           </button>`
        : '';
      new mapboxgl.Popup({ closeButton: true, closeOnClick: true, className: 'dark-popup' })
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`<div style="background: #1a1a1a; color: white; padding: 15px; border-radius: 8px; border: 1px solid ${color};">
             <h3 style="color: ${color}; margin: 0 0 10px 0;">Owner Type: ${escapeHtml(owner_type)}</h3>
             <p style="margin: 5px 0; color: #ccc;">Owner ID: ${escapeHtml(p.owner_id)}</p>
             <p style="margin: 5px 0; color: #ccc;">Area: ${Number(p.area).toLocaleString()} m²</p>
             ${deleteBtn}
           </div>`)
        .addTo(map);
    });

    for (const layer of ['entity-clusters', 'entity-points']) {
      map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle, owner_type, showControls]);

  // ── Données ────────────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const { data } = await axiosInstance.get(`/api/points/map/${owner_type}/centroids`);
      if (!data.count) {
        if (showControls) setNotification({ type: "info", message: "No polygons found." });
        return;
      }
      setNotification(null);
      let w = 180, s = 90, e = -180, n = -90;
      const features = data.ids.map((id, i) => {
        const [lon, lat] = data.coords[i];
        if (lon < w) w = lon; if (lon > e) e = lon;
        if (lat < s) s = lat; if (lat > n) n = lat;
        return {
          type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: { owner_id: id, area: data.areas[i], color: GLOW[i % GLOW.length] },
        };
      });
      dataRef.current = { type: 'FeatureCollection', features };
      boundsRef.current = [[w, s], [e, n]];
      setPolygonCount(data.count);
      setTotalArea(data.total_area_m2);
      const map = mapRef.current;
      const src = map?.getSource('entities');
      if (src) {
        src.setData(dataRef.current);
        map.fitBounds(boundsRef.current, { padding: 50, duration: 0 });
      }
    } catch (error) {
      console.error('Error fetching polygons:', error);
      if (showControls) setNotification({ type: "error", message: "Error loading polygons." });
    }
  };

  useEffect(() => { loadData(); }, [owner_type, showControls]); // eslint-disable-line

  // ── Suppression ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showControls) return;
    const el = mapContainerRef.current;

    const handleDeleteClick = async (event) => {
      if (!event.target.classList.contains("delete-btn")) return;
      const ownerId = event.target.getAttribute("data-owner-id");
      if (!window.confirm(`Are you sure you want to delete the polygon with owner ID: ${ownerId}?`)) return;
      try {
        const response = await axiosInstance.delete(`/api/points/owner/${ownerId}`);
        if (response.status === 204) {
          document.querySelectorAll(".mapboxgl-popup").forEach(p => p.remove());
          const removed = dataRef.current.features.find(f => f.properties.owner_id === ownerId);
          dataRef.current = {
            ...dataRef.current,
            features: dataRef.current.features.filter(f => f.properties.owner_id !== ownerId),
          };
          mapRef.current?.getSource('entities')?.setData(dataRef.current);
          setPolygonCount(c => c - 1);
          setTotalArea(a => a - (removed?.properties.area || 0));
          setNotification({ type: "info", message: `Polygon with owner ID: ${ownerId} deleted successfully.` });
        } else {
          setNotification({ type: "error", message: `Failed to delete polygon with owner ID: ${ownerId}.` });
        }
      } catch (error) {
        console.error("Error deleting polygon:", error);
        setNotification({ type: "error", message: `Error deleting polygon with owner ID: ${ownerId}.` });
      }
    };

    el?.addEventListener("click", handleDeleteClick);
    return () => el?.removeEventListener("click", handleDeleteClick);
  }, [owner_type, showControls]);

  return (
    <div className="relative" style={{ height }}>
      <style>{`
        .dark-popup .mapboxgl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .dark-popup .mapboxgl-popup-tip {
          display: none !important;
        }
      `}</style>

      {notification && showControls && (
        <div
          className={`absolute top-4 right-2 z-10 px-4 py-2 rounded-md shadow-lg transition-shadow duration-300 focus:outline-none ${
            notification.type === "info"
              ? "bg-cyan-500 text-black"
              : "bg-red-500 text-white"
          }`}
          style={{
            boxShadow: notification.type === "info"
              ? "0 0 20px rgba(0, 255, 209, 0.5)"
              : "0 0 20px rgba(255, 0, 0, 0.5)"
          }}
        >
          {notification.message}
        </div>
      )}

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {showControls && (
        <div
          className="absolute bottom-4 left-4 rounded-lg p-4 shadow-lg"
          style={{
            background: 'rgba(26, 26, 26, 0.9)',
            border: '1px solid #00FFD1',
            boxShadow: '0 0 20px rgba(0, 255, 209, 0.3)'
          }}
        >
          <div className="text-sm text-white">
            <p><strong style={{color: '#00FFD1'}}>Polygons:</strong> {polygonCount.toLocaleString()}</p>
            <p><strong style={{color: '#00FFD1'}}>Total Area:</strong> {(totalArea / 10000).toFixed(2)} ha</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxExample;
