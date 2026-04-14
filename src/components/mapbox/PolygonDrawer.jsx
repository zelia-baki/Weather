import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import * as turf from "@turf/turf";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const PolygonDrawer = ({
  initialCenter = [32.5825, 0.3476],
  zoom = 8,
  onChange,
  highlightModeToggle = "",
  highlightSearchBar = "",
  highlightPointModeInfo = "",
  highlightDrawControls = "",
  fullscreen = false,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  const [polygonGeoJSON, setPolygonGeoJSON] = useState(null);
  const [area, setArea] = useState(null);
  const [properties, setProperties] = useState([]);
  const [isPointMode, setIsPointMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [currentMarker, setCurrentMarker] = useState(null);
  const [polygonMarkers, setPolygonMarkers] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const isPointModeRef = useRef(isPointMode);
  useEffect(() => { isPointModeRef.current = isPointMode; }, [isPointMode]);

  // ─── MAP INIT ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;


    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: initialCenter,
      zoom,
    });
    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    map.addControl(draw);
    drawRef.current = draw;

    const coordinatesGeocoder = (query) => {
      const matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
      );
      if (!matches) return null;
      const c1 = Number(matches[1]), c2 = Number(matches[2]);
      if (c1 < -90 || c1 > 90 || c2 < -180 || c2 > 180) return null;
      return [{
        center: [c2, c1],
        geometry: { type: "Point", coordinates: [c2, c1] },
        place_name: `Lat: ${c1}, Lng: ${c2}`,
        place_type: ["coordinate"],
        properties: {},
        type: "Feature",
      }];
    };

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      placeholder: "Search place or coordinates…",
      localGeocoder: coordinatesGeocoder,
      reverseGeocode: true,
    });
    map.addControl(geocoder);

    geocoder.on("result", (e) => {
      const [lng, lat] = e.result.geometry.coordinates;
      if (currentMarker) currentMarker.remove();
      const marker = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([lng, lat])
        .addTo(map);
      const popup = new mapboxgl.Popup({ offset: 28, maxWidth: "220px" }).setHTML(`
        <div style="font-family:'DM Sans',sans-serif;padding:8px 4px;text-align:center;">
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">
            ${lng.toFixed(5)}, ${lat.toFixed(5)}
          </div>
          ${isPointModeRef.current
            ? `<button onclick="window.addPolygonPoint(${lng},${lat})"
                style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;
                       border:none;padding:6px 14px;border-radius:6px;cursor:pointer;
                       font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;
                       box-shadow:0 2px 8px rgba(34,197,94,0.4);">
                ＋ Add Point
               </button>`
            : ""}
        </div>`);
      marker.setPopup(popup);
      popup.addTo(map);
      setCurrentMarker(marker);
    });

    const updatePolygon = () => {
      const data = draw.getAll();
      if (data.features.length > 0) {
        const poly = data.features[0];
        setArea(Math.round(turf.area(poly)));
        setPolygonGeoJSON(poly);
        if (onChange) onChange(poly);
      } else {
        setArea(null);
        setPolygonGeoJSON(null);
        if (onChange) onChange(null);
      }
    };

    map.on("draw.create", updatePolygon);
    map.on("draw.update", updatePolygon);
    map.on("draw.delete", updatePolygon);

    return () => {
      polygonMarkers.forEach((m) => m.remove());
      if (currentMarker) currentMarker.remove();
      map.remove();
    };
  }, []);

  // ─── POINT MODE ───────────────────────────────────────────────────────────
  useEffect(() => {
    window.addPolygonPoint = (lng, lat) => {
      const newPoints = [...polygonPoints, [lng, lat]];
      setPolygonPoints(newPoints);
      const marker = new mapboxgl.Marker({ color: "#22c55e", scale: 0.75 })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      setPolygonMarkers((prev) => [...prev, marker]);
      if (currentMarker) { currentMarker.remove(); setCurrentMarker(null); }
      if (newPoints.length >= 3) {
        const closedCoords = [...newPoints, newPoints[0]];
        const feat = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [closedCoords] } };
        drawRef.current.deleteAll();
        drawRef.current.add(feat);
        setArea(Math.round(turf.area(feat)));
        setPolygonGeoJSON(feat);
        if (onChange) onChange(feat);
      }
    };
    return () => { delete window.addPolygonPoint; };
  }, [polygonPoints, currentMarker, onChange]);

  const togglePointMode = () => {
    setIsPointMode((p) => { if (p) resetPolygon(); return !p; });
  };
  const resetPolygon = () => {
    setPolygonPoints([]);
    polygonMarkers.forEach((m) => m.remove());
    setPolygonMarkers([]);
    if (currentMarker) { currentMarker.remove(); setCurrentMarker(null); }
    drawRef.current?.deleteAll();
    setArea(null);
    setPolygonGeoJSON(null);
    if (onChange) onChange(null);
  };

  const addProperty = () => setProperties([...properties, { name: "", value: "" }]);
  const updateProperty = (i, k, v) => {
    const u = [...properties]; u[i][k] = v; setProperties(u); syncProperties(u);
  };
  const removeProperty = (i) => {
    const u = properties.filter((_, j) => j !== i); setProperties(u); syncProperties(u);
  };
  const syncProperties = (props) => {
    if (polygonGeoJSON) {
      const n = { ...polygonGeoJSON, properties: Object.fromEntries(props.map((p) => [p.name || "undefined", p.value])) };
      setPolygonGeoJSON(n);
      if (onChange) onChange(n);
    }
  };

  const wrapperHeight = fullscreen ? "h-screen" : "h-[calc(100vh-200px)] min-h-[480px]";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pd-panel {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(160deg, #0c1f0e 0%, #0f2712 100%);
          border-left: 1px solid rgba(74,222,128,0.1);
        }

        .pd-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(74,222,128,0.6);
          margin-bottom: 10px;
        }

        .pd-mode-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 13px;
          border-radius: 7px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          border: 1.5px solid;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .pd-mode-btn.draw {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.7);
        }
        .pd-mode-btn.draw:hover {
          background: rgba(255,255,255,0.09);
          color: #fff;
        }
        .pd-mode-btn.point {
          border-color: rgba(74,222,128,0.4);
          background: rgba(74,222,128,0.1);
          color: #86efac;
        }

        .pd-tip-box {
          background: rgba(59,130,246,0.08);
          border: 1px solid rgba(59,130,246,0.15);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
        }
        .pd-tip-box strong { color: rgba(147,197,253,0.9); }

        .pd-area-box {
          background: rgba(74,222,128,0.07);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 8px;
          padding: 12px 14px;
        }

        .pd-done-box {
          background: rgba(74,222,128,0.05);
          border: 1px solid rgba(74,222,128,0.15);
          border-radius: 8px;
          padding: 10px 14px;
        }

        .pd-prop-input {
          width: 100%;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.8);
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 5px;
          transition: border-color 0.2s;
        }
        .pd-prop-input:focus {
          outline: none;
          border-color: rgba(74,222,128,0.4);
        }
        .pd-prop-input::placeholder { color: rgba(255,255,255,0.25); }

        .pd-add-btn {
          width: 100%;
          padding: 8px;
          border-radius: 7px;
          border: 1.5px dashed rgba(59,130,246,0.3);
          background: rgba(59,130,246,0.06);
          color: rgba(147,197,253,0.8);
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pd-add-btn:hover {
          border-color: rgba(59,130,246,0.55);
          background: rgba(59,130,246,0.1);
          color: #93c5fd;
        }

        .pd-reset-btn {
          width: 100%;
          padding: 6px;
          border-radius: 6px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: rgba(252,165,165,0.8);
          font-size: 11px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pd-reset-btn:hover {
          background: rgba(239,68,68,0.14);
          color: #fca5a5;
        }

        .pd-mobile-toggle {
          position: absolute;
          bottom: 16px;
          right: 16px;
          z-index: 1001;
          background: linear-gradient(135deg,#0c1f0e,#0f2712);
          border: 1px solid rgba(74,222,128,0.25);
          color: rgba(74,222,128,0.9);
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pd-point-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: rgba(74,222,128,0.2);
          border: 1px solid rgba(74,222,128,0.3);
          font-size: 11px;
          font-weight: 600;
          color: #86efac;
          margin-left: auto;
        }

        .pd-scrollbar::-webkit-scrollbar { width: 4px; }
        .pd-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .pd-scrollbar::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius: 2px; }
      `}</style>

      <div className={`relative w-full flex flex-col md:flex-row ${wrapperHeight}`}>

        {/* MAP */}
        <div
          ref={mapContainerRef}
          className={`flex-1 h-[55vh] md:h-full relative ${highlightDrawControls}`}
        />

        {/* Search highlight overlay */}
        {highlightSearchBar && (
          <div className={`absolute top-0 left-0 w-full pointer-events-none z-[9999] ${highlightSearchBar}`}>
            <div className="h-12 mx-4 mt-4" />
          </div>
        )}

        {/* Mobile toggle */}
        <button className="pd-mobile-toggle md:hidden" onClick={() => setPanelOpen((v) => !v)}>
          {panelOpen
            ? <><span>✕</span><span>Close</span></>
            : <><span>⚙️</span><span>Options</span></>}
        </button>

        {/* PANEL */}
        <div className={`
          pd-panel pd-scrollbar
          w-full md:w-72
          overflow-y-auto
          transition-all duration-300
          ${panelOpen ? "block" : "hidden"} md:block
          max-h-[45vh] md:max-h-none md:h-full
          z-10
        `}>
          <div className="p-5 space-y-5">

            {/* Header */}
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <div style={{
                width: 28, height: 28,
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}>🗺️</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: '#f0fdf4' }}>
                  Polygon Creator
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Draw or point mode</div>
              </div>
            </div>

            {/* Mode toggle */}
            <div className={highlightModeToggle}>
              <div className="pd-section-title">Construction Mode</div>
              <button onClick={togglePointMode} className={`pd-mode-btn ${isPointMode ? "point" : "draw"}`}>
                <span>{isPointMode ? "🎯" : "✏️"}</span>
                <span>{isPointMode ? "Point Mode" : "Draw Mode"}</span>
                {isPointMode && polygonPoints.length > 0 && (
                  <span className="pd-point-badge">{polygonPoints.length}</span>
                )}
              </button>

              {isPointMode && (
                <div className="mt-3 text-xs text-white/45 space-y-1 pl-1">
                  <div>→ Search a location</div>
                  <div>→ Click "Add Point" on marker</div>
                  <div>→ 3+ points to form polygon</div>
                </div>
              )}

              {isPointMode && polygonPoints.length > 0 && (
                <button onClick={resetPolygon} className="pd-reset-btn mt-3">
                  🗑 Reset all points
                </button>
              )}
            </div>

            {/* Tips */}
            <div className={highlightPointModeInfo}>
              <div className="pd-section-title">Search Tips</div>
              <div className="pd-tip-box">
                <div>🏙 <strong>Place:</strong> "Paris", "Kampala"</div>
                <div>📍 <strong>Coords:</strong> "Lat: -12.34, Lng: 56.78"</div>
                <div>⚡ <strong>Quick:</strong> "-12.34, 56.78"</div>
                {isPointMode && (
                  <div className="mt-2 pt-2 border-t border-white/5 text-green-300/70">
                    <strong style={{ color: '#86efac' }}>Point Mode:</strong>
                    <div>Click "Add Point" on markers</div>
                  </div>
                )}
              </div>
            </div>

            {/* Point list */}
            {isPointMode && polygonPoints.length > 0 && (
              <div>
                <div className="pd-section-title">Polygon Points ({polygonPoints.length})</div>
                <div className="space-y-1 max-h-28 overflow-y-auto pd-scrollbar">
                  {polygonPoints.map((pt, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                      <span className="text-green-400/60 font-mono">{String(i + 1).padStart(2, "0")}</span>
                      <span>{pt[0].toFixed(4)}, {pt[1].toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Properties */}
            <div className="border-t border-white/5 pt-4">
              <div className="pd-section-title">Properties</div>
              {properties.map((prop, i) => (
                <div key={i} className="mb-3 pb-3 border-b border-white/5">
                  <input
                    type="text"
                    placeholder="Name"
                    value={prop.name}
                    onChange={(e) => updateProperty(i, "name", e.target.value)}
                    className="pd-prop-input"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={prop.value}
                    onChange={(e) => updateProperty(i, "value", e.target.value)}
                    className="pd-prop-input"
                  />
                  <button onClick={() => removeProperty(i)} className="text-red-400/60 text-xs hover:text-red-400 transition-colors">
                    ✕ Remove
                  </button>
                </div>
              ))}
              <button onClick={addProperty} className="pd-add-btn">＋ Add property</button>
            </div>

            {/* Area */}
            {area && (
              <div className="pd-area-box">
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, color: 'rgba(74,222,128,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Calculated Area
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80', fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>
                  {(area / 10000).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                  hectares · {area.toLocaleString()} m²
                </div>
              </div>
            )}

            {/* Polygon done */}
            {polygonGeoJSON && (
              <div className="pd-done-box flex items-center gap-3">
                <div style={{ fontSize: 20 }}>✅</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, color: '#86efac', fontWeight: 700 }}>
                    Polygon complete
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {polygonGeoJSON.geometry.coordinates[0].length - 1} vertices
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default PolygonDrawer;