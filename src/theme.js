// ─────────────────────────────────────────────────────────────────────────────
// src/theme.js  —  NKUSU Design System · Single Source of Truth
// ─────────────────────────────────────────────────────────────────────────────

/* ── COLORS ──────────────────────────────────────────────────────────────── */
export const colors = {
  bg:          "#050c06",
  bg2:         "#081009",
  surface:     "rgba(255,255,255,0.04)",
  border:      "rgba(255,255,255,0.07)",
  green:       "#22c55e",
  greenDim:    "rgba(34,197,94,0.15)",
  greenGlow:   "rgba(34,197,94,0.35)",
  greenLight:  "#4ade80",
  amber:       "#d97706",
  amberDim:    "rgba(217,119,6,0.12)",
  blue:        "#60a5fa",
  blueDim:     "rgba(96,165,250,0.1)",
  purple:      "#a78bfa",
  purpleDim:   "rgba(167,139,250,0.1)",
  sky:         "#38bdf8",
  skyDim:      "rgba(56,189,248,0.1)",
  text:        "#e8f0e9",
  muted:       "rgba(232,240,233,0.45)",
};

/* ── FONTS ───────────────────────────────────────────────────────────────── */
export const fonts = {
  display: "'Cormorant Garamond', Georgia, serif",
  body:    "'Epilogue', sans-serif",
  mono:    "'Space Mono', monospace",
};

export const googleFontsUrl =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Epilogue:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap";

/* ── BORDER RADIUS ───────────────────────────────────────────────────────── */
export const radius = {
  sm:   "8px",
  md:   "12px",
  lg:   "16px",
  xl:   "24px",
  full: "100px",
};

/* ── SHADOWS ─────────────────────────────────────────────────────────────── */
export const shadows = {
  card:    "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(34,197,94,0.05)",
  glow:    "0 0 30px rgba(34,197,94,0.4)",
  glowSm:  "0 0 12px rgba(34,197,94,0.2)",
  glowMd:  "0 0 20px rgba(34,197,94,0.3)",
};

/* ── TRANSITIONS ─────────────────────────────────────────────────────────── */
export const transitions = {
  fast:   "all 0.2s ease",
  normal: "all 0.25s ease",
  slow:   "all 0.4s ease",
};

/* ── CSS VARIABLES STRING (injecté par ThemeProvider) ────────────────────── */
export const cssVars = `
  :root {
    --bg:          ${colors.bg};
    --bg2:         ${colors.bg2};
    --surface:     ${colors.surface};
    --border:      ${colors.border};
    --green:       ${colors.green};
    --green-dim:   ${colors.greenDim};
    --green-glow:  ${colors.greenGlow};
    --amber:       ${colors.amber};
    --amber-dim:   ${colors.amberDim};
    --text:        ${colors.text};
    --muted:       ${colors.muted};
    --display:     ${fonts.display};
    --body:        ${fonts.body};
    --mono:        ${fonts.mono};
  }
`;

/* ── INLINE STYLE HELPERS ────────────────────────────────────────────────── */

/** Bouton vert principal */
export const btnPrimary = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "8px",
  padding:        "14px 28px",
  background:     colors.green,
  color:          colors.bg,
  fontFamily:     fonts.body,
  fontSize:       "14px",
  fontWeight:     700,
  borderRadius:   radius.full,
  border:         "none",
  cursor:         "pointer",
  textDecoration: "none",
  letterSpacing:  "0.04em",
  transition:     transitions.normal,
};

/** Bouton outline */
export const btnOutline = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "8px",
  padding:        "13px 28px",
  background:     "transparent",
  color:          colors.text,
  fontFamily:     fonts.body,
  fontSize:       "14px",
  fontWeight:     500,
  borderRadius:   radius.full,
  border:         `1px solid ${colors.border}`,
  cursor:         "pointer",
  textDecoration: "none",
  letterSpacing:  "0.04em",
  transition:     transitions.normal,
};

/** Carte feature */
export const featCard = {
  background:   colors.surface,
  border:       `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  padding:      "32px",
  position:     "relative",
  overflow:     "hidden",
  transition:   transitions.normal,
};

/** Badge section label (monospace vert) */
export const sectionLabel = {
  fontFamily:    fonts.mono,
  fontSize:      "10px",
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color:         colors.green,
  marginBottom:  "16px",
};

/** Titre display principal */
export const displayTitle = (size = "clamp(36px, 5vw, 62px)") => ({
  fontFamily:  fonts.display,
  fontSize:    size,
  fontWeight:  300,
  lineHeight:  1.1,
  color:       colors.text,
});

/** Texte muted body */
export const mutedText = (size = "15px") => ({
  fontFamily: fonts.body,
  fontSize:   size,
  lineHeight: 1.75,
  color:      colors.muted,
});

/** Mono label petit */
export const monoLabel = (color = colors.green) => ({
  fontFamily:    fonts.mono,
  fontSize:      "9px",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color,
});