import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import * as turf from "@turf/turf";
import useMapbox from "../../hooks/useMapbox";
import axiosInstance from "../../axiosInstance";

// ─────────────────────────────────────────────────────────────────────────────
// Live preview layer helpers — completely isolated from MapboxDraw layers
// ─────────────────────────────────────────────────────────────────────────────
const SRC  = "mp-prev";
const FILL = "mp-prev-fill";
const LINE = "mp-prev-line";
const DOTS = "mp-prev-dots";
const LBLS = "mp-prev-labels";

function ensureLayers(map) {
  if (map.getSource(SRC)) return;
  map.addSource(SRC, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: FILL, type: "fill", source: SRC,
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: { "fill-color": "#22c55e", "fill-opacity": 0.18 },
  });
  map.addLayer({
    id: LINE, type: "line", source: SRC,
    paint: { "line-color": "#4ade80", "line-width": 2.5, "line-dasharray": [4, 2] },
  });
  map.addLayer({
    id: DOTS, type: "circle", source: SRC,
    filter: ["==", ["geometry-type"], "Point"],
    paint: {
      "circle-color": "#22c55e", "circle-radius": 7,
      "circle-stroke-width": 2.5, "circle-stroke-color": "#fff",
    },
  });
  map.addLayer({
    id: LBLS, type: "symbol", source: SRC,
    filter: ["==", ["geometry-type"], "Point"],
    layout: {
      "text-field": ["get", "n"], "text-size": 10,
      "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#fff" },
  });
}

// Rebuild preview: numbered vertices + line (2 pts) or closed polygon (3+)
function pushPreview(map, pts) {
  if (!map) return;
  const run = () => {
    ensureLayers(map);
    const features = [];
    pts.forEach((pt, i) =>
      features.push({
        type: "Feature",
        properties: { n: String(i + 1) },
        geometry: { type: "Point", coordinates: pt },
      })
    );
    if (pts.length === 2) {
      features.push({ type: "Feature", properties: {},
        geometry: { type: "LineString", coordinates: pts } });
    } else if (pts.length >= 3) {
      const ring = [...pts];
      const [fx, fy] = ring[0];
      const [lx, ly] = ring[ring.length - 1];
      if (fx !== lx || fy !== ly) ring.push([fx, fy]); // visual auto-close
      features.push({ type: "Feature", properties: {},
        geometry: { type: "Polygon", coordinates: [ring] } });
    }
    map.getSource(SRC)?.setData({ type: "FeatureCollection", features });
  };
  if (map.isStyleLoaded()) run();
  else map.once("style.load", run);
}

function wipePreview(map) {
  if (!map?.isStyleLoaded() || !map.getSource(SRC)) return;
  map.getSource(SRC).setData({ type: "FeatureCollection", features: [] });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [notification, onDismiss]);
  if (!notification) return null;
  const ok = notification.type === "success";
  return (
    <div style={{
      position: "absolute", top: 20, right: 20, zIndex: 50,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 18px", borderRadius: 10,
      background: ok ? "linear-gradient(135deg,#14532d,#166534)"
                     : "linear-gradient(135deg,#7f1d1d,#991b1b)",
      border: `1px solid ${ok ? "#22c55e55" : "#ef444455"}`,
      boxShadow: `0 8px 32px ${ok ? "#22c55e30" : "#ef444430"}`,
      color: "#fff", fontFamily: "'DM Sans',sans-serif",
      fontSize: 13, fontWeight: 500, maxWidth: 280,
      animation: "toastIn .25s cubic-bezier(.22,1,.36,1)",
    }}>
      <span style={{ fontSize: 16 }}>{ok ? "✓" : "✕"}</span>
      <span>{notification.message}</span>
      <button onClick={onDismiss} style={{
        marginLeft: "auto", background: "none", border: "none",
        color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 16, padding: 0,
      }}>×</button>
    </div>
  );
};

const CoordRow = ({ index, coord, onRemove, isAutoClose }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 10px", borderRadius: 6, marginBottom: 4,
    background: isAutoClose ? "rgba(234,179,8,.07)" : "rgba(34,197,94,.06)",
    border: `1px solid ${isAutoClose ? "rgba(234,179,8,.25)" : "rgba(34,197,94,.15)"}`,
  }}>
    <span style={{
      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
      background: isAutoClose ? "rgba(234,179,8,.2)" : "rgba(34,197,94,.2)",
      border: `1px solid ${isAutoClose ? "rgba(234,179,8,.4)" : "rgba(34,197,94,.4)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 9, fontWeight: 700,
      color: isAutoClose ? "#fbbf24" : "#4ade80",
      fontFamily: "'DM Mono',monospace",
    }}>
      {isAutoClose ? "↩" : index + 1}
    </span>
    <span style={{
      flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 11,
      color: isAutoClose ? "rgba(251,191,36,.6)" : "#a3e4b0",
    }}>
      {parseFloat(coord[0]).toFixed(6)}, {parseFloat(coord[1]).toFixed(6)}
      {isAutoClose && (
        <span style={{ marginLeft: 6, fontSize: 9, color: "#fbbf24" }}>(auto-close)</span>
      )}
    </span>
    {!isAutoClose && (
      <button onClick={() => onRemove(index)} title="Remove"
        style={{ background: "none", border: "none", color: "rgba(239,68,68,.5)",
          cursor: "pointer", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
        onMouseEnter={e => (e.target.style.color = "#ef4444")}
        onMouseLeave={e => (e.target.style.color = "rgba(239,68,68,.5)")}
      >×</button>
    )}
  </div>
);

const NumInput = ({ label, value, onChange, placeholder }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "rgba(163,228,176,.6)",
      fontFamily: "'DM Sans',sans-serif",
    }}>{label}</label>
    <input
      type="number" step="any" value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        background: "rgba(255,255,255,.04)", border: "1px solid rgba(34,197,94,.2)",
        borderRadius: 8, padding: "9px 12px", color: "#e2f5e8",
        fontFamily: "'DM Mono',monospace", fontSize: 13, outline: "none",
        width: "100%", boxSizing: "border-box",
        transition: "border-color .2s, box-shadow .2s",
      }}
      onFocus={e => {
        e.target.style.borderColor = "rgba(34,197,94,.6)";
        e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,.1)";
      }}
      onBlur={e => {
        e.target.style.borderColor = "rgba(34,197,94,.2)";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const MapboxExample = () => {
  const location    = useLocation();
  const owner_id    = location.state?.owner_id;
  const owner_type  = location.state?.owner_type;
  const geolocation = location.state?.geolocation;

  let longitude = "32.5825";
  let latitude  = "0.3476";
  if (geolocation?.includes(",")) {
    [longitude, latitude] = geolocation.split(",").map(s => s.trim());
  }

  // draw mode: coords come from MapboxDraw (already a closed ring)
  const [drawCoords, setDrawCoords] = useState([]);

  // manual mode: coords added one by one
  const [manualPts, setManualPts] = useState([]);
  const [lngInput,  setLngInput]  = useState("");
  const [latInput,  setLatInput]  = useState("");

  const [mode,         setMode]         = useState("draw");
  const [notification, setNotification] = useState(null);
  const [panelOpen,    setPanelOpen]    = useState(true);
  const [saving,       setSaving]       = useState(false);

  // ref so the onPolygonChange closure always reads the latest mode
  const modeRef = useRef("draw");
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ── Map init ───────────────────────────────────────────────────────────────
  // Destructure mapRef + drawRef so we can drive the map from this component
  const { mapContainerRef, mapRef, drawRef, roundedArea } = useMapbox({
    longitude,
    latitude,
    onPolygonChange: (coords) => {
      // coords = data.features[0].geometry.coordinates  ← already closed by MapboxDraw
      if (modeRef.current === "draw") setDrawCoords(coords[0] || []);
    },
    onPlaceSelect: () => {},
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const activePts = mode === "draw" ? drawCoords : manualPts;

  // draw: MapboxDraw needs ≥4 coords (3 unique + closing duplicate)
  // manual: we need ≥3 unique points and we'll close it ourselves
  const isValid = mode === "draw" ? activePts.length >= 4 : activePts.length >= 3;

  // Show closing-point row when manual ring is not yet closed
  const needsAutoClose =
    mode === "manual" && manualPts.length >= 3 &&
    (manualPts[0]?.[0] !== manualPts[manualPts.length - 1]?.[0] ||
     manualPts[0]?.[1] !== manualPts[manualPts.length - 1]?.[1]);

  // Live area for manual mode
  const manualArea = (() => {
    if (mode !== "manual" || manualPts.length < 3) return null;
    try {
      const ring = [...manualPts];
      const [fx, fy] = ring[0], [lx, ly] = ring[ring.length - 1];
      if (fx !== lx || fy !== ly) ring.push([fx, fy]);
      return Math.round(turf.area({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [ring] },
      }));
    } catch { return null; }
  })();

  const displayArea = mode === "manual" ? manualArea : (roundedArea ?? null);

  // ── Sync manual pts → map preview ──────────────────────────────────────────
  useEffect(() => {
    if (mode !== "manual") return;
    pushPreview(mapRef.current, manualPts);
  }, [manualPts, mode]);

  // ── Mode switch ────────────────────────────────────────────────────────────
  const switchMode = (next) => {
    if (next === mode) return;
    const map  = mapRef.current;
    const draw = drawRef.current;

    if (next === "draw") {
      wipePreview(map);
      setManualPts([]);
      setLngInput(""); setLatInput("");
      try { draw?.changeMode("draw_polygon"); } catch (_) {}
    } else {
      // Pause draw tool while in manual mode
      try { draw?.changeMode("simple_select"); } catch (_) {}
      setDrawCoords([]);
      wipePreview(map);
    }
    setMode(next);
  };

  // ── Add coordinate ─────────────────────────────────────────────────────────
  const handleAddCoordinate = () => {
    const lng = parseFloat(lngInput);
    const lat = parseFloat(latInput);

    if (isNaN(lng) || isNaN(lat)) {
      setNotification({ type: "error", message: "Enter valid numeric coordinates." });
      return;
    }
    if (lng < -180 || lng > 180) {
      setNotification({ type: "error", message: "Longitude must be −180 → 180." });
      return;
    }
    if (lat < -90 || lat > 90) {
      setNotification({ type: "error", message: "Latitude must be −90 → 90." });
      return;
    }

    const newPts = [...manualPts, [lng, lat]];
    setManualPts(newPts);
    setLngInput(""); setLatInput("");

    // ── Camera ───────────────────────────────────────────────────────────
    const map = mapRef.current;
    if (!map) return;
    if (newPts.length === 1) {
      map.flyTo({ center: [lng, lat], zoom: 15, duration: 1000, easing: t => t * (2 - t) });
    } else {
      const bounds = newPts.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(newPts[0], newPts[0])
      );
      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: panelOpen ? 330 : 100, right: 80 },
        duration: 900, maxZoom: 17,
      });
    }
  };

  const handleRemovePoint = (idx) => {
    setManualPts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClear = () => {
    if (mode === "manual") {
      setManualPts([]);
      wipePreview(mapRef.current);
    } else {
      try { drawRef.current?.deleteAll(); } catch (_) {}
      setDrawCoords([]);
    }
    setNotification({ type: "success", message: "Polygon cleared." });
  };

  // ── Save — THE CRITICAL FIX ────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!isValid) {
      setNotification({
        type: "error",
        message: mode === "manual"
          ? "At least 3 points required."
          : "At least 3 unique points required.",
      });
      return;
    }

    // ─────────────────────────────────────────────────────────────────────
    // AUTO-CLOSE: ensure ring[first] === ring[last] before saving.
    //
    //   Draw mode  : MapboxDraw already closes the ring (first === last),
    //                so the check is a no-op — nothing extra is saved.
    //
    //   Manual mode: user entered N unique points without a closing point,
    //                so we append a copy of the first point to close the ring.
    //                Result is identical to what MapboxDraw produces.
    // ─────────────────────────────────────────────────────────────────────
    let finalPts = [...activePts];
    const [fx, fy] = finalPts[0];
    const [lx, ly] = finalPts[finalPts.length - 1];
    if (fx !== lx || fy !== ly) {
      finalPts = [...finalPts, [fx, fy]]; // close the ring
    }

    setSaving(true);
    try {
      const { data } = await axiosInstance.get(
        `/api/points/exists/${owner_type}/${owner_id}`
      );
      if (data.exists) {
        setNotification({ type: "error", message: "A boundary already exists for this entity." });
        setSaving(false);
        return;
      }

      // Save every point — including the closing duplicate, same as draw mode
      for (const [lng, lat] of finalPts) {
        await axiosInstance.post("/api/points/create", {
          longitude: lng,
          latitude: lat,
          owner_id,
          owner_type,
        });
      }

      setNotification({ type: "success", message: `${finalPts.length} points saved!` });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || err.message || "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && mode === "manual") handleAddCoordinate();
  };

  const saveBtn = {
    width: "100%", padding: "11px 0", borderRadius: 9, border: "none",
    background: isValid
      ? "linear-gradient(135deg,#16a34a,#15803d)"
      : "rgba(255,255,255,.06)",
    color: isValid ? "#fff" : "rgba(255,255,255,.3)",
    fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13,
    cursor: isValid ? "pointer" : "not-allowed", transition: "all .2s",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: isValid ? "0 4px 16px rgba(22,163,74,.35)" : "none",
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .sc::-webkit-scrollbar{width:4px}
        .sc::-webkit-scrollbar-track{background:transparent}
        .sc::-webkit-scrollbar-thumb{background:rgba(34,197,94,.25);border-radius:4px}
      `}</style>

      <div style={{ position: "relative", width: "100%", height: "100vh" }}>

        {/* Map */}
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }}/>

        {/* Toast */}
        <Toast notification={notification} onDismiss={() => setNotification(null)}/>

        {/* ── Side panel ────────────────────────────────────────────────────── */}
        <div style={{
          position: "absolute", top: 16, left: 16, zIndex: 20,
          width: panelOpen ? 304 : 48, overflow: "hidden",
          background: "rgba(8,22,14,.90)", backdropFilter: "blur(20px)",
          borderRadius: 14, border: "1px solid rgba(34,197,94,.18)",
          boxShadow: "0 20px 60px rgba(0,0,0,.5)",
          transition: "width .3s cubic-bezier(.22,1,.36,1)",
          fontFamily: "'DM Sans',sans-serif",
        }}>

          {/* Toggle */}
          <button onClick={() => setPanelOpen(o => !o)} style={{
            position: "absolute", top: 12, right: 12, zIndex: 5,
            width: 26, height: 26, borderRadius: 6,
            background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)",
            color: "#4ade80", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>
            {panelOpen ? "‹" : "›"}
          </button>

          {/* Collapsed */}
          {!panelOpen && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              padding: "14px 0 10px", gap: 12 }}>
              <div style={{ width: 28, height: 28, background: "rgba(34,197,94,.15)",
                borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14 }}>📍</div>
              {activePts.length > 0 && (
                <div style={{ width: 22, height: 22, borderRadius: "50%",
                  background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Mono',monospace" }}>
                  {activePts.length}
                </div>
              )}
            </div>
          )}

          {/* Expanded */}
          {panelOpen && (
            <div style={{ padding: "16px 16px 18px", animation: "fadeIn .2s ease" }}>

              {/* Header */}
              <div style={{ marginBottom: 16, paddingRight: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%",
                    background: "#22c55e", boxShadow: "0 0 8px #22c55e" }}/>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "#4ade80" }}>
                    Boundary Editor
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700,
                  color: "#e2f5e8", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
                  Define Farm Polygon
                </h3>
              </div>

              {/* Mode tabs */}
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,.04)",
                borderRadius: 9, padding: 3, marginBottom: 14,
                border: "1px solid rgba(255,255,255,.06)" }}>
                {[
                  { id: "draw",   icon: "🖊",  label: "Draw on map"  },
                  { id: "manual", icon: "⌨",   label: "Enter coords" },
                ].map(({ id, icon, label }) => (
                  <button key={id} onClick={() => switchMode(id)} style={{
                    flex: 1, padding: "7px 6px", borderRadius: 7, border: "none",
                    background: mode === id ? "rgba(34,197,94,.18)" : "transparent",
                    color: mode === id ? "#4ade80" : "rgba(255,255,255,.35)",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 11.5,
                    fontWeight: mode === id ? 600 : 400, cursor: "pointer",
                    transition: "all .15s",
                  }}>
                    {icon}  {label}
                  </button>
                ))}
              </div>

              {/* Draw hint */}
              {mode === "draw" && (
                <div style={{ background: "rgba(34,197,94,.06)",
                  border: "1px solid rgba(34,197,94,.15)", borderRadius: 8,
                  padding: "9px 12px", marginBottom: 14,
                  fontSize: 12, color: "rgba(163,228,176,.75)", lineHeight: 1.5 }}>
                  Use the <strong style={{ color: "#4ade80" }}>draw tool</strong> on
                  the map. Click the first point to close the polygon.
                </div>
              )}

              {/* Manual inputs */}
              {mode === "manual" && (
                <div style={{ marginBottom: 14 }} onKeyDown={onKeyDown}>
                  <div style={{ background: "rgba(59,130,246,.07)",
                    border: "1px solid rgba(59,130,246,.15)", borderRadius: 8,
                    padding: "8px 10px", marginBottom: 10,
                    fontSize: 11.5, color: "rgba(147,197,253,.75)", lineHeight: 1.5 }}>
                    Enter each corner then click{" "}
                    <strong style={{ color: "#93c5fd" }}>Add</strong> or press{" "}
                    <kbd style={{ background: "rgba(255,255,255,.08)",
                      border: "1px solid rgba(255,255,255,.12)", borderRadius: 3,
                      padding: "1px 4px", fontSize: 10 }}>Enter</kbd>.
                    {" "}Polygon updates live.
                    Closing point <strong style={{ color: "#86efac" }}>auto-added</strong> on save.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <NumInput label="Longitude" value={lngInput} onChange={setLngInput}
                      placeholder="e.g. 32.5825"/>
                    <NumInput label="Latitude"  value={latInput} onChange={setLatInput}
                      placeholder="e.g. 0.3476"/>
                  </div>
                  <button onClick={handleAddCoordinate} style={{
                    marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 8,
                    border: "1px solid rgba(34,197,94,.3)", background: "rgba(34,197,94,.1)",
                    color: "#4ade80", fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 600, fontSize: 12.5, cursor: "pointer",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,.2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,.1)"}
                  >
                    ＋ Add Point
                  </button>
                </div>
              )}

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(34,197,94,.1)", marginBottom: 12 }}/>

              {/* Points header + count */}
              <div style={{ display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "rgba(163,228,176,.5)" }}>
                  Points
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 20,
                    fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700,
                    background: isValid ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.06)",
                    border: `1px solid ${isValid ? "rgba(34,197,94,.35)" : "rgba(255,255,255,.08)"}`,
                    color: isValid ? "#4ade80" : "rgba(255,255,255,.3)",
                  }}>
                    {activePts.length} / {mode === "manual" ? "3+" : "4+"}
                  </span>
                  {activePts.length > 0 && (
                    <button onClick={handleClear} style={{
                      padding: "2px 8px", borderRadius: 6,
                      border: "1px solid rgba(239,68,68,.2)", background: "transparent",
                      color: "rgba(239,68,68,.6)", fontFamily: "'DM Sans',sans-serif",
                      fontSize: 11, cursor: "pointer", fontWeight: 500,
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.12)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >Clear</button>
                  )}
                </div>
              </div>

              {/* Points list */}
              <div className="sc" style={{ maxHeight: 160, overflowY: "auto", marginBottom: 12 }}>
                {activePts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0",
                    color: "rgba(255,255,255,.2)", fontSize: 12, fontStyle: "italic" }}>
                    No points yet
                  </div>
                ) : (
                  <>
                    {activePts.map((coord, i) => (
                      <CoordRow key={i} index={i} coord={coord}
                        onRemove={mode === "manual" ? handleRemovePoint : () => {}}
                        isAutoClose={false}/>
                    ))}
                    {/* Preview of the closing point that will be added on save */}
                    {needsAutoClose && (
                      <CoordRow index={activePts.length} coord={manualPts[0]}
                        onRemove={() => {}} isAutoClose/>
                    )}
                  </>
                )}
              </div>

              {/* Progress hint */}
              {activePts.length > 0 && !isValid && (
                <div style={{ marginBottom: 10, fontSize: 11.5,
                  color: "rgba(251,191,36,.7)", display: "flex",
                  alignItems: "center", gap: 5 }}>
                  <span>⚠</span>
                  <span>
                    {(mode === "manual" ? 3 : 4) - activePts.length} more point
                    {(mode === "manual" ? 3 : 4) - activePts.length !== 1 ? "s" : ""} needed
                  </span>
                </div>
              )}

              {/* Live area */}
              {displayArea != null && (
                <div style={{ marginBottom: 12, padding: "9px 12px", borderRadius: 8,
                  background: "rgba(34,197,94,.07)", border: "1px solid rgba(34,197,94,.18)" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(74,222,128,.6)", marginBottom: 4 }}>
                    {mode === "manual" ? "Live Area" : "Drawn Area"}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#4ade80",
                      fontFamily: "'DM Mono',monospace" }}>
                      {(displayArea / 10000).toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>
                      ha · {displayArea.toLocaleString()} m²
                    </span>
                  </div>
                  {needsAutoClose && (
                    <div style={{ marginTop: 4, fontSize: 10.5,
                      color: "rgba(251,191,36,.6)", display: "flex",
                      alignItems: "center", gap: 4 }}>
                      <span>↩</span> Closing point will be added on save
                    </div>
                  )}
                </div>
              )}

              {/* Save */}
              <button style={saveBtn} onClick={handleValidate}
                disabled={!isValid || saving}
                onMouseEnter={e => {
                  if (isValid) {
                    e.currentTarget.style.background = "linear-gradient(135deg,#15803d,#166534)";
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(22,163,74,.5)";
                  }
                }}
                onMouseLeave={e => {
                  if (isValid) {
                    e.currentTarget.style.background = "linear-gradient(135deg,#16a34a,#15803d)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(22,163,74,.35)";
                  }
                }}>
                {saving ? (
                  <>
                    <span style={{ width: 12, height: 12,
                      border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff",
                      borderRadius: "50%", display: "inline-block",
                      animation: "spin .7s linear infinite" }}/>
                    Saving…
                  </>
                ) : (
                  <><span>✓</span> Save Boundary</>
                )}
              </button>

              <p style={{ marginTop: 12, marginBottom: 0, fontSize: 10.5,
                color: "rgba(255,255,255,.2)", textAlign: "center", lineHeight: 1.4 }}>
                {owner_type && owner_id
                  ? `Attaching to ${owner_type} #${owner_id}`
                  : "No entity — navigate from Farm Manager"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MapboxExample;