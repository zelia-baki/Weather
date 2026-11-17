import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import axiosInstance from "../../axiosInstance";
import Swal from "sweetalert2";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Avec 50 000+ fermes, on ne charge plus tous les points d'un coup :
//  - vue large  : un point par ferme (centroïde), regroupés en clusters (couche GPU)
//  - vue zoomée : contours des seules fermes visibles, chargés pour la zone affichée
const POLY_MIN_ZOOM = 11;

const COLORS = [
  "#22c55e","#3b82f6","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#14b8a6",
];

const MAP_STYLES = [
  { id: "satellite",         label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "satellite-streets", label: "Hybrid",    url: "mapbox://styles/mapbox/satellite-streets-v12" },
  { id: "outdoors",          label: "Terrain",   url: "mapbox://styles/mapbox/outdoors-v12" },
];

const EMPTY = { type: "FeatureCollection", features: [] };

const colorFor = (ownerId) => {
  let h = 0;
  for (const ch of String(ownerId)) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
};

const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Cadrage sur 99 % des entités : quelques coordonnées aberrantes (saisies de test
// hors du pays) ne doivent pas faire dézoomer la carte sur tout un continent.
const robustBounds = (coords) => {
  const lons = coords.map(c => c[0]).sort((a, b) => a - b);
  const lats = coords.map(c => c[1]).sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.round(p * (arr.length - 1))))];
  const cut = coords.length >= 200 ? 0.005 : 0;
  return [[q(lons, cut), q(lats, cut)], [q(lons, 1 - cut), q(lats, 1 - cut)]];
};

const formatHa = (m2) => {
  const ha = m2 / 10000;
  return ha >= 1000 ? `${Math.round(ha).toLocaleString()} ha` : `${ha.toFixed(2)} ha`;
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
        ${escapeHtml((farm?.name || "F")[0].toUpperCase())}
      </div>
      <div>
        <p style="margin:0;font-weight:700;color:#111827;font-size:13px;line-height:1.2">
          ${escapeHtml(farm?.name || "Farm #" + ownerId)}
        </p>
        <p style="margin:0;font-size:11px;color:#9ca3af;font-family:monospace">${escapeHtml(ownerId)}</p>
      </div>
    </div>
    <table style="width:100%;font-size:12px;border-collapse:collapse">
      ${farm?.subcounty ? `<tr><td style="color:#6b7280;padding:3px 0">Subcounty</td><td style="font-weight:600;color:#111827;text-align:right">${escapeHtml(farm.subcounty)}</td></tr>` : ""}
      ${farm?.gender    ? `<tr><td style="color:#6b7280;padding:3px 0">Gender</td><td style="font-weight:600;color:#111827;text-align:right">${escapeHtml(farm.gender)}</td></tr>` : ""}
      ${farm?.phonenumber1||farm?.phonenumber ? `<tr><td style="color:#6b7280;padding:3px 0">Phone</td><td style="font-weight:600;color:#111827;text-align:right">${escapeHtml(farm?.phonenumber1||farm?.phonenumber)}</td></tr>` : ""}
      <tr><td style="color:#6b7280;padding:3px 0">Area</td>
          <td style="text-align:right">
            <span style="background:#dcfce7;color:#16a34a;padding:1px 8px;
                   border-radius:99px;font-size:11px;font-weight:600">${areaHa} ha</span>
          </td></tr>
    </table>
    <button class="mapbox-delete-btn" data-owner-id="${escapeHtml(ownerId)}"
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

// Couches (re)créées après chaque chargement de style (setStyle efface tout).
const addLayers = (map, farmsData, polysData) => {
  if (!map.getSource("farms")) {
    map.addSource("farms", {
      type: "geojson", data: farmsData,
      cluster: true, clusterMaxZoom: POLY_MIN_ZOOM - 1, clusterRadius: 50,
    });
  }
  if (!map.getSource("polygons")) {
    map.addSource("polygons", { type: "geojson", data: polysData, promoteId: "owner_id" });
  }
  if (map.getLayer("farm-clusters")) return;

  map.addLayer({ id: "polygons-fill", type: "fill", source: "polygons", minzoom: POLY_MIN_ZOOM,
    paint: { "fill-color": ["get", "color"],
             "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.55, 0.3] } });
  map.addLayer({ id: "polygons-outline", type: "line", source: "polygons", minzoom: POLY_MIN_ZOOM,
    paint: { "line-color": ["get", "color"], "line-width": 2, "line-opacity": 0.9 } });

  map.addLayer({ id: "farm-clusters", type: "circle", source: "farms", filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#22c55e", 100, "#eab308", 1000, "#f97316", 5000, "#ef4444"],
      "circle-radius": ["step", ["get", "point_count"], 16, 100, 22, 1000, 30, 5000, 38],
      "circle-opacity": 0.85,
      "circle-stroke-width": 2, "circle-stroke-color": "rgba(255,255,255,0.7)",
    } });
  map.addLayer({ id: "farm-cluster-count", type: "symbol", source: "farms", filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"], "text-size": 12 },
    paint: { "text-color": "#fff" } });
  map.addLayer({ id: "farm-points", type: "circle", source: "farms", filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["get", "color"],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 14, 6],
      "circle-stroke-width": 1.5, "circle-stroke-color": "#fff",
      // une fois les contours affichés, le point devient discret
      "circle-opacity": ["interpolate", ["linear"], ["zoom"], POLY_MIN_ZOOM + 1, 1, POLY_MIN_ZOOM + 3, 0.35],
      "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], POLY_MIN_ZOOM + 1, 1, POLY_MIN_ZOOM + 3, 0.35],
    } });
};

// =============================================================================
const MapViewAll = () => {
  const mapContainerRef = useRef();
  const mapRef          = useRef();
  const boundsRef       = useRef(null);
  const farmsRef        = useRef(EMPTY);      // GeoJSON des centroïdes
  const polysRef        = useRef(EMPTY);      // GeoJSON des contours visibles
  const areaRef         = useRef(new Map());  // owner_id → m²
  const polyAbortRef    = useRef(null);
  const polyTimerRef    = useRef(null);
  const hoverRef        = useRef(null);
  const location        = useLocation();
  const owner_type      = location.state?.owner_type || "farmer";

  const [count,        setCount]        = useState(0);
  const [totalArea,    setTotalArea]    = useState(0);
  const [zoom,         setZoom]         = useState("5.00");
  const [styleId,      setStyleId]      = useState("satellite");
  const [notification, setNotification] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [polyState,    setPolyState]    = useState({ loading: false, tooMany: false, shown: 0 });
  const [panelOpen,    setPanelOpen]    = useState(true);

  // ── Contours de la zone visible ────────────────────────────────────────────
  const loadVisiblePolygons = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    clearTimeout(polyTimerRef.current);
    polyTimerRef.current = setTimeout(async () => {
      if (map.getZoom() < POLY_MIN_ZOOM) {
        polyAbortRef.current?.abort();
        setPolyState({ loading: false, tooMany: false, shown: 0 });
        return;
      }
      const b = map.getBounds();
      // marge : les fermes dont le centre est juste hors cadre restent dessinées
      const dx = (b.getEast() - b.getWest()) * 0.15, dy = (b.getNorth() - b.getSouth()) * 0.15;
      const bbox = [b.getWest() - dx, b.getSouth() - dy, b.getEast() + dx, b.getNorth() + dy]
        .map(v => v.toFixed(5)).join(",");
      polyAbortRef.current?.abort();
      const ctrl = new AbortController();
      polyAbortRef.current = ctrl;
      setPolyState(s => ({ ...s, loading: true }));
      try {
        const r = await axiosInstance.get(`/api/points/map/${owner_type}/polygons`,
          { params: { bbox }, signal: ctrl.signal });
        if (r.data.too_many) {
          setPolyState({ loading: false, tooMany: true, shown: 0 });
          return;
        }
        r.data.features.forEach(f => { f.properties.color = colorFor(f.properties.owner_id); });
        polysRef.current = { type: "FeatureCollection", features: r.data.features };
        map.getSource("polygons")?.setData(polysRef.current);
        setPolyState({ loading: false, tooMany: false, shown: r.data.features.length });
      } catch (e) {
        if (e?.name !== "CanceledError" && e?.code !== "ERR_CANCELED")
          setPolyState({ loading: false, tooMany: false, shown: 0 });
      }
    }, 250);
  }, [owner_type]);

  // ── Centroïdes (une requête légère, en cache côté serveur) ─────────────────
  const fetchFarms = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/api/points/map/${owner_type}/centroids`);
      if (!data.count) {
        setNotification({ type: "info", message: "No polygons found for this owner type." });
        farmsRef.current = EMPTY;
      } else {
        setNotification(null);
        const areas = new Map();
        const features = data.ids.map((id, i) => {
          areas.set(id, data.areas[i]);
          return { type: "Feature", geometry: { type: "Point", coordinates: data.coords[i] },
                   properties: { owner_id: id, color: colorFor(id) } };
        });
        areaRef.current = areas;
        farmsRef.current = { type: "FeatureCollection", features };
        boundsRef.current = new mapboxgl.LngLatBounds(...robustBounds(data.coords));
        mapRef.current?.fitBounds(boundsRef.current, { padding: 60, maxZoom: 14, duration: 0 });
      }
      setCount(data.count || 0);
      setTotalArea(data.total_area_m2 || 0);
      mapRef.current?.getSource("farms")?.setData(farmsRef.current);
      loadVisiblePolygons();
    } catch {
      setNotification({ type: "error", message: "Failed to load polygons." });
    } finally {
      setLoading(false);
    }
  }, [owner_type, loadVisiblePolygons]);

  // ── Carte ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[0].url,
      center: [32.5825, 0.3476],
      zoom: 5,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
    map.addControl(new mapboxgl.FullscreenControl(), "bottom-right");

    map.on("style.load", () => addLayers(map, farmsRef.current, polysRef.current));
    map.on("moveend", () => { setZoom(map.getZoom().toFixed(2)); loadVisiblePolygons(); });

    // Cluster : zoom jusqu'à ce qu'il s'ouvre
    map.on("click", "farm-clusters", (e) => {
      const f = e.features[0];
      map.getSource("farms").getClusterExpansionZoom(f.properties.cluster_id, (err, z) => {
        if (!err) map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 });
      });
    });

    // Ferme (point ou contour) : fiche
    const openFarm = async (e) => {
      const ownerId = e.features[0].properties.owner_id;
      const lngLat  = e.features[0].geometry.type === "Point" ? e.features[0].geometry.coordinates : e.lngLat;
      const areaHa  = ((areaRef.current.get(ownerId) || 0) / 10000).toFixed(4);
      const color   = colorFor(ownerId);
      const popup = new mapboxgl.Popup({ maxWidth: "270px", className: "farm-popup", offset: 10 })
        .setLngLat(lngLat).setHTML(loadingPopupHTML()).addTo(map);
      try {
        const res  = await axiosInstance.get(`/api/farm/${ownerId}`);
        popup.setHTML(farmPopupHTML(res.data?.data || res.data || null, ownerId, areaHa, color));
      } catch {
        popup.setHTML(farmPopupHTML(null, ownerId, areaHa, color));
      }
    };
    map.on("click", "farm-points", openFarm);
    map.on("click", "polygons-fill", (e) => {
      // un point déjà cliqué au même endroit a priorité
      if (map.queryRenderedFeatures(e.point, { layers: ["farm-points", "farm-clusters"] }).length) return;
      openFarm(e);
    });

    for (const layer of ["farm-clusters", "farm-points", "polygons-fill"]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }
    map.on("mousemove", "polygons-fill", (e) => {
      const id = e.features[0]?.id;
      if (hoverRef.current !== null && hoverRef.current !== id)
        map.setFeatureState({ source: "polygons", id: hoverRef.current }, { hover: false });
      hoverRef.current = id ?? null;
      if (id !== undefined) map.setFeatureState({ source: "polygons", id }, { hover: true });
    });
    map.on("mouseleave", "polygons-fill", () => {
      if (hoverRef.current !== null)
        map.setFeatureState({ source: "polygons", id: hoverRef.current }, { hover: false });
      hoverRef.current = null;
    });

    return () => {
      clearTimeout(polyTimerRef.current);
      polyAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line

  useEffect(() => { fetchFarms(); }, [fetchFarms]);

  useEffect(() => {
    if (!mapRef.current) return;
    const s = MAP_STYLES.find(m => m.id === styleId);
    // diff:false → style rechargé entièrement, « style.load » recrée nos couches
    if (s && mapRef.current.isStyleLoaded()) mapRef.current.setStyle(s.url, { diff: false });
  }, [styleId]);

  // ── Suppression d'un contour ───────────────────────────────────────────────
  useEffect(() => {
    const handleClick = async (e) => {
      if (!e.target.classList.contains("mapbox-delete-btn")) return;
      const ownerId = e.target.getAttribute("data-owner-id");
      const result  = await Swal.fire({
        title: "Delete polygon?",
        html: `<p style="color:#6b7280;font-size:14px">Remove boundary for <strong>${escapeHtml(owner_type)} #${escapeHtml(ownerId)}</strong>?</p>`,
        icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, delete", customClass: { popup: "rounded-2xl" },
      });
      if (!result.isConfirmed) return;
      try {
        await axiosInstance.delete(`/api/points/owner/${ownerId}`);
        document.querySelectorAll(".mapboxgl-popup").forEach(p => p.remove());
        // retrait local immédiat (le cache serveur se reconstruit de son côté)
        const keep = f => f.properties.owner_id !== ownerId;
        farmsRef.current = { ...farmsRef.current, features: farmsRef.current.features.filter(keep) };
        polysRef.current = { ...polysRef.current, features: polysRef.current.features.filter(keep) };
        mapRef.current?.getSource("farms")?.setData(farmsRef.current);
        mapRef.current?.getSource("polygons")?.setData(polysRef.current);
        setCount(c => c - 1);
        setTotalArea(a => a - (areaRef.current.get(ownerId) || 0));
        Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to delete.", customClass: { popup: "rounded-2xl" } });
      }
    };
    const el = mapContainerRef.current;
    if (el) el.addEventListener("click", handleClick);
    return () => { if (el) el.removeEventListener("click", handleClick); };
  }, [owner_type]);

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

  const zoomNum = parseFloat(zoom);
  const hint = loading ? null
    : zoomNum < POLY_MIN_ZOOM ? `Zoom in to see ${typeLabel.toLowerCase()} boundaries`
    : polyState.tooMany ? `Too many ${typeLabel.toLowerCase()}s in view — zoom in to see boundaries`
    : polyState.loading ? "Loading boundaries…"
    : null;

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
              Loading {typeLabel.toLowerCase()}s…
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
              fontFamily: "monospace" }}>{count.toLocaleString()}</span>
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
              <Stat label="Polygons"   value={count.toLocaleString()} sub={`${typeLabel}s mapped`}/>
              <Stat label="Total Area" value={formatHa(totalArea)}    sub="combined coverage"/>
              <Stat label="Zoom"       value={zoom}                   sub="current level"/>
              <Stat label="In view"    value={polyState.shown.toLocaleString()} sub="boundaries drawn"/>
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
              <button onClick={fetchFarms}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer",
                  background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                  color: "#4ade80", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                Refresh
              </button>
            </div>

            <p style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.3)",
              textAlign: "center", lineHeight: 1.4 }}>
              Click a cluster to zoom in, a {typeLabel.toLowerCase()} to view its details
            </p>
          </div>
        )}
      </div>

      {hint && (
        <div style={{ position: "absolute", bottom: 40, left: "50%",
          transform: "translateX(-50%)", zIndex: 20,
          background: "rgba(10,18,12,0.82)", backdropFilter: "blur(12px)",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          padding: "8px 18px", display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)", animation: "fadeIn .4s ease",
          maxWidth: "calc(100vw - 32px)", color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
          {polyState.loading && (
            <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "#22c55e", borderRadius: "50%", animation: "pspin .7s linear infinite" }}/>
          )}
          {hint}
        </div>
      )}
    </div>
  );
};

export default MapViewAll;
