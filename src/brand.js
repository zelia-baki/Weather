// ─────────────────────────────────────────────────────────────────────────────
// src/brand.js — one codebase, one database, two front doors.
//
//   nkusu.com   → the full agri / EUDR platform
//   2tume.com   → the commodity exchange: warehouses, receipts, quality,
//                 varieties, plus the shared shop and auctions
//
// Two mechanisms, two jobs:
//   · the /2tume prefix ORGANISES the exchange-only pages
//   · this file FILTERS what each domain shows and allows
//
// The prefix alone would not hide anything: without the filter, a visitor on
// 2tume.com would still see Farm, Forest and Weather in the menu.
//
// Testing without the domain: add ?brand=2tume to any URL. The choice is kept
// for the browser session, so you can click around. ?brand=nkusu goes back.
// ─────────────────────────────────────────────────────────────────────────────

/** The prefix of the exchange-only routes. Defined once: change it here only. */
export const TUME = '/2tume';

const DETECTION_KEY = 'nk_brand_override';

const detect = () => {
  if (typeof window === 'undefined') return 'nkusu';

  // 1. Explicit override in the URL, remembered for the session.
  const fromQuery = new URLSearchParams(window.location.search).get('brand');
  if (fromQuery) {
    sessionStorage.setItem(DETECTION_KEY, fromQuery);
    return fromQuery;
  }
  const remembered = sessionStorage.getItem(DETECTION_KEY);
  if (remembered) return remembered;

  // 2. Build-time setting, for a dedicated deployment.
  if (import.meta.env.VITE_BRAND) return import.meta.env.VITE_BRAND;

  // 3. The domain itself — the real rule in production.
  return window.location.hostname.includes('2tume') ? '2tume' : 'nkusu';
};

export const BRAND_KEY = detect();
export const IS_TUME = BRAND_KEY === '2tume';

// Pages that belong to BOTH doors: already online, already shared, already
// bookmarked by customers. They keep their addresses — no prefix, ever.
const SHARED_PATHS = [
  '/home',
  '/welcome',                                   // the 3D landing
  '/shop', '/auctions', '/auction',             // catalogue and bidding
  '/ecoshopmanager', '/auctionmanager',         // their admin screens
  '/ordermanager', '/customermanager',
  '/salesdashboard', '/soldproducts',
  '/categorymanager',                           // product categories
  '/usermanager', '/createUsers', '/featuresManager',
  '/userDash',
  '/verify',                                    // public receipt verification
  '/payment', '/contactus', '/login', '/signup',
];

const BRANDS = {
  nkusu: {
    key: 'nkusu',
    name: 'Nkusu',
    tagline: 'Verified origin',
    // null = every menu block, every route. Nkusu is the full platform.
    menus: null,
    allowedPaths: null,
    home: '/home',
    landingIsShop: false,
  },

  '2tume': {
    key: '2tume',
    name: '2tume',
    tagline: 'Commodity exchange',
    // Menu ids from Layout.jsx. Farm, forest, weather, digital and eudr stay out.
    menus: ['exchange', 'ecommerce', 'dashboard'],
    // Everything under /2tume, plus the shared pages above.
    allowedPaths: [TUME, ...SHARED_PATHS],
    home: `${TUME}/dashboard`,
    // On 2tume.com, "/" shows the 3D landing instead of the Nkusu home page.
    landingIsShop: true,
  },
};

export const BRAND = BRANDS[BRAND_KEY] || BRANDS.nkusu;

/** Is this route reachable on the current domain? */
export const isPathAllowed = (path) => {
  if (!BRAND.allowedPaths) return true;
  return BRAND.allowedPaths.some(allowed =>
    path === allowed || path.startsWith(`${allowed}/`));
};

/** Should this menu block be displayed? */
export const isMenuVisible = (menuId) => {
  if (!BRAND.menus) return true;
  return BRAND.menus.includes(menuId);
};