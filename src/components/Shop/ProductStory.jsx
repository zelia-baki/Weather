import React, { useState } from 'react';

// =============================================================================
//  ProductStory — src/components/Shop/ProductStory.jsx
//
//  Partagé par la fiche produit et la page d'un lot en enchère. Le storytelling
//  est écrit une fois sur le produit et s'affiche partout où il apparaît.
//
//  Trois blocs, dans cet ordre, parce que c'est l'ordre dans lequel un
//  acheteur décide :
//    1. SPECS   — les faits mesurables (altitude, varietal, process, score)
//    2. RÉCIT   — la voix du producteur, en blocs et non en pavé
//    3. PREUVE  — les données réelles de la parcelle, tirées de la base Nkusu
// =============================================================================

const INK = '#14231a';
const GREEN = '#16803c';
const CLAY = '#a9784f';
const SAND = '#eee9de';
const BORDER = 'rgba(20,35,26,0.12)';

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const sans = { fontFamily: "'Epilogue', sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', serif" };

const eyebrow = {
  ...sans, fontSize: 11, letterSpacing: 2, color: GREEN,
  textTransform: 'uppercase', marginBottom: 12,
};

// ── 1. Fiche technique ───────────────────────────────────────────────────────
// Une bande dense en mono. C'est le langage du métier : un acheteur de café de
// spécialité lit ça avant de lire la prose.
export const SpecStrip = ({ product }) => {
  const specs = [
    ['Altitude', product.altitude_m ? `${product.altitude_m} m` : null],
    ['Varietal', product.varietal],
    ['Process', product.process_method],
    ['Harvest', product.harvest_year],
    ['Cupping', product.cupping_score ? product.cupping_score.toFixed(1) : null],
  ].filter(([, v]) => v);

  if (!specs.length) return null;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(110px, 1fr))`,
      gap: 1, background: BORDER, border: `1px solid ${BORDER}`,
      borderRadius: 10, overflow: 'hidden', margin: '24px 0',
    }}>
      {specs.map(([label, value]) => (
        <div key={label} style={{ background: '#fff', padding: '14px 16px' }}>
          <div style={{ ...sans, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
            color: 'rgba(20,35,26,0.42)', marginBottom: 6 }}>
            {label}
          </div>
          <div style={{ ...mono, fontSize: 14, color: INK }}>{value}</div>
        </div>
      ))}
    </div>
  );
};

// ── Notes de dégustation ─────────────────────────────────────────────────────
export const TastingNotes = ({ notes }) => {
  if (!notes?.length) return null;
  return (
    <div style={{ margin: '20px 0' }}>
      <div style={{ ...sans, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
        color: 'rgba(20,35,26,0.42)', marginBottom: 10 }}>
        In the cup
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {notes.map(note => (
          <span key={note} style={{
            ...serif, fontSize: 16, fontStyle: 'italic', color: INK,
            padding: '4px 14px', borderRadius: 100, background: SAND,
          }}>
            {note}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── 2. Récit en blocs ────────────────────────────────────────────────────────
// story_blocks : [{ type: 'text' | 'quote' | 'image' | 'stat', ... }]
// Un pavé de texte ne raconte rien. Alterner voix, image et chiffre donne un
// rythme de lecture — c'est ce qui manquait à l'ancien champ origin_story seul.
const StoryBlock = ({ block }) => {
  switch (block.type) {
    case 'quote':
      return (
        <figure style={{ margin: '32px 0', paddingLeft: 20, borderLeft: `2px solid ${GREEN}` }}>
          <blockquote style={{ ...serif, fontSize: 22, lineHeight: 1.55, fontStyle: 'italic',
            color: 'rgba(20,35,26,0.9)', margin: 0 }}>
            {block.content}
          </blockquote>
          {block.author && (
            <figcaption style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.5)', marginTop: 12 }}>
              — {block.author}
            </figcaption>
          )}
        </figure>
      );
    case 'image':
      return (
        <figure style={{ margin: '32px 0' }}>
          <img src={block.content} alt={block.caption || ''} loading="lazy"
            style={{ width: '100%', borderRadius: 10, display: 'block' }} />
          {block.caption && (
            <figcaption style={{ ...sans, fontSize: 12, color: 'rgba(20,35,26,0.45)', marginTop: 10 }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case 'stat':
      return (
        <div style={{ margin: '32px 0', textAlign: 'center' }}>
          <div style={{ ...serif, fontSize: 44, color: CLAY, lineHeight: 1 }}>{block.content}</div>
          {block.caption && (
            <div style={{ ...sans, fontSize: 12, letterSpacing: 0.5,
              color: 'rgba(20,35,26,0.5)', marginTop: 8 }}>
              {block.caption}
            </div>
          )}
        </div>
      );
    default:
      return (
        <p style={{ ...sans, fontSize: 15.5, lineHeight: 1.8,
          color: 'rgba(20,35,26,0.72)', margin: '20px 0' }}>
          {block.content}
        </p>
      );
  }
};

export const StoryBlocks = ({ product }) => {
  // Repli sur l'ancien champ tant que les fiches n'ont pas été réécrites.
  const blocks = product.story_blocks?.length
    ? product.story_blocks
    : (product.origin_story ? [{ type: 'text', content: product.origin_story }] : []);

  if (!blocks.length) return null;

  return (
    <section style={{ marginTop: 40, paddingTop: 32, borderTop: `1px solid ${BORDER}` }}>
      <div style={eyebrow}>The story of this lot</div>
      {blocks.map((block, i) => <StoryBlock key={i} block={block} />)}
      {(product.farmer_name || product.origin_country) && (
        <div style={{ ...sans, fontSize: 13, color: 'rgba(20,35,26,0.5)', marginTop: 8 }}>
          {product.farmer_name && <span>Grown by {product.farmer_name}</span>}
          {product.farmer_name && product.origin_country && <span> · </span>}
          {product.origin_country && <span>{product.origin_country}</span>}
        </div>
      )}
    </section>
  );
};

// ── 3. Panneau de preuve ─────────────────────────────────────────────────────
// C'est le seul argument qui justifie un prix premium : pas une promesse, des
// données. Elles viennent de Farm et FarmReport, déjà présents dans la base.
export const ProofPanel = ({ traceability }) => {
  const [open, setOpen] = useState(false);
  if (!traceability) return null;

  const rows = [
    ['Plot', traceability.farm_name],
    ['Location', [traceability.subcounty, traceability.country].filter(Boolean).join(', ')],
    ['Coordinates', traceability.geolocation],
    ['Forest cover 2020', traceability.forest_cover_2020],
    ['Tree cover loss', traceability.tree_cover_loss],
    ['RADD alert', traceability.radd_alert],
    ['Protected area', traceability.protected_area_status],
    ['EUDR assessment', traceability.eudr_compliance_assessment],
  ].filter(([, v]) => v);

  if (!rows.length) return null;

  return (
    <section style={{ marginTop: 40 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          background: 'rgba(22,128,60,0.06)', border: `1px solid rgba(22,128,60,0.25)`,
          borderRadius: open ? '12px 12px 0 0' : 12, padding: '18px 22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}
      >
        <span>
          <span style={{ ...sans, fontSize: 11, letterSpacing: 2, color: GREEN,
            textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
            Verified traceability
          </span>
          <span style={{ ...serif, fontSize: 19, color: INK }}>
            Open the plot record
          </span>
        </span>
        <span style={{ ...mono, fontSize: 18, color: GREEN,
          transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>
          +
        </span>
      </button>

      {open && (
        <div style={{
          border: `1px solid rgba(22,128,60,0.25)`, borderTop: 'none',
          borderRadius: '0 0 12px 12px', background: '#fff', overflow: 'hidden',
        }}>
          {rows.map(([label, value], i) => (
            <div key={label} style={{
              display: 'grid', gridTemplateColumns: 'minmax(140px, 34%) 1fr', gap: 16,
              padding: '13px 22px', borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
            }}>
              <span style={{ ...sans, fontSize: 12.5, color: 'rgba(20,35,26,0.5)' }}>
                {label}
              </span>
              <span style={{ ...mono, fontSize: 12.5, color: INK, wordBreak: 'break-word' }}>
                {value}
              </span>
            </div>
          ))}
          {traceability.assessed_on && (
            <div style={{ ...sans, fontSize: 11, color: 'rgba(20,35,26,0.4)',
              padding: '12px 22px', borderTop: `1px solid ${BORDER}`, background: SAND }}>
              Assessed on {new Date(traceability.assessed_on).toLocaleDateString('en-US')}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default { SpecStrip, TastingNotes, StoryBlocks, ProofPanel };