import {
  Leaf, TrendingUp, Wheat, Droplets, Waves, Sun, Flame, Mountain,
} from "lucide-react";

export const META = {
  ndvi: { label: 'NDVI', full: 'Vegetation Health', Icon: Leaf, color: '#16a34a', fill: 'rgba(22,163,74,0.12)', group: 'vegetation' },
  evi: { label: 'EVI', full: 'Enhanced Vegetation', Icon: TrendingUp, color: '#0d9488', fill: 'rgba(13,148,136,0.12)', group: 'vegetation' },
  savi: { label: 'SAVI', full: 'Soil Adjusted Vegetation', Icon: Wheat, color: '#65a30d', fill: 'rgba(101,163,13,0.12)', group: 'vegetation' },
  ndmi: { label: 'NDMI', full: 'Moisture Index', Icon: Droplets, color: '#0284c7', fill: 'rgba(2,132,199,0.12)', group: 'water' },
  ndwi: { label: 'NDWI', full: 'Water Body Index', Icon: Waves, color: '#0ea5e9', fill: 'rgba(14,165,233,0.12)', group: 'water' },
  nmdi: { label: 'NMDI', full: 'Drought Index', Icon: Sun, color: '#f97316', fill: 'rgba(249,115,22,0.12)', group: 'drought' },
  nbr: { label: 'NBR', full: 'Burn Ratio', Icon: Flame, color: '#ef4444', fill: 'rgba(239,68,68,0.12)', group: 'fire' },
  bsi: { label: 'BSI', full: 'Bare Soil Index', Icon: Mountain, color: '#92400e', fill: 'rgba(146,64,14,0.12)', group: 'soil' },
};

export const YEAR_COLORS = [
  '#f59e0b', '#6366f1', '#10b981', '#f43f5e', '#38bdf8',
  '#a78bfa', '#fb923c', '#34d399', '#e879f9', '#fbbf24',
];

export const INDEX_RANGE = {
  ndvi: [-0.2, 0.9], evi: [-0.2, 0.8], savi: [-0.2, 0.8],
  ndmi: [-0.5, 0.6], ndwi: [-0.5, 0.5], nmdi: [0, 1.2],
  nbr: [-0.5, 0.8], bsi: [-0.5, 0.5],
};

export const CLASS_INDICES = [...Object.keys(META), 'ndre'];

export const CLASS_LABELS = {
  ...Object.fromEntries(Object.entries(META).map(([k, v]) => [k, v.label])),
  ndre: 'NDRE',
};