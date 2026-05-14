import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axiosInstance from "../../axiosInstance";
import * as turf from "@turf/turf";
import Swal from "sweetalert2";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q";

const COLORS = [
  "#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6",
];

const MAP_STYLES = [
  { id: "satellite",         label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "satellite-streets", label: "Hybrid",    url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "outdoors",          label: "Terrain",   url: "mapbox://styles/mapbox/outdoors-v12" },
];

const createFarmMarkerEl = (color) => {
  const el = document.createElement("div");
  el.style.cssText = "cursor:pointer;";
  el.innerHTML = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none"
         xmlns="http://www.w3.org/2000/svg"
         style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5));transition:transform .15s ease">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24S32 28 32 16C32 7.16 24.84 0 16 0Z"
            fill="${color}"/>
      <path d="M9 17L16 11L23 17" stroke="white" stroke-width="1.8"
            stroke-linejoin="round" fill="none" stroke-linecap="round"/>
      <rect x="11" y="17" width="10" height="7" rx="1"
            fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="1.5"/>
      <rect x="14.5" y="20.5" width="3" height="3.5" rx="0.5"
            fill="rgba(255,255,255,0.9)"/>
    </svg>
  `;
  el.addEventListener("mouseenter", () => {
    const svg = el.querySelector("svg");
    if (svg) svg.style.transform = "scale(1.25) translateY(-3px)";
  });
  el.addEventListener("mouseleave", () => {
    const svg = el.querySelector("svg");
    if (svg) svg.style.transform = "";
  });
  return el;
};

const loadingPopupHTML = () => `
  <div style="font-family:system-ui,sans-serif;min-width:200px;padding:4px;text-align:center">
    <div style="display:inline-block;width:18px;height:18px;border:2px solid #e5e7eb;
         border-top-color:#22c55e;border-radius:50%;animation:pspin .7s linear infinite;
         margin:8px 0 6px"></div>
    <p style="color:#6b7280;font-size:12px;margin:0">Loading farm info…</p>
  </div>
`;

const farmPopupHTML = (farm, ownerId, areaHa, color) => `
  <div style="font-family:system-ui,sans-serif;min-width:220px;padding:4px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;
         padding-bottom:10px;border-bottom:1px solid #f3f4f6">
      <div style="width:34px;height:34px;border-radius:50%;background:${color};
           display:flex;align-items:center;justify-content:center;
           color:white;font-weight:700;font-size:14px;flex-shrink:0">
        ${(farm?.name || "F")[0].toUpperCase()}
      </div>
      <div>
        <p style="margin:0;font-weight:700;color:#111827;font-size:13px;line-height:1.2">
          ${farm?.name || "Farm #" + ownerId}
        </p>
        <p style="margin:0;font-size:11px;color:#9ca3af;font-family:monospace">${ownerId}</p>
      </div>
    </div>
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      ${farm?.subcounty ? `<tr><td style="color:#6b7280;padding:3px 0">Country</td><td style="font-weight:600;color:#111827;text-align:right">${farm.subcounty}</td></tr>` : ""}
      ${farm?.gender    ? `<tr><td style="color:#6b7280;padding:3px 0">Gender</td><td style="font-weight:600;color:#111827;text-align:right">${farm.gender}</td></tr>` : ""}
      ${farm?.phonenumber1||farm?.phonenumber ? `<tr><td style="color:#6b7280;padding:3px 0">Phone</td><td style="font-weight:600;color:#111827;text-align:right">${farm?.phonenumber1||farm?.phonenumber}</td></tr>` : ""}
      <tr><td style="color:#6b7280;padding:3px 0">Area</td>
          <td style="text-align:right">
            <span style="background:#dcfce7;color:#16a34a;padding:1px 8px;
                   border-radius:99px;font-size:11px;font-weight:600">${areaHa} ha</span>
          </td></tr>
    </table>
    <button class="mapbox-delete-btn" data-owner-id="${ownerId}"
      style="margin-top:10px;width:100%;padding:7px;background:#fee2e2;color:#dc2626;
             border:1px solid #fecaca;border-radius:8px;cursor:pointer;
             font-size:11px;font-weight:600;font-family:inherit"
      onmouseover="this.style.background='#fecaca'"
      onmouseout="this.style.background='#fee2e2'">
      Delete polygon
    </button>
  </div>
`;

const Stat = ({ label, value, sub }) => (
  <div>
    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>
      {label}
    </p>
    <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{value}</p>
    {sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{sub}</p>}
  </div>
);

// =============================================================================
const MapViewAll = () => {
  const mapContainerRef = useRef();
  const mapRef          = useRef();
  const markersRef      = useRef([]);
  const boundsRef       = useRef(null);
  const location        = useLocation();
  const owner_type      = location.state?.owner_type || "farmer";

  const [polygons,     setPolygons]     = useState([]);
  const [totalArea,    setTotalArea]    = useState(0);
  const [zoom,         setZoom]         = useState("5.00");
  const [styleId,      setStyleId]      = useState("satellite");
  const [notification, setNotification] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [panelOpen,    setPanelOpen]    = useState(true);

  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[0].url,
      center: [32.5825, 0.3476],
      zoom: 5,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapRef.current.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "bottom-right");
    mapRef.current.on("move", () => setZoom(mapRef.current.getZoom().toFixed(2)));
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const s = MAP_STYLES.find(m => m.id === styleId);
    if (!s) return;
    mapRef.current.setStyle(s.url);
    mapRef.current.once("styledata", () => {
      if (polygons.length > 0) renderOnMap(polygons);
    });
  }, [styleId]); // eslint-disable-line

  const fetchPolygons = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(`/api/points/getallbyownertype/${owner_type}`);
      if (!r.data.polygons?.length) {
        setNotification({ type: "info", message: "No polygons found for this owner type." });
        setLoading(false);
        return;
      }
      setPolygons(r.data.polygons);
      setNotification(null);
    } catch {
      setNotification({ type: "error", message: "Failed to load polygons." });
    } finally {
      setLoading(false);
    }
  }, [owner_type]);

  useEffect(() => { fetchPolygons(); }, [fetchPolygons]);

  const renderOnMap = useCallback((polys) => {
    if (!mapRef.current || polys.length === 0) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds  = new mapboxgl.LngLatBounds();
    let   totalM2 = 0;

    const features = polys.map((polygon, index) => {
      const rawCoords = polygon.points.map(p => [p.longitude, p.latitude]);

      // ── KEY FIX: ensure ring is closed before creating GeoJSON ──────────
      const coordinates = [...rawCoords];
      if (coordinates.length >= 3) {
        const [fx, fy] = coordinates[0];
        const [lx, ly] = coordinates[coordinates.length - 1];
        if (fx !== lx || fy !== ly) coordinates.push([fx, fy]);
      }

      const polygonGeoJSON = {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coordinates] },
        properties: {},
      };

      const area     = Math.round(turf.area(polygonGeoJSON) * 100) / 100;
      const centroid = turf.centroid(polygonGeoJSON);
      const color    = COLORS[index % COLORS.length];

      totalM2 += area;
      coordinates.forEach(coord => bounds.extend(coord));

      const lngLat  = centroid.geometry.coordinates;
      const ownerId = polygon.owner_id;
      const areaHa  = (area / 10000).toFixed(4);

      const markerEl = createFarmMarkerEl(color);
      markerEl.addEventListener("click", async (e) => {
        e.stopPropagation();
        const popup = new mapboxgl.Popup({
          maxWidth: "270px", className: "farm-popup", offset: [0, -36],
        })
          .setLngLat(lngLat)
          .setHTML(loadingPopupHTML())
          .addTo(mapRef.current);

        try {
          const res  = await axiosInstance.get(`/api/farm/${ownerId}`);
          const farm = res.data?.data || res.data || null;
          popup.setHTML(farmPopupHTML(farm, ownerId, areaHa, color));
        } catch {
          popup.setHTML(farmPopupHTML(null, ownerId, areaHa, color));
        }
      });

      const marker = new mapboxgl.Marker({ element: markerEl, anchor: "bottom" })
        .setLngLat(lngLat)
        .addTo(mapRef.current);
      markersRef.current.push(marker);

      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coordinates] },
        properties: { id: index, owner_type: polygon.owner_type, owner_id: ownerId, area, color },
      };
    });

    setTotalArea((totalM2 / 10000).toFixed(2));

    const geojson = { type: "FeatureCollection", features };
    const src     = mapRef.current.getSource("polygons");
    if (src) {
      src.setData(geojson);
    } else {
      mapRef.current.addSource("polygons", { type: "geojson", data: geojson });
      mapRef.current.addLayer({ id: "polygons-fill", type: "fill", source: "polygons",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.3 } });
      mapRef.current.addLayer({ id: "polygons-outline", type: "line", source: "polygons",
        paint: { "line-color": ["get", "color"], "line-width": 2, "line-opacity": 0.9 } });
      mapRef.current.addLayer({ id: "polygons-hover", type: "fill", source: "polygons",
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.55 },
        filter: ["==", "id", -1] });
      mapRef.current.on("mouseenter", "polygons-fill", (e) => {
        mapRef.current.getCanvas().style.cursor = "pointer";
        mapRef.current.setFilter("polygons-hover", ["==", "id", e.features[0].properties.id]);
      });
      mapRef.current.on("mouseleave", "polygons-fill", () => {
        mapRef.current.getCanvas().style.cursor = "";
        mapRef.current.setFilter("polygons-hover", ["==", "id", -1]);
      });
    }

    boundsRef.current = bounds;
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });

  }, []);

  useEffect(() => {
    if (!mapRef.current || polygons.length === 0) return;
    const run = () => renderOnMap(polygons);
    if (mapRef.current.isStyleLoaded()) run();
    else mapRef.current.on("load", run);
  }, [polygons, renderOnMap]);

  useEffect(() => {
    const handleClick = async (e) => {
      if (!e.target.classList.contains("mapbox-delete-btn")) return;
      const ownerId = e.target.getAttribute("data-owner-id");
      const result  = await Swal.fire({
        title: "Delete polygon?",
        html: `<p style="color:#6b7280;font-size:14px">Remove boundary for <strong>${owner_type} #${ownerId}</strong>?</p>`,
        icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, delete", customClass: { popup: "rounded-2xl" },
      });
      if (!result.isConfirmed) return;
      try {
        await axiosInstance.delete(`/api/points/owner/${ownerId}`);
        document.querySelectorAll(".mapboxgl-popup").forEach(p => p.remove());
        Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
        await fetchPolygons();
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete.", customClass: { popup: "rounded-2xl" } });
      }
    };
    const el = mapContainerRef.current;
    if (el) el.addEventListener("click", handleClick);
    return () => { if (el) el.removeEventListener("click", handleClick); };
  }, [owner_type, fetchPolygons]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const typeLabel = { farmer: "Farm", forest: "Forest" }[owner_type] || "Entity";
  const zoomToAll = () => {
    if (!mapRef.current || !boundsRef.current) return;
    mapRef.current.fitBounds(boundsRef.current, { padding: 60, maxZoom: 14, duration: 900 });
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 60px)",
                  fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>

      <style>{`
        @keyframes pspin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0;transform:translateY(-6px); } to { opacity:1;transform:none; } }
        .farm-popup .mapboxgl-popup-content {
          padding: 14px 16px !important; border-radius: 14px !important;
          box-shadow: 0 10px 32px rgba(0,0,0,0.18) !important;
          border: 1px solid #e5e7eb !important;
        }
        .farm-popup .mapboxgl-popup-tip { border-top-color: white !important; }
      `}</style>

      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }}/>

      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
          <div style={{ background: "rgba(10,18,12,0.92)", backdropFilter: "blur(12px)",
            borderRadius: 16, padding: "24px 32px", textAlign: "center",
            border: "1px solid rgba(34,197,94,0.2)" }}>
            <div style={{ width: 34, height: 34, border: "3px solid rgba(255,255,255,0.15)",
              borderTopColor: "#22c55e", borderRadius: "50%",
              animation: "pspin .7s linear infinite", margin: "0 auto 12px" }}/>
            <p style={{ color: "#e2f5e8", fontSize: 13, fontWeight: 500, margin: 0 }}>
              Loading polygons…
            </p>
          </div>
        </div>
      )}

      {notification && (
        <div style={{ position: "absolute", top: 16, left: "50%",
          transform: "translateX(-50%)", zIndex: 40, animation: "fadeIn .25s ease",
          display: "flex", alignItems: "center", gap: 10, padding: "11px 18px",
          borderRadius: 10, maxWidth: 360, backdropFilter: "blur(12px)",
          background: notification.type === "error" ? "rgba(127,29,29,0.92)" : "rgba(30,58,138,0.92)",
          border: `1px solid ${notification.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)"}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", color: "#fff", fontSize: 13, fontWeight: 500 }}>
          {notification.message}
          <button onClick={() => setNotification(null)}
            style={{ marginLeft: 8, background: "none", border: "none",
              color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16, padding: 0 }}>
            ×
          </button>
        </div>
      )}

      {/* Stats panel */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20,
        width: panelOpen ? 244 : 44, overflow: "hidden",
        background: "rgba(10,18,12,0.88)", backdropFilter: "blur(20px)",
        borderRadius: 14, border: "1px solid rgba(34,197,94,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        transition: "width .3s cubic-bezier(.22,1,.36,1)" }}>

        <button onClick={() => setPanelOpen(o => !o)}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 5,
            width: 24, height: 24, borderRadius: 6, cursor: "pointer",
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#4ade80", fontSize: 13, display: "flex", alignItems: "center",
            justifyContent: "center" }}>
          {panelOpen ? "‹" : "›"}
        </button>

        {!panelOpen && (
          <div style={{ padding: "12px 0 10px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%",
              background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.5)" }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4ade80",
              fontFamily: "monospace" }}>{polygons.length}</span>
          </div>
        )}

        {panelOpen && (
          <div style={{ padding: "14px 16px 16px", animation: "fadeIn .2s ease" }}>
            <div style={{ marginBottom: 14, paddingRight: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e" }}/>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#4ade80" }}>
                  {typeLabel} Overview
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e2f5e8",
                letterSpacing: "-0.01em" }}>
                All {typeLabel} Boundaries
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Stat label="Polygons"   value={polygons.length}    sub={`${typeLabel}s mapped`}/>
              <Stat label="Total Area" value={`${totalArea} ha`}  sub="combined coverage"/>
              <Stat label="Zoom"       value={zoom}               sub="current level"/>
              <Stat label="Type"       value={typeLabel}          sub={owner_type}/>
            </div>

            <div style={{ height: 1, background: "rgba(34,197,94,0.1)", margin: "14px 0 10px" }}/>

            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
              Map Style
            </p>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {MAP_STYLES.map(s => (
                <button key={s.id} onClick={() => setStyleId(s.id)}
                  style={{ flex: 1, padding: "5px 4px", borderRadius: 6, cursor: "pointer",
                    background: styleId === s.id ? "rgba(34,197,94,0.2)" : "transparent",
                    border: `1px solid ${styleId === s.id ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: styleId === s.id ? "#4ade80" : "rgba(255,255,255,0.4)",
                    fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}>
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={zoomToAll}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                  background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93c5fd", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                Zoom to All
              </button>
              <button onClick={fetchPolygons}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                  color: "#4ade80", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                Refresh
              </button>
            </div>

            <p style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.3)",
              textAlign: "center", lineHeight: 1.4 }}>
              Click a marker to view farm details
            </p>
          </div>
        )}
      </div>

      {polygons.length > 0 && !loading && (
        <div style={{ position: "absolute", bottom: 40, left: "50%",
          transform: "translateX(-50%)", zIndex: 20,
          background: "rgba(10,18,12,0.82)", backdropFilter: "blur(12px)",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          padding: "8px 18px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)", animation: "fadeIn .4s ease",
          maxWidth: "80vw" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {polygons.slice(0, Math.min(8, polygons.length)).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%",
                background: COLORS[i % COLORS.length],
                border: "1px solid rgba(255,255,255,0.3)" }}/>
            ))}
            {polygons.length > 8 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: "10px" }}>
                +{polygons.length - 8}
              </span>
            )}
          </div>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }}/>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
            <strong style={{ color: "#fff" }}>{polygons.length}</strong>{" "}
            {typeLabel}{polygons.length !== 1 ? "s" : ""} ·{" "}
            <strong style={{ color: "#4ade80" }}>{totalArea} ha</strong> total
          </span>
        </div>
      )}
    </div>
  );
};

export default MapViewAll;