// StaticForestMap.jsx - VERSION CORRIGÉE ET VALIDE
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

const StaticForestMap = ({
  treeCoverData = [],
  mapboxToken,
  title = "Tree Cover Analysis",
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stats, setStats] = useState({ total: 0, avgCover: 0, bounds: null });

  // 🧭 Calcul bornes et stats
  useEffect(() => {
    if (treeCoverData.length === 0) return;
    const total = treeCoverData.length;
    const avgCover = Math.round(
      treeCoverData.reduce(
        (sum, d) => sum + d.wri_tropical_tree_cover_extent__decile,
        0
      ) / total
    );
    const lats = treeCoverData.map((d) => d.latitude);
    const lngs = treeCoverData.map((d) => d.longitude);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
      centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
    setStats({ total, avgCover, bounds });
  }, [treeCoverData]);

  // GeoJSON
  const createGeoJSON = (data) => ({
    type: "FeatureCollection",
    features: data.map((item) => ({
      type: "Feature",
      properties: {
        value: item.wri_tropical_tree_cover_extent__decile,
        driver: item.tsc_tree_cover_loss_drivers__driver || "N/A",
      },
      geometry: {
        type: "Point",
        coordinates: [item.longitude, item.latitude],
      },
    })),
  });

  // 📸 Capture finale propre
  const generateMapImage = () => {
    if (!map.current) return;
    setTimeout(() => {
      const canvas = map.current.getCanvas();
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = 400;
      exportCanvas.height = 400;
      const ctx = exportCanvas.getContext("2d");

      const sourceSize = Math.min(canvas.width, canvas.height);
      const sourceX = (canvas.width - sourceSize) / 2;
      const sourceY = (canvas.height - sourceSize) / 2;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      ctx.drawImage(
        canvas,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        exportCanvas.width,
        exportCanvas.height
      );

      // 🏷️ Bloc titre + infos
      const titleBlockWidth = 250;
      const titleBlockHeight = 65;
      const titleBlockX = 20;
      const titleBlockY = 20;

      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(titleBlockX, titleBlockY, titleBlockWidth, titleBlockHeight);

      ctx.fillStyle = "#005f2f";
      ctx.font = "bold 16px Arial";
      ctx.fillText(title, titleBlockX + 10, titleBlockY + 20);

      ctx.fillStyle = "#222";
      ctx.font = "11px Arial";
      const today = new Date().toLocaleDateString();
      ctx.fillText(`Generated: ${today}`, titleBlockX + 10, titleBlockY + 40);
      ctx.fillText(
        `Points: ${stats.total} | Avg. Cover: ${stats.avgCover}%`,
        titleBlockX + 10,
        titleBlockY + 55
      );

      // 🟩 Légende
      const legendItems = [
        { color: "#f7fcf5", label: "0–10%" },
        { color: "#c7e9c0", label: "20–30%" },
        { color: "#74c476", label: "40–50%" },
        { color: "#238b45", label: "60–70%" },
        { color: "#006d2c", label: "80–90%" },
        { color: "#00441b", label: "90–100%" },
      ];

      const legendWidth = 95;
      const legendHeight = 15 + legendItems.length * 15;
      const startX = exportCanvas.width - legendWidth - 10;
      const startY = exportCanvas.height - legendHeight - 10;
      const itemBoxSize = 12;
      const itemLineHeight = 15;

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(startX, startY, legendWidth, legendHeight);

      ctx.font = "bold 10px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText("Forest Cover", startX + 5, startY + 12);

      legendItems.forEach((item, i) => {
        const y = startY + 18 + i * itemLineHeight;
        ctx.fillStyle = item.color;
        ctx.fillRect(startX + 5, y, itemBoxSize, itemBoxSize);
        ctx.strokeStyle = "#666";
        ctx.strokeRect(startX + 5, y, itemBoxSize, itemBoxSize);
        ctx.fillStyle = "#000";
        ctx.font = "9px Arial";
        ctx.fillText(item.label, startX + 5 + itemBoxSize + 4, y + itemBoxSize - 3);
      });

      setCapturedImage(exportCanvas.toDataURL("image/png"));
    }, 500);
  };

  // 🗺️ Initialisation Mapbox
  useEffect(() => {
    if (map.current || treeCoverData.length === 0 || !mapboxToken || !stats.bounds) return;

    mapboxgl.accessToken = mapboxToken;
    const geojson = createGeoJSON(treeCoverData);

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [stats.bounds.centerLng, stats.bounds.centerLat],
      zoom: 14,
      preserveDrawingBuffer: true,
    });

    map.current.on("load", () => {
      map.current.addSource("tree-cover-data", {
        type: "geojson",
        data: geojson,
      });

      // Heatmap
      map.current.addLayer({
        id: "tree-heatmap",
        type: "heatmap",
        source: "tree-cover-data",
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0,
            0,
            100,
            1,
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 20, 3],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(247,252,245,0)",
            0.2,
            "#c7e9c0",
            0.4,
            "#74c476",
            0.6,
            "#238b45",
            0.8,
            "#006d2c",
            1,
            "#00441b",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 20, 30],
          "heatmap-opacity": 0.7,
        },
      });

      // Points
      map.current.addLayer({
        id: "tree-points",
        type: "circle",
        source: "tree-cover-data",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 13, 3, 20, 10],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0,
            "#f7fcf5",
            20,
            "#c7e9c0",
            40,
            "#74c476",
            60,
            "#238b45",
            80,
            "#006d2c",
            100,
            "#00441b",
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": "#fff",
        },
      });

      if (stats.bounds) {
        map.current.once("idle", () => {
          map.current.fitBounds(
            [
              [stats.bounds.minLng, stats.bounds.minLat],
              [stats.bounds.maxLng, stats.bounds.maxLat],
            ],
            {
              padding: 50,
              maxZoom: 18,
              duration: 0,
            }
          );
          setTimeout(() => generateMapImage(), 1000);
        });
      }
    });
  }, [treeCoverData, mapboxToken, stats.bounds]);

  if (!mapboxToken || treeCoverData.length === 0) {
    return (
      <div className="w-full flex justify-center items-center bg-gray-50 h-96">
        <p className="text-gray-600">No data or token.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[400px]">
      {/* Carte invisible haute résolution */}
      <div
        ref={mapContainer}
        style={{
          width: "400px",
          height: "400px",
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {/* Image finale */}
      {capturedImage ? (
        <div className="flex justify-center items-center w-full" style={{ height: "400px" }}>
          <img
            src={capturedImage}
            alt="Forest map"
            className="w-full h-auto object-contain mx-auto"
            style={{ maxWidth: "400px", maxHeight: "400px" }}
          />
        </div>
      ) : (
        <div className="flex justify-center items-center bg-gray-50 w-full h-[400px]">
          <p className="text-gray-600">🕐 Generating centered map...</p>
        </div>
      )}
    </div>
  );
};

export default StaticForestMap;
