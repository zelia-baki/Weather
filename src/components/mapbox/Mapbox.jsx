import { useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useMapbox from "../../hooks/useMapbox";
import axiosInstance from "../../axiosInstance";

// ─── Toast notification (auto-dismiss) ───────────────────────────────────────
const Toast = ({ notification, onDismiss }) => {
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isSuccess = notification.type === "success";
  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: 10,
        background: isSuccess
          ? "linear-gradient(135deg,#14532d,#166534)"
          : "linear-gradient(135deg,#7f1d1d,#991b1b)",
        border: `1px solid ${isSuccess ? "#22c55e55" : "#ef444455"}`,
        boxShadow: `0 8px 32px ${isSuccess ? "#22c55e30" : "#ef444430"}`,
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        maxWidth: 280,
        animation: "slideIn .25s cubic-bezier(.22,1,.36,1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span style={{ fontSize: 16 }}>{isSuccess ? "✓" : "✕"}</span>
      <span>{notification.message}</span>
      <button
        onClick={onDismiss}
        style={{
          marginLeft: "auto",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
};

// ─── Coordinate row ───────────────────────────────────────────────────────────
const CoordRow = ({ index, coord, onRemove }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 6,
      background: "rgba(34,197,94,.06)",
      border: "1px solid rgba(34,197,94,.15)",
      marginBottom: 4,
    }}
  >
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "rgba(34,197,94,.2)",
        border: "1px solid rgba(34,197,94,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 700,
        color: "#4ade80",
        flexShrink: 0,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {index + 1}
    </span>
    <span
      style={{
        flex: 1,
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: "#a3e4b0",
        letterSpacing: "0.02em",
      }}
    >
      {parseFloat(coord[0]).toFixed(6)}, {parseFloat(coord[1]).toFixed(6)}
    </span>
    <button
      onClick={() => onRemove(index)}
      style={{
        background: "none",
        border: "none",
        color: "rgba(239,68,68,.5)",
        cursor: "pointer",
        fontSize: 14,
        padding: "0 2px",
        transition: "color .15s",
        lineHeight: 1,
      }}
      onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
      onMouseLeave={(e) => (e.target.style.color = "rgba(239,68,68,.5)")}
      title="Remove point"
    >
      ×
    </button>
  </div>
);

// ─── Input field ──────────────────────────────────────────────────────────────
const CoordInput = ({ label, value, onChange, placeholder }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(163,228,176,.6)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </label>
    <input
      type="number"
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(34,197,94,.2)",
        borderRadius: 8,
        padding: "9px 12px",
        color: "#e2f5e8",
        fontFamily: "'DM Mono', monospace",
        fontSize: 13,
        outline: "none",
        transition: "border-color .2s, box-shadow .2s",
        width: "100%",
        boxSizing: "border-box",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "rgba(34,197,94,.6)";
        e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,.1)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "rgba(34,197,94,.2)";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const MapboxExample = () => {
  const location  = useLocation();
  const owner_id   = location.state?.owner_id;
  const geolocation = location.state?.geolocation;
  const owner_type  = location.state?.owner_type;

  let longitude = "32.5825";
  let latitude  = "0.3476";
  if (geolocation && geolocation.includes(",")) {
    [longitude, latitude] = geolocation.split(",");
  }

  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [notification, setNotification] = useState(null);
  const [lngInput,  setLngInput]  = useState("");
  const [latInput,  setLatInput]  = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [mode,      setMode]      = useState("draw"); // "draw" | "manual"

  const { mapContainerRef } = useMapbox({
    longitude,
    latitude,
    onPolygonChange: setPolygonCoordinates,
    onPlaceSelect:   (place) => console.log("Selected place:", place),
  });

  const points = polygonCoordinates[0] || [];
  const isValid = points.length >= 4;

  // Remove a single point
  const handleRemovePoint = (idx) => {
    setPolygonCoordinates((prev) => {
      const updated = [...(prev[0] || [])];
      updated.splice(idx, 1);
      return updated.length ? [updated] : [];
    });
  };

  // Clear all points
  const handleClear = () => {
    setPolygonCoordinates([]);
    setNotification({ type: "success", message: "Polygon cleared." });
  };

  // Add coordinate manually
  const handleAddCoordinate = () => {
    const lng = parseFloat(lngInput);
    const lat = parseFloat(latInput);
    if (isNaN(lng) || isNaN(lat)) {
      setNotification({ type: "error", message: "Enter valid numeric coordinates." });
      return;
    }
    if (lng < -180 || lng > 180) {
      setNotification({ type: "error", message: "Longitude must be between -180 and 180." });
      return;
    }
    if (lat < -90 || lat > 90) {
      setNotification({ type: "error", message: "Latitude must be between -90 and 90." });
      return;
    }
    setPolygonCoordinates((prev) => {
      const ring = prev.length ? [...prev[0]] : [];
      ring.push([lng, lat]);
      return [ring];
    });
    setLngInput("");
    setLatInput("");
  };

  // Save polygon
  const handleValidate = async () => {
    if (!isValid) {
      setNotification({ type: "error", message: "Need at least 4 points to close a polygon." });
      return;
    }
    setSaving(true);
    try {
      const { data } = await axiosInstance.get(
        `/api/points/exists/${owner_type}/${owner_id}`
      );
      if (data.exists) {
        setNotification({ type: "error", message: "A GeoMap already exists for this entity." });
        setSaving(false);
        return;
      }
      const pointPayloads = points.map(([lng, lat]) => ({
        longitude: lng,
        latitude:  lat,
        owner_id,
        owner_type,
      }));
      await Promise.all(
        pointPayloads.map((p) => axiosInstance.post("/api/points/create", p))
      );
      setNotification({ type: "success", message: `${points.length} points saved successfully!` });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.response?.data?.message || err.message || "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const panelStyle = {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 20,
    width: panelOpen ? 300 : 48,
    background: "rgba(8,22,14,.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: 14,
    border: "1px solid rgba(34,197,94,.18)",
    boxShadow: "0 20px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04) inset",
    overflow: "hidden",
    transition: "width .3s cubic-bezier(.22,1,.36,1)",
    fontFamily: "'DM Sans', sans-serif",
  };

  const btnPrimary = {
    width: "100%",
    padding: "11px 0",
    borderRadius: 9,
    border: "none",
    background: isValid
      ? "linear-gradient(135deg,#16a34a,#15803d)"
      : "rgba(255,255,255,.06)",
    color: isValid ? "#fff" : "rgba(255,255,255,.3)",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: isValid ? "pointer" : "not-allowed",
    transition: "all .2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: isValid ? "0 4px 16px rgba(22,163,74,.35)" : "none",
    letterSpacing: "0.02em",
  };

  return (
    <>
      {/* ── Google Fonts ── */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .coord-scroll::-webkit-scrollbar { width: 4px; }
        .coord-scroll::-webkit-scrollbar-track { background: transparent; }
        .coord-scroll::-webkit-scrollbar-thumb {
          background: rgba(34,197,94,.25);
          border-radius: 4px;
        }
        .mode-btn { transition: all .15s !important; }
        .mode-btn:hover { opacity: .85 !important; }
        .add-btn:hover { background: rgba(34,197,94,.2) !important; }
        .clear-btn:hover { background: rgba(239,68,68,.12) !important; }
      `}</style>

      <div style={{ position: "relative", width: "100%", height: "100vh" }}>
        {/* ── Map container ── */}
        <div ref={mapContainerRef} style={{ position: "absolute", inset: 0 }} />

        {/* ── Toast ── */}
        <Toast notification={notification} onDismiss={() => setNotification(null)} />

        {/* ── Side panel ── */}
        <div style={panelStyle}>

          {/* Toggle button */}
          <button
            onClick={() => setPanelOpen((o) => !o)}
            title={panelOpen ? "Collapse panel" : "Expand panel"}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 5,
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "rgba(34,197,94,.1)",
              border: "1px solid rgba(34,197,94,.2)",
              color: "#4ade80",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              transition: "background .15s",
              flexShrink: 0,
            }}
          >
            {panelOpen ? "‹" : "›"}
          </button>

          {/* Collapsed view */}
          {!panelOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "14px 0 10px",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "rgba(34,197,94,.15)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                📍
              </div>
              {points.length > 0 && (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#16a34a",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  {points.length}
                </div>
              )}
            </div>
          )}

          {/* Expanded content */}
          {panelOpen && (
            <div style={{ padding: "16px 16px 18px", animation: "fadeIn .2s ease" }}>

              {/* Header */}
              <div style={{ marginBottom: 16, paddingRight: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 8px #22c55e",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#4ade80",
                    }}
                  >
                    Boundary Editor
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#e2f5e8",
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Define Farm Polygon
                </h3>
              </div>

              {/* Mode selector */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 9,
                  padding: 3,
                  marginBottom: 14,
                  border: "1px solid rgba(255,255,255,.06)",
                }}
              >
                {[
                  { id: "draw",   label: "🖊  Draw on map" },
                  { id: "manual", label: "⌨  Enter coords" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    className="mode-btn"
                    onClick={() => setMode(id)}
                    style={{
                      flex: 1,
                      padding: "7px 6px",
                      borderRadius: 7,
                      border: "none",
                      background: mode === id
                        ? "rgba(34,197,94,.18)"
                        : "transparent",
                      color: mode === id ? "#4ade80" : "rgba(255,255,255,.35)",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11.5,
                      fontWeight: mode === id ? 600 : 400,
                      cursor: "pointer",
                      borderColor: mode === id ? "rgba(34,197,94,.3)" : "transparent",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Instruction */}
              {mode === "draw" && (
                <div
                  style={{
                    background: "rgba(34,197,94,.06)",
                    border: "1px solid rgba(34,197,94,.15)",
                    borderRadius: 8,
                    padding: "9px 12px",
                    marginBottom: 14,
                    fontSize: 12,
                    color: "rgba(163,228,176,.75)",
                    lineHeight: 1.5,
                  }}
                >
                  Use the <strong style={{ color: "#4ade80" }}>draw tool</strong> on
                  the map to trace the farm boundary. Click the first point again to
                  close the polygon.
                </div>
              )}

              {/* Manual coordinate input */}
              {mode === "manual" && (
                <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  <CoordInput
                    label="Longitude"
                    value={lngInput}
                    onChange={setLngInput}
                    placeholder="e.g. 32.5825"
                  />
                  <CoordInput
                    label="Latitude"
                    value={latInput}
                    onChange={setLatInput}
                    placeholder="e.g. 0.3476"
                  />
                  <button
                    className="add-btn"
                    onClick={handleAddCoordinate}
                    style={{
                      marginTop: 2,
                      padding: "9px 0",
                      borderRadius: 8,
                      border: "1px solid rgba(34,197,94,.3)",
                      background: "rgba(34,197,94,.1)",
                      color: "#4ade80",
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: "pointer",
                      letterSpacing: "0.03em",
                    }}
                  >
                    + Add Point
                  </button>
                </div>
              )}

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: "rgba(34,197,94,.1)",
                  marginBottom: 12,
                }}
              />

              {/* Points header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(163,228,176,.5)",
                  }}
                >
                  Points
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: points.length >= 4
                        ? "rgba(34,197,94,.2)"
                        : "rgba(255,255,255,.06)",
                      border: `1px solid ${points.length >= 4 ? "rgba(34,197,94,.35)" : "rgba(255,255,255,.08)"}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: points.length >= 4 ? "#4ade80" : "rgba(255,255,255,.3)",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {points.length} / 4+
                  </span>
                  {points.length > 0 && (
                    <button
                      className="clear-btn"
                      onClick={handleClear}
                      title="Clear all points"
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(239,68,68,.2)",
                        background: "transparent",
                        color: "rgba(239,68,68,.6)",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Points list */}
              <div
                className="coord-scroll"
                style={{
                  maxHeight: 150,
                  overflowY: "auto",
                  marginBottom: 14,
                }}
              >
                {points.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "rgba(255,255,255,.2)",
                      fontSize: 12,
                      fontStyle: "italic",
                    }}
                  >
                    No points yet
                  </div>
                ) : (
                  points.map((coord, i) => (
                    <CoordRow
                      key={i}
                      index={i}
                      coord={coord}
                      onRemove={handleRemovePoint}
                    />
                  ))
                )}
              </div>

              {/* Validation status */}
              {points.length > 0 && points.length < 4 && (
                <div
                  style={{
                    marginBottom: 10,
                    fontSize: 11.5,
                    color: "rgba(251,191,36,.7)",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span>⚠</span>
                  <span>{4 - points.length} more point{4 - points.length > 1 ? "s" : ""} needed to close the polygon</span>
                </div>
              )}

              {/* Save button */}
              <button
                style={btnPrimary}
                onClick={handleValidate}
                disabled={!isValid || saving}
                onMouseEnter={(e) => {
                  if (isValid) {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg,#15803d,#166534)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 24px rgba(22,163,74,.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isValid) {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg,#16a34a,#15803d)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(22,163,74,.35)";
                  }
                }}
              >
                {saving ? (
                  <>
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        border: "2px solid rgba(255,255,255,.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "spin .7s linear infinite",
                      }}
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Save Boundary
                  </>
                )}
              </button>

              {/* Footer hint */}
              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  fontSize: 10.5,
                  color: "rgba(255,255,255,.2)",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {owner_type && owner_id
                  ? `Attaching to ${owner_type} #${owner_id}`
                  : "No entity selected — navigate from Farm Manager"}
              </p>
            </div>
          )}
        </div>

        {/* ── Spin keyframe ── */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
};

export default MapboxExample;