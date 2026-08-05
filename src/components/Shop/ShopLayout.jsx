import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { CartProvider, useCart } from '../../context/CartContext';

// =============================================================================
//  src/components/Shop/ShopLayout.jsx — remplace ton fichier actuel
//
//  Ton layout ne faisait que fournir le panier. Résultat : aucune navigation,
//  aucun compteur, aucun chemin entre la boutique, l'histoire et les enchères.
//  Un visiteur qui arrivait sur une fiche produit n'avait aucun moyen de
//  revenir ailleurs que par le bouton retour du navigateur.
//
//  Le panier compte les LIGNES, pas la somme des quantités : additionner
//  12,5 kg et 3 sachets ne veut rien dire.
// =============================================================================

const BG = '#f7f4ee';
const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const BORDER = 'rgba(20,35,26,0.1)';

const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const NAV = [
  { to: '/shop',          label: 'Shop',     end: true },
  { to: '/auctions',      label: 'Auctions' },
  { to: '/shop/ourstory', label: 'Our story' },
];

// ── Icône panier ─────────────────────────────────────────────────────────────
const CartIcon = ({ color }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const CartButton = () => {
  const { totalCount } = useCart();
  const location = useLocation();
  const onCheckout = location.pathname === '/shop/checkout';

  return (
    <Link to="/shop/checkout" aria-label={`Cart, ${totalCount} item(s)`}
      style={{
        ...sans, position: 'relative', display: 'inline-flex', alignItems: 'center',
        gap: 8, padding: '9px 18px', borderRadius: 100, textDecoration: 'none',
        fontSize: 13, fontWeight: 700,
        border: `1px solid ${onCheckout ? GREEN : BORDER}`,
        background: onCheckout ? 'rgba(22,128,60,0.08)' : 'transparent',
        color: onCheckout ? GREEN : INK,
        transition: 'all 0.2s',
      }}>
      <CartIcon color={onCheckout ? GREEN : INK}/>
      <span>Cart</span>
      {totalCount > 0 && (
        <span style={{
          ...sans, minWidth: 19, height: 19, borderRadius: 100, background: GREEN,
          color: BG, fontSize: 11, fontWeight: 700, display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', padding: '0 6px',
        }}>
          {totalCount}
        </span>
      )}
    </Link>
  );
};

// ── En-tête ──────────────────────────────────────────────────────────────────
const ShopHeader = () => {
  const [open, setOpen] = useState(false);

  const linkStyle = ({ isActive }) => ({
    ...sans, fontSize: 13.5, textDecoration: 'none', padding: '8px 2px',
    color: isActive ? INK : 'rgba(20,35,26,0.55)',
    fontWeight: isActive ? 700 : 400,
    borderBottom: `2px solid ${isActive ? CLAY : 'transparent'}`,
    transition: 'color 0.2s',
  });

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40, background: 'rgba(247,244,238,0.94)',
      backdropFilter: 'blur(8px)', borderBottom: `1px solid ${BORDER}`,
    }}>
      <div style={{
        maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>
        <Link to="/shop" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ ...serif, fontSize: 24, color: INK, fontWeight: 500,
            letterSpacing: 0.5 }}>
            Nkusu
          </span>
          <span style={{ ...sans, fontSize: 9.5, letterSpacing: 2.5, color: CLAY,
            textTransform: 'uppercase', display: 'block', marginTop: -4 }}>
            Verified origin
          </span>
        </Link>

        {/* Desktop */}
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}
          className="shop-nav-desktop">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <CartButton />
          <button onClick={() => setOpen(o => !o)} aria-label="Menu"
            aria-expanded={open}
            className="shop-nav-toggle"
            style={{ ...sans, display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 20, color: INK, padding: '4px 8px' }}>
            {open ? '×' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile */}
      {open && (
        <nav className="shop-nav-mobile"
          style={{ borderTop: `1px solid ${BORDER}`, padding: '8px 24px 16px' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                ...sans, display: 'block', padding: '11px 0', fontSize: 14,
                textDecoration: 'none',
                color: isActive ? GREEN : 'rgba(20,35,26,0.65)',
                fontWeight: isActive ? 700 : 400,
              })}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};

// ── Pied de page ─────────────────────────────────────────────────────────────
const ShopFooter = () => (
  <footer style={{ borderTop: `1px solid ${BORDER}`, background: BG,
    padding: '48px 24px 56px' }}>
    <div style={{ maxWidth: 1160, margin: '0 auto',
      display: 'flex', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 320 }}>
        <div style={{ ...serif, fontSize: 22, color: INK, marginBottom: 8 }}>Nkusu</div>
        <p style={{ ...sans, fontSize: 13, lineHeight: 1.7,
          color: 'rgba(20,35,26,0.5)', margin: 0 }}>
          Coffee and cocoa whose plot of origin is mapped, checked against the
          2020 canopy, and documented for EUDR.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...sans, fontSize: 10.5, letterSpacing: 1.5,
            textTransform: 'uppercase', color: 'rgba(20,35,26,0.4)', marginBottom: 12 }}>
            Buy
          </div>
          {NAV.map(item => (
            <Link key={item.to} to={item.to}
              style={{ ...sans, display: 'block', fontSize: 13, marginBottom: 9,
                color: 'rgba(20,35,26,0.6)', textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </div>
        <div>
          <div style={{ ...sans, fontSize: 10.5, letterSpacing: 1.5,
            textTransform: 'uppercase', color: 'rgba(20,35,26,0.4)', marginBottom: 12 }}>
            Nkusu
          </div>
          <Link to="/" style={{ ...sans, display: 'block', fontSize: 13, marginBottom: 9,
            color: 'rgba(20,35,26,0.6)', textDecoration: 'none' }}>
            Platform
          </Link>
          <Link to="/contactus" style={{ ...sans, display: 'block', fontSize: 13,
            marginBottom: 9, color: 'rgba(20,35,26,0.6)', textDecoration: 'none' }}>
            Contact
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

// ── Layout ───────────────────────────────────────────────────────────────────
const ShopLayout = () => (
  <CartProvider>
    <div style={{ background: BG, minHeight: '100vh',
      display: 'flex', flexDirection: 'column' }}>
      <ShopHeader />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <ShopFooter />

      {/* Les composants boutique utilisent des styles inline, pas Tailwind.
          Ces quelques règles sont les seules qui demandent une media query. */}
      <style>{`
        @media (max-width: 720px) {
          .shop-nav-desktop { display: none !important; }
          .shop-nav-toggle  { display: inline-block !important; }
        }
        @media (min-width: 721px) {
          .shop-nav-mobile { display: none !important; }
        }
      `}</style>
    </div>
  </CartProvider>
);

export default ShopLayout;