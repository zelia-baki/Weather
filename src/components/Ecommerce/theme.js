// =============================================================================
//  src/components/Ecommerce/theme.js
//
//  Les jetons visuels des écrans d'administration de la boutique.
//
//  Direction : automne chaud, mais en registre HAUT.
//
//  Une palette d'automne devient terne dès que tout se loge dans les valeurs
//  moyennes — fond crème, encre sourde, accents poudrés. Ici la base monte
//  presque au blanc (#FDFBF7, cartes en blanc pur) et les chauds sont
//  saturés. Ce sont les écarts de clarté qui font la lumière, pas la teinte.
//
//  Le pétrole n'est pas là par hasard : une palette d'automne tient dans un
//  couloir de teintes très étroit (orange, ocre, brique, châtaigne), et six
//  parts de camembert dans ce couloir sont indistinguables. Le pétrole
//  appartient au registre — c'est la couleur des lainages d'automne — et il
//  donne l'écart dont les graphiques ont besoin.
//
//  Le vert se limite à la mousse, et à un seul usage : l'argent encaissé.
//
//  Source unique : sans elle, une couleur de statut finit par diverger entre
//  l'écran des ventes et celui des commandes, et le même mot ne veut plus dire
//  la même chose d'un écran à l'autre.
// =============================================================================

export const C = {
  // Surfaces — presque blanc, juste tiédi. C'est de là que vient la lumière.
  paper:      '#FDFBF7',
  paperAlt:   '#F4EDE2',
  card:       '#FFFFFF',

  // Encres — brun espresso plutôt que gris ou noir bleuté
  ink:        '#2A1C12',
  inkSoft:    '#5C4A3B',
  muted:      '#8B7969',
  faint:      '#B7A897',

  // Filets
  line:       '#EBE1D4',
  lineSoft:   '#F5EFE6',

  // Accent principal — orange brûlé
  accent:     '#C25E2A',
  accentDeep: '#9C4519',
  accentSoft: '#FBEDE2',

  // Secondaire — ocre doré
  amber:      '#CE9A2E',
  amberSoft:  '#FBF2DA',

  // Contrepoint froid — pétrole. Indispensable à la lisibilité des séries.
  teal:       '#1F5F6B',
  tealSoft:   '#E2EEF0',

  // Lie de vin
  wine:       '#93334C',
  wineSoft:   '#F9E9EC',

  // Mousse — uniquement l'argent encaissé et les variations positives
  moss:       '#5F7A38',
  mossSoft:   '#EEF2E3',

  // Alerte — brique
  brick:      '#A83A2A',
  brickSoft:  '#FAE9E5',

  // Neutre chaud
  stone:      '#9A8A79',
  stoneSoft:  '#F2EDE6',
};

// Ordre des séries. Orange, pétrole et ocre s'écartent nettement en teinte ET
// en clarté ; les suivantes alternent chaud et sombre pour rester séparables
// même sur des parts étroites.
export const SERIES = [
  C.accent, C.teal, C.amber, C.wine, C.moss, C.brick, C.stone,
  '#7A4E2D', '#C98B70', '#3F5E4A',
];

// Ombres brunes, jamais grises : un gris neutre sous une carte blanche ternit
// tout ce qui l'entoure, et sur une base chaude ça se voit immédiatement.
export const SHADOW = '0 1px 2px rgba(42,28,18,0.04), 0 10px 28px rgba(42,28,18,0.05)';
export const SHADOW_LIFT = '0 2px 4px rgba(42,28,18,0.06), 0 18px 44px rgba(42,28,18,0.10)';
export const OVERLAY = 'rgba(42,28,18,0.30)';
export const ON_INK = 'rgba(255,255,255,0.16)';

export const serif = { fontFamily: "'Cormorant Garamond', serif" };
export const sans  = { fontFamily: "'Epilogue', sans-serif" };
export const mono  = { fontFamily: "'JetBrains Mono', monospace" };

/** Teinte translucide à partir d'un hex — pour les dégradés de graphiques. */
export const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// ── Statuts de commande ──────────────────────────────────────────────────────
// Une seule définition pour les pastilles, le camembert et les boutons.
// Six teintes franchement séparées : pierre, brique, mousse, pétrole, orange,
// ocre. Deux voisines sur un camembert ne se confondraient plus.
export const STATUS = {
  pending:        { label: 'Awaiting payment', fg: C.stone,  bg: C.stoneSoft,  bd: '#E5DDD2' },
  payment_failed: { label: 'Payment failed',   fg: C.brick,  bg: C.brickSoft,  bd: '#F0D3CC' },
  paid:           { label: 'Paid',             fg: C.moss,   bg: C.mossSoft,   bd: '#DCE4C9' },
  shipped:        { label: 'Shipped',          fg: C.teal,   bg: C.tealSoft,   bd: '#C9DEE2' },
  delivered:      { label: 'Delivered',        fg: C.accent, bg: C.accentSoft, bd: '#F0D6C4' },
  cancelled:      { label: 'Cancelled',        fg: C.muted,  bg: C.lineSoft,   bd: C.line },
  refunded:       { label: 'Refunded',         fg: C.amber,  bg: C.amberSoft,  bd: '#EDDCAC' },
};

export const statusMeta = (key) =>
  STATUS[key] || { label: key, fg: C.muted, bg: C.lineSoft, bd: C.line };

// ── Fabriques de style ───────────────────────────────────────────────────────

export const card = (extra = {}) => ({
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  boxShadow: SHADOW,
  ...extra,
});

// Petites capitales espacées, en orange brûlé. Discret mais reconnaissable :
// signale un en-tête sans ajouter de trait ni de fond.
export const sectionLabel = {
  ...sans,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: C.accent,
};

export const pageTitle = {
  ...serif,
  fontSize: 34,
  fontWeight: 500,
  color: C.ink,
  letterSpacing: -0.3,
  lineHeight: 1.08,
};

export const cardTitle = {
  ...sans,
  fontSize: 13,
  fontWeight: 700,
  color: C.ink,
};

// Les grands chiffres en Cormorant : c'est là que passe toute l'élégance de
// l'écran. Un chiffre en gras sans-serif ressemble à n'importe quel back-office.
export const bigNumber = {
  ...serif,
  fontSize: 36,
  fontWeight: 600,
  color: C.ink,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
};

// ── Options de graphique communes ────────────────────────────────────────────
export const chartFont = { family: 'Epilogue, sans-serif', size: 11 };

export const chartAxes = (opts = {}) => ({
  x: {
    grid: { display: false },
    border: { color: C.line },
    ticks: { color: C.muted, font: chartFont, maxRotation: 45, autoSkip: true, maxTicksLimit: 12 },
    ...(opts.x || {}),
  },
  y: {
    beginAtZero: true,
    grid: { color: C.lineSoft },
    border: { display: false },
    ticks: { color: C.muted, font: chartFont },
    ...(opts.y || {}),
  },
});

export const chartTooltip = {
  backgroundColor: C.ink,
  titleFont: { family: 'Epilogue, sans-serif', size: 11, weight: '600' },
  bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
};

export const legendBottom = {
  position: 'bottom',
  labels: {
    boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle',
    padding: 14, color: C.inkSoft, font: chartFont,
  },
};

// ── Feuille de style injectée ────────────────────────────────────────────────
// `color-scheme` ne repeint que les widgets natifs — champs, listes, barres de
// défilement. Un OS en mode sombre les noircit sans que rien côté React puisse
// s'y opposer, d'où les !important. Même principe que dans EcoProductManager.
export const PANEL_CSS = `
.nk-panel { color-scheme: light; }

.nk-panel input:not([type="checkbox"]):not([type="radio"]),
.nk-panel select,
.nk-panel textarea {
  background-color: ${C.card} !important;
  color: ${C.ink} !important;
  -webkit-text-fill-color: ${C.ink} !important;
  border: 1px solid ${C.line};
  border-radius: 10px;
  padding: 9px 12px;
  font-family: Epilogue, sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color .15s ease, box-shadow .15s ease;
}

.nk-panel input:focus, .nk-panel select:focus, .nk-panel textarea:focus {
  border-color: ${C.accent};
  box-shadow: 0 0 0 3px ${C.accentSoft};
}

.nk-panel input::placeholder { color: ${C.faint} !important; -webkit-text-fill-color: ${C.faint} !important; }
.nk-panel option { background-color: ${C.card}; color: ${C.ink}; }

.nk-panel ::-webkit-scrollbar { width: 9px; height: 9px; }
.nk-panel ::-webkit-scrollbar-track { background: transparent; }
.nk-panel ::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 999px; }
.nk-panel ::-webkit-scrollbar-thumb:hover { background: ${C.faint}; }

.nk-row { transition: background-color .12s ease; }
.nk-row:hover { background-color: ${C.paper}; }

.nk-btn { transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease; }
`;