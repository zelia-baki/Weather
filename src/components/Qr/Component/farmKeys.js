// Les fermes du formulaire sont rangées par position : farm_0_id, farm_1_qty…
// Supprimer la ferme `index` doit décaler les suivantes d'un cran ; sinon la
// ferme 1 garde ses clés farm_1_* alors qu'elle s'affiche en position 0, et ses
// ID / téléphone / district / poids disparaissent du formulaire et du reçu.
const FARM_KEY = /^farm_(\d+)_(.+)$/;

export function removeFarmKeys(data, index) {
  const next = {};
  for (const [key, value] of Object.entries(data)) {
    const m = key.match(FARM_KEY);
    if (!m) { next[key] = value; continue; }
    const i = Number(m[1]);
    if (i === index) continue;
    next[i > index ? `farm_${i - 1}_${m[2]}` : key] = value;
  }
  return next;
}
