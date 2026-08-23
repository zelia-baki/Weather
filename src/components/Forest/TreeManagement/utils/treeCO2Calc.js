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