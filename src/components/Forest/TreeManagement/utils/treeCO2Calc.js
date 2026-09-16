// utils/treeCO2Calc.js
// ─────────────────────────────────────────────────────────────────────────
// Calcul AGB / CO2 par arbre — IDENTIQUE à la formule utilisée côté backend
// (app/utils/tree_co2_utils.py), pour que les chiffres affichés sur la carte,
// dans les popups, et dans le PDF soient toujours cohérents.
//
// Formule (source: blog EcoMatcher) :
//   AGB(lb) = 0.25 × D(in)² × H(ft)
//   BGB = 0.2 × AGB ; TB = AGB + BGB ; TDW = TB × 0.725 ; TC = TDW × 0.5
//   CO2 = TC × 3.67
//
// Place ce fichier dans components/Forest/TreeManagement/utils/treeCO2Calc.js

const CM_TO_IN = 0.393701;
const M_TO_FT  = 3.28084;

const BGB_RATIO         = 0.20;
const DRY_MATTER_RATIO  = 0.725;
const CARBON_RATIO      = 0.5;
const CO2_C_RATIO       = 3.67;

/** AGB en kg, à partir du diamètre (cm) et de la hauteur (m). */
export const calculateAGB = (diameterCm, heightM) => {
  if (!diameterCm || !heightM) return 0;
  const D = parseFloat(diameterCm);
  const H = parseFloat(heightM);
  const dIn = D * CM_TO_IN;
  const hFt = H * M_TO_FT;
  const agbLb = 0.25 * dIn * dIn * hFt;
  return agbLb * 0.453592; // lb -> kg
};

/**
 * Retourne { agb (kg, string 2 déc.), co2 (tonnes, string 3 déc.) }
 * — même signature que l'ancienne fonction locale, pour un remplacement
 *   direct sans casser les appels existants (calculateCO2(diameter, height)).
 */
export const calculateCO2 = (diameterCm, heightM) => {
  if (!diameterCm || !heightM) return { agb: 0, co2: 0 };

  const AGB = calculateAGB(diameterCm, heightM);
  const BGB = BGB_RATIO * AGB;
  const TB  = AGB + BGB;
  const TDW = TB * DRY_MATTER_RATIO;
  const TC  = TDW * CARBON_RATIO;
  const CO2_kg = TC * CO2_C_RATIO;
  const CO2_tonnes = CO2_kg / 1000;

  return {
    agb: AGB.toFixed(2),
    co2: CO2_tonnes.toFixed(3),
  };
};

// ─────────────────────────────────────────────────────────────────────────
// Courbe sigmoid (croissance logistique par espèce) — IDENTIQUE à
// app/utils/tree_co2_utils.py (sigmoid_biomass / sigmoid_annual_co2_rate),
// pour tracer côté frontend la trajectoire complète d'un arbre à partir des
// `growth_params` (km, t_half, mmax) déjà renvoyés par /api/tree-co2/forest/:id/report.

/** Biomasse totale attendue (kg) à l'âge t (années) : M(t) = Mmax / (1 + exp(-Km(t - t_half))). */
export const sigmoidBiomass = (t, km, tHalf, mmax) => {
  if (t <= 0) return 0;
  const exponent = Math.max(Math.min(-km * (t - tHalf), 700), -700);
  return mmax / (1 + Math.exp(exponent));
};

/** CO2 cumulé (kg) attendu à l'âge t, via la même chaîne biomasse -> CO2 que le calcul mesuré. */
export const sigmoidCumulativeCO2 = (t, { km, t_half: tHalf, mmax }) => {
  const biomass = sigmoidBiomass(t, km, tHalf, mmax);
  return biomass * DRY_MATTER_RATIO * CARBON_RATIO * CO2_C_RATIO;
};

/**
 * Échantillonne la courbe sigmoid de CO2 cumulé sur [0, maxAgeYears].
 * Retourne un tableau de points { age, co2Kg } prêt pour un graphique.
 */
export const buildSigmoidCurve = (growthParams, maxAgeYears, points = 60) => {
  if (!growthParams || !maxAgeYears || maxAgeYears <= 0) return [];
  const step = maxAgeYears / points;
  const curve = [];
  for (let i = 0; i <= points; i++) {
    const age = i * step;
    curve.push({ age: +age.toFixed(2), co2Kg: +sigmoidCumulativeCO2(age, growthParams).toFixed(3) });
  }
  return curve;
};

/** Âge de l'arbre en années (décimal), depuis date_planted — IDENTIQUE à calculate_tree_age_years côté backend. */
export const calculateAgeYears = (datePlanted) => {
  if (!datePlanted) return 0;
  const planted = new Date(datePlanted);
  if (Number.isNaN(planted.getTime())) return 0;
  const days = (Date.now() - planted.getTime()) / 86400000;
  return Math.max(days / 365.25, 0);
};