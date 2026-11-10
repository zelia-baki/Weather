// src/utils/region.js
// ─────────────────────────────────────────────────────────────────────────────
//  Prix régionaux côté front.
//  · Le pays de livraison est mémorisé (localStorage « nk_country »), sinon
//    deviné depuis la langue du navigateur, sinon UG.
//  · Les régions et leurs coefficients viennent de /api/pricing/regions
//    (chargés une seule fois pour toute l'application).
//  · priceFor() applique EXACTEMENT le même calcul et le même arrondi que le
//    serveur (app/utils/pricing.py). Le serveur recalcule de toute façon le
//    prix au paiement : le front ne fait qu'afficher.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useState, useCallback } from 'react';
import axiosInstance from '../axiosInstance';

const STORAGE_KEY = 'nk_country';
const DEFAULT_COUNTRY = 'UG';

// Tous les codes pays ISO 3166-1 alpha-2 (+ XK Kosovo).
const ALL_CODES = (
  'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ ' +
  'CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET ' +
  'FI FJ FM FO FR GA GB GD GE GG GH GI GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IM ' +
  'IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU ' +
  'LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR ' +
  'NZ OM PA PE PG PH PK PL PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL ' +
  'SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA ' +
  'VC VE VN VU WS XK YE YT ZA ZM ZW'
).split(' ');

let displayNames = null;
try {
  displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
} catch { /* vieux navigateur : on affiche le code */ }

export const countryName = (code) => {
  if (!code) return '';
  if (code === 'XK') return 'Kosovo';
  try { return displayNames?.of(code) || code; } catch { return code; }
};

// [{ code: 'UG', name: 'Uganda' }, …] trié par nom
export const COUNTRIES = ALL_CODES
  .map((code) => ({ code, name: countryName(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const detectCountry = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ALL_CODES.includes(saved)) return saved;
  } catch { /* stockage indisponible */ }
  const langs = navigator.languages || [navigator.language || ''];
  for (const lang of langs) {
    const region = (lang.split('-')[1] || '').toUpperCase();
    if (ALL_CODES.includes(region)) return region;
  }
  return DEFAULT_COUNTRY;
};

export const saveCountry = (code) => {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
};

// ── Chargement unique des régions ────────────────────────────────────────────
let regionsPromise = null;
export const loadRegions = (force = false) => {
  if (!regionsPromise || force) {
    regionsPromise = axiosInstance
      .get('/api/pricing/regions')
      .then((res) => res.data)
      .catch(() => {
        regionsPromise = null;                 // on réessaiera plus tard
        return { regions: [], fallback_region: 'rest_of_world', no_decimal_currencies: [] };
      });
  }
  return regionsPromise;
};

const regionOf = (data, country) => {
  if (!data?.regions?.length || !country) return null;
  return (
    data.regions.find((r) => r.countries && r.countries.includes(country)) ||
    data.regions.find((r) => r.code === data.fallback_region) ||
    null
  );
};

const roundPrice = (amount, currency, data) => {
  const noDecimals = (data?.no_decimal_currencies || ['UGX', 'KES', 'TZS', 'RWF'])
    .includes((currency || '').toUpperCase());
  return noDecimals ? Math.round(amount) : Math.round(amount * 100) / 100;
};

// ── Hook ────────────────────────────────────────────────────────────────────
//   const { country, setCountry, region, priceFor } = useRegionalPricing();
//   priceFor(product.price, product.currency)  → prix pour ce pays
export const useRegionalPricing = () => {
  const [country, setCountryState] = useState(detectCountry);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    loadRegions().then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);

  const setCountry = useCallback((code) => {
    saveCountry(code);
    setCountryState(code);
  }, []);

  const region = useMemo(() => regionOf(data, country), [data, country]);
  const multiplier = region ? Number(region.multiplier) : 1;

  const priceFor = useCallback(
    (base, currency) => {
      if (base === null || base === undefined || base === '') return null;
      return roundPrice(Number(base) * multiplier, currency, data);
    },
    [multiplier, data]
  );

  return { country, setCountry, region, multiplier, priceFor, ready: !!data };
};

// Petit sélecteur réutilisable : <CountrySelect value={country} onChange={setCountry} />
export const countryOptions = COUNTRIES;