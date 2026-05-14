import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axiosInstance from "../../axiosInstance";
import * as turf from "@turf/turf";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MAP_STYLES = [
  { id: "satellite",         label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "satellite-streets", label: "Hybrid",    url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "outdoors",          label: "Terrain",   url: "mapbox://styles/mapbox/outdoors-v12" },
];

// ── Exact same farm pin as MapViewAll ────────────────────────────────────────
const createFarmMarkerEl = (color = "#22c55e") => {
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
    </svg>`;
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

// ── Stat chip — same as MapViewAll ───────────────────────────────────────────
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

// ── Main ─────────────────────────────────────────────────────────────────────
const MapView = () => {
  const location    = useLocation();
  const owner_id    = location.state?.owner_id;
  const owner_type  = location.state?.owner_type;
  const geolocation = location.state?.geolocation;

  let longitude = "32.5825";
  let latitude  = "0.3476";
  if (geolocation?.includes(",")) {
    [longitude, latitude] = geolocation.split(",").map(s => s.trim());
  }

  const mapContainerRef = useRef();
  const mapRef          = useRef();
  const markerRef       = useRef();
  const popupRef        = useRef();
  const boundsRef       = useRef(null);       // for "Zoom to Farm"
  const polygonDataRef  = useRef(null);

  const [zoom,         setZoom]         = useState("15.00");
  const [area,         setArea]         = useState(null);
  const [areaHa,       setAreaHa]       = useState(null);
  const [treeCount,    setTreeCount]    = useState(null);
  const [vertexCount,  setVertexCount]  = useState(null);
  const [notification, setNotification] = useState(null);
  const [styleId,      setStyleId]      = useState("satellite");
  const [panelOpen,    setPanelOpen]    = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [farmInfo,     setFarmInfo]     = useState(null);

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[0].url,
      center: [parseFloat(longitude), parseFloat(latitude)],
      zoom: 15,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapRef.current.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "bottom-right");
    mapRef.current.on("move", () => setZoom(mapRef.current.getZoom().toFixed(2)));
  }, []);

  // ── Style switch ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const s = MAP_STYLES.find(m => m.id === styleId);
    if (!s) return;
    mapRef.current.setStyle(s.url);
    mapRef.current.once("styledata", () => { if (area !== null) renderPolygon(); });
  }, [styleId]); // eslint-disable-line

  // ── Fetch farm meta ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!owner_id || !owner_type) return;
    axiosInstance
      .get(`/api/${owner_type === "farmer" ? "farm" : "forest"}/${owner_id}`)
      .then(r => setFarmInfo(r.data?.data || r.data || null))
      .catch(() => {});
  }, [owner_id, owner_type]);

  // ── Render polygon layers ─────────────────────────────────────────────────
  const renderPolygon = () => {
    const map = mapRef.current;
    const gj  = polygonDataRef.current;
    if (!map || !gj) return;

    ["polygon-hover", "polygon-outline", "polygon-fill"].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource("polygon")) map.removeSource("polygon");

    map.addSource("polygon", { type: "geojson", data: gj });
    map.addLayer({
      id: "polygon-fill", type: "fill", source: "polygon",
      paint: { "fill-color": "#22c55e", "fill-opacity": 0.3 },
    });
    map.addLayer({
      id: "polygon-outline", type: "line", source: "polygon",
      paint: { "line-color": "#4ade80", "line-width": 2, "line-opacity": 0.9 },
    });
    map.addLayer({
      id: "polygon-hover", type: "fill", source: "polygon",
      paint: { "fill-color": "#22c55e", "fill-opacity": 0.55 },
      filter: ["==", "id", -1],
    });
    map.on("mouseenter", "polygon-fill", () => {
      map.getCanvas().style.cursor = "pointer";
      map.setFilter("polygon-hover", ["==", "$type", "Polygon"]);
    });
    map.on("mouseleave", "polygon-fill", () => {
      map.getCanvas().style.cursor = "";
      map.setFilter("polygon-hover", ["==", "id", -1]);
    });
  };

  // ── Fetch points ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !owner_id || !owner_type) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(
          `/api/points/getbyownerid/${owner_type}/${owner_id}`
        );
        const points = data.points || [];

        if (points.length === 0) {
          setNotification({ type: "info", message: "No boundary points found." });
          setLoading(false);
          return;
        }

        // ── Ensure ring is closed (first === last) ──────────────────────────
        const rawCoords = points.map(p => [p.longitude, p.latitude]);
        const ring = [...rawCoords];
        if (ring.length >= 3) {
          const [fx, fy] = ring[0];
          const [lx, ly] = ring[ring.length - 1];
          if (fx !== lx || fy !== ly) ring.push([fx, fy]);
        }

        const geojson = {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [ring] },
          properties: {},
        };
        polygonDataRef.current = geojson;

        const m2  = turf.area(geojson);
        const ha  = m2 / 10000;
        setArea(Math.round(m2));
        setAreaHa(ha.toFixed(4));
        setTreeCount(Math.round(m2 / 4));
        setVertexCount(ring.length - 1);

        const centroid  = turf.centroid(geojson);
        const [cLng, cLat] = centroid.geometry.coordinates;

        // Bounds for "Zoom to Farm"
        const bounds = ring.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(ring[0], ring[0])
        );
        boundsRef.current = bounds;

        const doRender = () => {
          renderPolygon();
          map.fitBounds(bounds, { padding: 60, maxZoom: 14 });

          if (markerRef.current) markerRef.current.remove();
          const el = createFarmMarkerEl("#22c55e");
          markerRef.current = new mapboxgl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([cLng, cLat])
            .addTo(map);

          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new mapboxgl.Popup({
            closeButton: false, closeOnClick: false,
            offset: [0, -42], maxWidth: "200px", className: "mv-popup",
          })
            .setLngLat([cLng, cLat])
            .setHTML(`
              <div style="font-family:system-ui,sans-serif;padding:4px;text-align:center">
                <p style="margin:0;font-size:11px;color:#6b7280;font-weight:600">
                  ${owner_type} #${owner_id}
                </p>
                <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:#16a34a">
                  ${ha.toFixed(2)} ha
                </p>
              </div>`)
            .addTo(map);

          setLoading(false);
        };

        if (map.isStyleLoaded()) doRender();
        else map.on("load", doRender);

      } catch (err) {
        console.error(err);
        setNotification({ type: "error", message: "Failed to load polygon data." });
        setLoading(false);
      }
    };

    load();
  }, [owner_id, owner_type]); // eslint-disable-line

  // ── Auto-dismiss notification ─────────────────────────────────────────────
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const typeLabel = owner_type === "farmer" ? "Farm" : (owner_type || "Entity");

  const zoomToFarm = () => {
    if (!mapRef.current || !boundsRef.current) return;
    mapRef.current.fitBounds(boundsRef.current, { padding: 60, maxZoom: 14, duration: 900 });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 60px)",
      fontFamily: "system-ui,sans-serif", overflow: "hidden" }}>

      <style>{`
        @keyframes mvSpin  { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0;transform:translateY(-6px); } to { opacity:1;transform:none; } }
        .mv-popup .mapboxgl-popup-content {
          padding:10px 14px !important;border-radius:10px !important;
          box-shadow:0 6px 24px rgba(0,0,0,.18) !important;
          border:1px solid #e5e7eb !important;
        }
        .mv-popup .mapboxgl-popup-tip { border-top-color:#fff !important; }
      `}</style>

      {/* Map */}
      <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }}/>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30 }}>
          <div style={{ background: "rgba(10,18,12,0.92)", backdropFilter: "blur(12px)",
            borderRadius: 16, padding: "24px 32px", textAlign: "center",
            border: "1px solid rgba(34,197,94,0.2)" }}>
            <div style={{ width: 34, height: 34, border: "3px solid rgba(255,255,255,0.15)",
              borderTopColor: "#22c55e", borderRadius: "50%",
              animation: "mvSpin .7s linear infinite", margin: "0 auto 12px" }}/>
            <p style={{ color: "#e2f5e8", fontSize: 13, fontWeight: 500, margin: 0 }}>
              Loading boundary…
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {notification && (
        <div style={{ position: "absolute", top: 16, left: "50%",
          transform: "translateX(-50%)", zIndex: 40, animation: "fadeIn .25s ease",
          display: "flex", alignItems: "center", gap: 10, padding: "11px 18px",
          borderRadius: 10, maxWidth: 360, backdropFilter: "blur(12px)",
          background: notification.type === "error"
            ? "rgba(127,29,29,0.92)" : "rgba(30,58,138,0.92)",
          border: `1px solid ${notification.type === "error"
            ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)"}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", color: "#fff", fontSize: 13, fontWeight: 500 }}>
          {notification.message}
          <button onClick={() => setNotification(null)}
            style={{ marginLeft: 8, background: "none", border: "none",
              color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 16, padding: 0 }}>
            ×
          </button>
        </div>
      )}

      {/* ── Side panel — same structure/style as MapViewAll ─────────────────── */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20,
        width: panelOpen ? 244 : 44, overflow: "hidden",
        background: "rgba(10,18,12,0.88)", backdropFilter: "blur(20px)",
        borderRadius: 14, border: "1px solid rgba(34,197,94,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        transition: "width .3s cubic-bezier(.22,1,.36,1)" }}>

        {/* Toggle */}
        <button onClick={() => setPanelOpen(o => !o)}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 5,
            width: 24, height: 24, borderRadius: 6, cursor: "pointer",
            background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#4ade80", fontSize: 13, display: "flex",
            alignItems: "center", justifyContent: "center" }}>
          {panelOpen ? "‹" : "›"}
        </button>

        {/* Collapsed */}
        {!panelOpen && (
          <div style={{ padding: "12px 0 10px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%",
              background: "rgba(34,197,94,0.3)", border: "1px solid rgba(34,197,94,0.5)" }}/>
            {areaHa && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "#4ade80",
                fontFamily: "monospace", writingMode: "vertical-rl",
                transform: "rotate(180deg)" }}>
                {parseFloat(areaHa).toFixed(2)} ha
              </span>
            )}
          </div>
        )}

        {/* Expanded */}
        {panelOpen && (
          <div style={{ padding: "14px 16px 16px", animation: "fadeIn .2s ease" }}>

            {/* Header — matches MapViewAll */}
            <div style={{ marginBottom: 14, paddingRight: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e" }}/>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#4ade80" }}>
                  {typeLabel} Boundary
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e2f5e8",
                letterSpacing: "-0.01em" }}>
                {farmInfo?.name || `${typeLabel} #${owner_id}`}
              </h3>
              {farmInfo?.subcounty && (
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                  {farmInfo.subcounty}
                </p>
              )}
            </div>

            {/* Stats grid — same layout as MapViewAll */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Stat label="Area"
                value={area ? `${(area / 10000).toFixed(2)} ha` : "—"}
                sub={area ? `${area.toLocaleString()} m²` : "loading"}/>
              <Stat label="Est. Trees"
                value={treeCount?.toLocaleString() || "—"}
                sub="@ 1 / 4 m²"/>
              <Stat label="Vertices"  value={vertexCount ?? "—"} sub="polygon points"/>
              <Stat label="Zoom"      value={zoom}               sub="current level"/>
            </div>

            <div style={{ height: 1, background: "rgba(34,197,94,0.1)", margin: "14px 0 10px" }}/>

            {/* Map style — identical to MapViewAll */}
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

            {/* Action buttons — same style as MapViewAll's Zoom to All / Refresh */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button onClick={zoomToFarm}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                  background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93c5fd", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                Zoom to Farm
              </button>
              <button onClick={() => window.location.reload()}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                  color: "#4ade80", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                Refresh
              </button>
            </div>

            {/* Farm extra details */}
            {farmInfo && (
              <>
                <div style={{ height: 1, background: "rgba(34,197,94,0.1)", marginBottom: 10 }}/>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {[
                    ["Gender", farmInfo.gender],
                    ["Phone",  farmInfo.phonenumber1 || farmInfo.phonenumber],
                    // ── FIX: no duplicate fontSize key ──────────────────────
                    ["ID",     owner_id],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "3px 0" }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{label}</span>
                      <span style={{
                        fontSize: label === "ID" ? 10 : 11,   // ← single fontSize, no duplicate
                        fontWeight: 600,
                        color: "rgba(255,255,255,.75)",
                        fontFamily: label === "ID" ? "'DM Mono',monospace" : "inherit",
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.3)",
              textAlign: "center", lineHeight: 1.4, marginBottom: 0 }}>
              Click the marker to view details
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom legend — same as MapViewAll ─────────────────────────────── */}
      {!loading && area && (
        <div style={{ position: "absolute", bottom: 40, left: "50%",
          transform: "translateX(-50%)", zIndex: 20,
          background: "rgba(10,18,12,0.82)", backdropFilter: "blur(12px)",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          padding: "8px 18px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)", animation: "fadeIn .4s ease" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%",
            background: "#22c55e", border: "1px solid rgba(255,255,255,0.3)" }}/>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }}/>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
            <strong style={{ color: "#fff" }}>
              {farmInfo?.name || `${typeLabel} #${owner_id}`}
            </strong>
            {" · "}
            <strong style={{ color: "#4ade80" }}>
              {(area / 10000).toFixed(2)} ha
            </strong>
            {" · "}
            <span style={{ color: "rgba(255,255,255,.5)" }}>
              {vertexCount} vertices
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default MapView;