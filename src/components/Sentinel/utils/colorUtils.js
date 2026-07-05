import { INDEX_RANGE } from "../constants";

export function lerpColor(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export function valueToColor(value, idx) {
  if (value == null || isNaN(value)) return '#475569';
  const [min, max] = INDEX_RANGE[idx] || [-1, 1];
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  if (t < 0.5) return lerpColor('#dc2626', '#eab308', t / 0.5);
  return lerpColor('#eab308', '#16a34a', (t - 0.5) / 0.5);
}