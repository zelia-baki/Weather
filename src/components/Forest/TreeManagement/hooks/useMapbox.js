// hooks/useMapbox.js
import { useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

export const useMapbox = (onMapClick) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [47.5079, -18.8792],
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  useEffect(() => {
    if (!map.current || !onMapClick) return;

    const handleClick = (e) => {
      onMapClick(e.lngLat);
    };

    map.current.on('click', handleClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleClick);
      }
    };
  }, [onMapClick]);

  const updateMarkers = useCallback((trees, onTreeClick, onEditTree, onDeleteTree) => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    trees.forEach(tree => {
      if (tree.point) {
        const el = document.createElement('div');
        el.className = 'tree-marker';
        el.innerHTML = `
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#10b981">
            <path d="M17,8C17,10.76 14.76,13 12,13C9.24,13 7,10.76 7,8C7,5.24 9.24,3 12,3C14.76,3 17,5.24 17,8M12,21L9,16H11V12H13V16H15L12,21Z"/>
          </svg>
        `;
        el.style.cursor = 'pointer';

        const popupContent = document.createElement('div');
        popupContent.style.padding = '10px';
        popupContent.innerHTML = `
          <div style="font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 10px 0; color: #047857; font-size: 16px; font-weight: bold;">${tree.name}</h3>
            <div style="color: #374151; font-size: 13px; line-height: 1.5;">
              <p style="margin: 4px 0;"><strong>Type:</strong> ${tree.type || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Forest:</strong> ${tree.forest_name || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Height:</strong> ${tree.height}m</p>
              <p style="margin: 4px 0;"><strong>Diameter:</strong> ${tree.diameter}cm</p>
              <p style="margin: 4px 0;"><strong>Planted:</strong> ${tree.date_planted || 'Unknown'}</p>
            </div>
            <div id="tree-actions-${tree.id}" style="margin-top: 12px; display: flex; gap: 8px;"></div>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px'
        }).setDOMContent(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([tree.point.longitude, tree.point.latitude])
          .setPopup(popup)
          .addTo(map.current);

        popup.on('open', () => {
          const actionsContainer = document.getElementById(`tree-actions-${tree.id}`);
          if (actionsContainer) {
            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View';
            viewBtn.style.cssText = 'padding: 6px 12px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 12px;';
            viewBtn.onclick = () => onTreeClick(tree);

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.cssText = 'padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 12px;';
            editBtn.onclick = () => onEditTree(tree);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.cssText = 'padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 12px;';
            deleteBtn.onclick = () => onDeleteTree(tree.id);

            actionsContainer.appendChild(viewBtn);
            actionsContainer.appendChild(editBtn);
            actionsContainer.appendChild(deleteBtn);
          }
        });

        markers.current.push(marker);
      }
    });
  }, []);

  const flyTo = useCallback((lng, lat, zoom = 15) => {
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        essential: true
      });
    }
  }, []);

  const addTemporaryMarker = useCallback((lng, lat) => {
    if (map.current) {
      return new mapboxgl.Marker({ color: '#10b981' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  }, []);

  return {
    mapContainer,
    map,
    markers,
    updateMarkers,
    flyTo,
    addTemporaryMarker
  };
};
