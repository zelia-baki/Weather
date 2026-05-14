// ─────────────────────────────────────────────────────────────────────────────
// permissionsConfig.jsx
// Fichier à placer dans : src/components/Users/permissionsConfig.jsx
// Utilise react-icons/fa (déjà installé dans le projet)
// ─────────────────────────────────────────────────────────────────────────────

import { FaUsers } from 'react-icons/fa';
import { FaStore } from 'react-icons/fa';
import { FaCloudSun } from 'react-icons/fa';
import { FaWater } from 'react-icons/fa';
import { FaSatelliteDish } from 'react-icons/fa';
import { FaChartBar } from 'react-icons/fa';
import { FaQrcode } from 'react-icons/fa';

export const PERMISSIONS_CONFIG = [
  {
    key: 'farmergroup',
    label: 'Farmer Group',
    Icon: FaUsers,
    description: 'Gestion des groupes de fermiers',
  },
  {
    key: 'store',
    label: 'Store / Produits',
    Icon: FaStore,
    description: 'Gestion du store et des produits',
  },
  {
    key: 'weather_dashboard',
    label: 'Weather Dashboard',
    Icon: FaCloudSun,
    description: 'Tableaux de bord météo, solaire & cartes weather',
  },
  {
    key: 'water_advisory',
    label: 'Water Advisory',
    Icon: FaWater,
    description: "Cartes d'advisory irrigation / eau",
  },
  {
    key: 'sentinel',
    label: 'Sentinel / NDVI',
    Icon: FaSatelliteDish,
    description: 'Imagerie satellite via Sentinel Hub',
  },
  {
    key: 'reports',
    label: 'Rapports (Farm / Carbon / Forest)',
    Icon: FaChartBar,
    description: 'Génération de rapports GFW farm, carbone et forêt',
  },
  {
    key: 'qr',
    label: 'Module QR Code',
    Icon: FaQrcode,
    description: 'Génération et gestion des QR codes de traçabilité',
  },
];

/** Objet permissions avec toutes les clés à false — valeur par défaut */
export const DEFAULT_PERMISSIONS = Object.fromEntries(
  PERMISSIONS_CONFIG.map((p) => [p.key, false])
);