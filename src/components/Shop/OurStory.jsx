import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import VerifiedStamp from './VerifiedStamp';

// ─────────────────────────────────────────────────────────────────────────
// Hook: reveals a section on scroll (once, kept subtle)
// ─────────────────────────────────────────────────────────────────────────
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
};

const Reveal = ({ children, delay = 0 }) => {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Signature motif: a canopy silhouette — recurring divider that echoes
// "what was kept standing"
// ─────────────────────────────────────────────────────────────────────────
const CanopyDivider = ({ tone = '#1F7A4C' }) => (
  <svg viewBox="0 0 1200 60" style={{ width: '100%', height: 44, display: 'block' }} preserveAspectRatio="none">
    <path
      d="M0,40 Q40,10 80,38 Q120,8 165,36 Q205,6 250,34 Q300,4 350,32 Q400,8 450,36
         Q500,6 555,34 Q610,10 660,36 Q715,4 770,32 Q825,10 880,36 Q935,6 990,34
         Q1045,10 1100,36 Q1150,14 1200,32 L1200,60 L0,60 Z"
      fill={tone}
      opacity="0.16"
    />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────
// Light-mode tokens
// ─────────────────────────────────────────────────────────────────────────
const PAGE_BG = '#FAF7F1';
const INK = '#1A2A1F';
const BORDER = 'rgba(26,42,31,0.12)';
const GREEN = '#1F7A4C';
const CLAY = '#A9723C';
const RUST = '#9C4A2E';

const eyebrowStyle = {
  fontFamily: "'Epilogue', sans-serif", fontSize: 12, letterSpacing: 3,
  color: GREEN, textTransform: 'uppercase',
};
const serifStyle = { fontFamily: "'Cormorant Garamond', serif", color: INK, fontWeight: 500 };
const bodyStyle = { fontFamily: "'Epilogue', sans-serif", color: 'rgba(26,42,31,0.66)', lineHeight: 1.75 };
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" };

// ─────────────────────────────────────────────────────────────────────────
const STAGES = [
  {
    n: '01',
    title: 'Every plot gets pinned',
    text: "Before the first harvest, the farm is mapped point by point. No rough estimate — precise GPS coordinates become the legal foundation for everything that follows.",
  },
  {
    n: '02',
    title: 'The canopy is checked',
    text: "Satellite imagery is compared against 2020 tree-cover baselines. If the plot lost forest after that date, the lot is rejected — no exceptions.",
  },
  {
    n: '03',
    title: 'The harvest is logged on-site',
    text: "Quality, weight, harvest date: every lot is recorded the moment it leaves the farm, by the same people who grew it.",
  },
  {
    n: '04',
    title: 'EUDR compliance is established',
    text: "A due-diligence statement (DDS) is generated for the lot. It's this document, not a marketing claim, that clears the way into the European market.",
  },
  {
    n: '05',
    title: 'The lot ships, the proof stays',
    text: "The coffee or cocoa travels. The traceability record stays on file — it's the stamp you see on every product page.",
  },
];

// ─────────────────────────────────────────────────────────────────────────
const OurStory = () => {
  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh' }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: '104px 24px 64px', borderBottom: `1px solid ${BORDER}`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={eyebrowStyle}>The story behind the stamp</div>
          <h1 style={{ ...serifStyle, fontSize: 'clamp(38px, 5.5vw, 62px)', lineHeight: 1.12, margin: '20px 0 24px' }}>
            Before it was a cup of coffee,<br />it was a forest someone chose to keep standing.
          </h1>
          <p style={{ ...bodyStyle, fontSize: 16, maxWidth: 540 }}>
            Nkusu doesn't just sell coffee and cocoa. We sell proof that the plot behind them
            didn't cost a single hectare of forest. That proof has a price — it's why our lots
            cost more than an ordinary bag.
          </p>
        </div>
      </section>

      <CanopyDivider />

      {/* ── The choice ───────────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 56, alignItems: 'start',
        }}>
          <Reveal>
            <div style={eyebrowStyle}>The problem</div>
            <h2 style={{ ...serifStyle, fontSize: 30, margin: '16px 0' }}>
              Coffee and cocoa are among the leading drivers of imported deforestation.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ ...bodyStyle, fontSize: 15, marginBottom: 18 }}>
              Across steep hillsides and forest-edge farmland, cash-crop expansion has long eaten
              into standing forest, hectare by hectare — usually with no record proving it either
              way.
            </p>
            <p style={{ ...bodyStyle, fontSize: 15, marginBottom: 18 }}>
              The EU Deforestation Regulation (EUDR) changed that: it now requires geolocated,
              verifiable proof for any lot entering the European market. We chose to apply that
              standard at the plot level, not just at export.
            </p>
            <p style={{ ...bodyStyle, fontSize: 15 }}>
              The result: a farmer who protects their forest can finally prove it — and get paid
              for it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Before / After ───────────────────────────────────────────── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 280 }}>
          <div style={{
            padding: '48px 40px', background: 'rgba(156,74,46,0.05)',
            borderRight: `1px solid ${BORDER}`,
          }}>
            <Reveal>
              <div style={{ ...eyebrowStyle, color: RUST }}>Without traceability</div>
              <p style={{ ...serifStyle, fontSize: 22, margin: '14px 0', color: 'rgba(26,42,31,0.85)' }}>
                The lot gets mixed with others, the origin dissolves, and no one can say where the
                bean really came from — or what its farming cost the forest next door.
              </p>
            </Reveal>
          </div>
          <div style={{ padding: '48px 40px', background: 'rgba(31,122,76,0.06)' }}>
            <Reveal delay={100}>
              <div style={eyebrowStyle}>With Nkusu</div>
              <p style={{ ...serifStyle, fontSize: 22, margin: '14px 0', color: 'rgba(26,42,31,0.85)' }}>
                The lot stays identifiable from plot to shipment. The <VerifiedStamp inline />{' '}
                stamp only appears once the full record — geolocation, canopy check, compliance —
                holds up.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Process (real sequence → numbering earns its place) ───────── */}
      <section style={{ padding: '80px 24px 72px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto 56px' }}>
          <Reveal>
            <div style={eyebrowStyle}>How a lot becomes "verified"</div>
            <h2 style={{ ...serifStyle, fontSize: 32, marginTop: 16 }}>Five steps, in this order, none of them skipped.</h2>
          </Reveal>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {STAGES.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div style={{
                display: 'flex', gap: 28, padding: '26px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${BORDER}`,
              }}>
                <div style={{ ...monoStyle, fontSize: 13, color: CLAY, paddingTop: 4, minWidth: 28 }}>
                  {s.n}
                </div>
                <div>
                  <h3 style={{ ...serifStyle, fontSize: 20, marginBottom: 8, fontWeight: 500 }}>{s.title}</h3>
                  <p style={{ ...bodyStyle, fontSize: 14.5 }}>{s.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <CanopyDivider tone={CLAY} />

      {/* ── Farmer's voice ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <p style={{
              ...serifStyle, fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.5,
              fontStyle: 'italic', color: 'rgba(26,42,31,0.92)',
            }}>
              "Before, no one asked me where my field's edge stopped. Now that edge is what
              proves I never touched the forest — and it's what justifies my price."
            </p>
            <div style={{ ...bodyStyle, fontSize: 13, marginTop: 20, letterSpacing: 0.5 }}>
              — A partner farmer in the Nkusu network
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Numbers ──────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{
          maxWidth: 900, margin: '0 auto', display: 'flex', gap: 48,
          flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center',
        }}>
          {[
            ['100%', 'of lots geolocated before harvest'],
            ['2020', 'baseline year for forest cover'],
            ['0 ha', 'of forest lost on verified plots'],
          ].map(([value, label], i) => (
            <Reveal key={label} delay={i * 90}>
              <div style={{ minWidth: 180 }}>
                <div style={{ ...serifStyle, fontSize: 36, color: CLAY }}>{value}</div>
                <div style={{ ...bodyStyle, fontSize: 12.5, letterSpacing: 0.5 }}>{label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA back to shop ─────────────────────────────────────────── */}
      <section style={{ padding: '56px 24px 104px', textAlign: 'center' }}>
        <Reveal>
          <p style={{ ...bodyStyle, fontSize: 14, marginBottom: 20 }}>
            Every product in the shop carries this same chain of proof.
          </p>
          <Link
            to="/shop"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '13px 28px', borderRadius: 100, textDecoration: 'none',
              fontFamily: "'Epilogue', sans-serif", fontSize: 13, letterSpacing: 0.5,
              background: GREEN, color: '#FAF7F1', fontWeight: 700,
            }}
          >
            Browse available lots →
          </Link>
        </Reveal>
      </section>
    </div>
  );
};

export default OurStory;