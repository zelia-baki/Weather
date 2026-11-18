// Météo de nombreuses fermes avec très peu d'appels Open-Meteo.
//
// Les fermes voisines ont la même prévision (résolution des modèles ≈ 10 km) :
// on les regroupe par case de CELL_DEG degrés (0,1° ≈ 11 km), puis on demande
// plusieurs cases par requête (Open-Meteo accepte des listes latitude=…,…).
// 53 000 fermes ougandaises = ~350 cases = 4 requêtes, au lieu de 53 000.

export const CELL_DEG = 0.1;
const PER_REQUEST = 100;

const cellKey = (lat, lon) => `${Math.round(lat / CELL_DEG)}:${Math.round(lon / CELL_DEG)}`;

/**
 * @param farms   [{ id, lat, lon, … }]
 * @param params  paramètres Open-Meteo hors coordonnées, ex. "hourly=temperature_2m&forecast_days=3"
 * @returns { cells: [{ key, lat, lon, farms: [...], weather }], failed: [farms sans météo] }
 */
export async function fetchWeatherByCell(farms, params, { onProgress } = {}) {
  const byKey = new Map();
  for (const f of farms) {
    const key = cellKey(f.lat, f.lon);
    if (!byKey.has(key)) byKey.set(key, { key, lat: 0, lon: 0, farms: [] });
    byKey.get(key).farms.push(f);
  }
  const cells = [...byKey.values()];
  for (const c of cells) {                       // point représentatif : centre des fermes de la case
    c.lat = +(c.farms.reduce((s, f) => s + f.lat, 0) / c.farms.length).toFixed(4);
    c.lon = +(c.farms.reduce((s, f) => s + f.lon, 0) / c.farms.length).toFixed(4);
  }

  let done = 0;
  for (let i = 0; i < cells.length; i += PER_REQUEST) {
    const chunk = cells.slice(i, i + PER_REQUEST);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${chunk.map(c => c.lat).join(',')}`
      + `&longitude=${chunk.map(c => c.lon).join(',')}&${params}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json) ? json : [json];   // une seule case → objet simple
        chunk.forEach((c, k) => { c.weather = list[k] || null; });
        break;
      } catch (err) {
        if (attempt === 2) console.error('[weatherByCell] Open-Meteo request failed:', err);
        else await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    done += chunk.length;
    onProgress?.(done, cells.length);
  }

  const failed = cells.filter(c => !c.weather).flatMap(c => c.farms);
  return { cells: cells.filter(c => c.weather), failed };
}
