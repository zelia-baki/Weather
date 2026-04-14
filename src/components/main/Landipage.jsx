import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import parrot from "../img/parrot.jpg";
import {
  FaGlobe, FaCloudSunRain, FaLeaf, FaTree, FaTractor, FaQrcode,
  FaChartLine, FaEnvelope, FaSatelliteDish, FaBars, FaTimes,
} from "react-icons/fa";

import {
  colors, fonts, radius, shadows,
  btnPrimary, btnOutline, featCard,
  sectionLabel, displayTitle, mutedText, monoLabel,
} from "../../theme";

/* ─── STYLES CSS LOCAUX ──────────────────────────────────────────────────────── */
const LocalStyles = () => (
  <style>{`
    /* ── SPLASH ── */
    .splash {
      position: fixed; inset: 0; z-index: 9999;
      background: #020602;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 32px;
    }
    .splash-radar { position: relative; width: 200px; height: 200px; }
    .splash-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 1px solid rgba(34,197,94,0.3);
    }
    .splash-ring:nth-child(2) { inset: 20px; border-color: rgba(34,197,94,0.2); }
    .splash-ring:nth-child(3) { inset: 40px; border-color: rgba(34,197,94,0.15); }
    .splash-scan { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; }
    .splash-scan::before {
      content: '';
      position: absolute; top: 50%; left: 50%;
      width: 50%; height: 2px;
      background: linear-gradient(90deg, transparent, #22c55e);
      transform-origin: left center;
      animation: radarSpin 1.8s linear infinite;
    }
    .splash-scan::after {
      content: '';
      position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from 0deg, rgba(34,197,94,0.15), transparent 40%, transparent);
      animation: radarSpin 1.8s linear infinite;
    }
    .splash-dot { position: absolute; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e; }
    .splash-dot-1 { width: 6px; height: 6px; top: 30%; left: 60%; }
    .splash-dot-2 { width: 4px; height: 4px; top: 65%; left: 35%; opacity: 0.7; }
    .splash-dot-3 { width: 5px; height: 5px; top: 45%; left: 70%; opacity: 0.5; }
    .splash-cross { position: absolute; inset: 0; }
    .splash-cross::before, .splash-cross::after { content: ''; position: absolute; background: rgba(34,197,94,0.2); }
    .splash-cross::before { width: 1px; height: 100%; left: 50%; top: 0; }
    .splash-cross::after  { height: 1px; width: 100%; top: 50%; left: 0; }
    .splash-progress { width: 180px; height: 2px; background: rgba(34,197,94,0.15); border-radius: 2px; overflow: hidden; }
    .splash-progress-bar {
      height: 100%; background: #22c55e;
      box-shadow: 0 0 8px #22c55e; border-radius: 2px;
      animation: loadBar 2.2s ease-out forwards;
    }

    /* ── PARTICLES ── */
    .particle {
      position: absolute; width: 2px; height: 2px;
      background: #22c55e; border-radius: 50%; opacity: 0;
      animation: floatUp var(--dur, 8s) var(--delay, 0s) infinite ease-in;
    }

    /* ── HERO GRID ── */
    .hero-grid-bg {
      background-image:
        linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%);
    }

    /* ── TICKER ── */
    .ticker-wrap { overflow: hidden; }
    .ticker-track {
      display: flex; gap: 60px;
      animation: ticker 25s linear infinite;
      width: max-content;
    }

    /* ── NAV RESPONSIVE ── */
    .desktop-nav {
      display: flex;
      gap: 36px;
      align-items: center;
    }
    .nav-link {
      font-family: var(--body); font-size: 13px; font-weight: 500;
      letter-spacing: 0.08em; color: var(--muted);
      text-decoration: none; cursor: pointer;
      transition: color 0.2s; text-transform: uppercase;
    }
    .nav-link:hover { color: var(--text); }

    /* Desktop CTA buttons in header */
    .header-cta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-signin { display: inline-flex; }

    /* Hamburger: hidden on desktop */
    .menu-burger {
      background: none; border: none;
      color: var(--text); font-size: 20px;
      cursor: pointer; display: none;
      padding: 4px;
    }

    /* ── FEATURE CARD hover ── */
    .feat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 32px;
      transition: all 0.3s;
      position: relative; overflow: hidden;
    }
    .feat-card::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(34,197,94,0.06), transparent 60%);
      opacity: 0; transition: opacity 0.4s;
    }
    .feat-card:hover::before { opacity: 1; }
    .feat-card:hover {
      border-color: rgba(34,197,94,0.25);
      transform: translateY(-4px);
      box-shadow: ${shadows.card};
    }

    /* ── BUTTONS ── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px;
      background: var(--green); color: #050c06;
      font-family: var(--body); font-size: 14px; font-weight: 700;
      border-radius: 100px; text-decoration: none;
      border: none; cursor: pointer;
      transition: all 0.25s; letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .btn-primary:hover {
      background: #4ade80;
      box-shadow: 0 0 30px rgba(34,197,94,0.4);
      transform: translateY(-2px);
    }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 28px; background: transparent; color: var(--text);
      font-family: var(--body); font-size: 14px; font-weight: 500;
      border-radius: 100px; text-decoration: none;
      border: 1px solid var(--border); cursor: pointer;
      transition: all 0.25s; letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .btn-outline:hover { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05); }

    /* ── STAT ── */
    .stat-card { padding: 24px 32px; border-right: 1px solid var(--border); }
    .stat-card:last-child { border-right: none; }

    /* ── ORBIT ── */
    .orbit-container { position: relative; width: 380px; height: 380px; }
    .orbit-ring {
      position: absolute; border-radius: 50%;
      border: 1px dashed rgba(34,197,94,0.18);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }
    .orbit-planet {
      position: absolute; border-radius: 50%;
      background: var(--bg); border: 1px solid rgba(34,197,94,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: var(--green);
      box-shadow: 0 0 15px rgba(34,197,94,0.2);
    }
    .orbit-1 { width: 280px; height: 280px; animation: orbitSpin 14s linear infinite; }
    .orbit-2 { width: 340px; height: 340px; animation: orbitSpin 22s linear infinite reverse; }
    .orbit-3 { width: 380px; height: 380px; animation: orbitSpin 30s linear infinite; }
    .planet-1 { width: 34px; height: 34px; top: -17px; left: calc(50% - 17px); animation: counterSpin 14s linear infinite; }
    .planet-2 { width: 28px; height: 28px; top: -14px; left: calc(50% - 14px); animation: counterSpin 22s linear infinite reverse; }
    .planet-3 { width: 30px; height: 30px; top: -15px; left: calc(50% - 15px); animation: counterSpin 30s linear infinite; }

    /* ── CONTACT CHIP ── */
    .contact-chip {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 12px 20px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 100px; font-size: 13px; color: var(--muted);
      transition: all 0.25s; text-decoration: none;
    }
    .contact-chip:hover { border-color: rgba(34,197,94,0.3); color: var(--text); background: var(--green-dim); }

    /* ── MOBILE MENU ── */
    .mobile-menu {
      position: fixed; inset: 0; background: rgba(5,12,6,0.98);
      backdrop-filter: blur(20px); z-index: 400;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 40px;
    }
    .mobile-nav-link {
      font-family: var(--display); font-size: 36px; font-weight: 300;
      color: var(--text); text-decoration: none; letter-spacing: 0.05em; transition: color 0.2s;
    }
    .mobile-nav-link:hover { color: var(--green); }

    /* ── GLOW BLOB ── */
    .glow-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }

    /* ── HERO ── */
    .hero-inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: flex; align-items: center;
      gap: 60px; justify-content: space-between;
      flex-wrap: wrap;
    }
    .hero-left { flex: 1 1 480px; max-width: 600px; }
    .hero-right { flex: 1 1 300px; display: flex; justify-content: center; }
    .hero-cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 48px; }

    /* ── EUDR HIGHLIGHT ── */
    .eudr-section {
      margin: 0 40px 120px;
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(34,197,94,0.06), rgba(96,165,250,0.04));
      border: 1px solid rgba(34,197,94,0.12);
      padding: 80px 60px;
      display: flex; gap: 60px;
      align-items: center; flex-wrap: wrap;
      position: relative; overflow: hidden;
    }
    .eudr-grid {
      flex: 1 1 280px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }

    /* ── FOOTER ── */
    .footer-inner {
      display: flex; align-items: center;
      justify-content: space-between;
      flex-wrap: wrap; gap: 20px;
    }
    .footer-links { display: flex; gap: 24px; }

    /* ── FEATURES SECTION ── */
    .features-section {
      padding: 120px 40px;
      max-width: 1240px; margin: 0 auto;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* ── CONTACT SECTION ── */
    .contact-section {
      padding: 120px 40px; text-align: center;
      background: linear-gradient(180deg, transparent, rgba(34,197,94,0.03), transparent);
    }
    .contact-chips {
      display: flex; gap: 12px;
      justify-content: center; flex-wrap: wrap;
    }

    /* ══════════════════════════════════════════════
       RESPONSIVE — TABLET  (≤ 1024px)
    ══════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .orbit-container { width: 300px; height: 300px; }
      .orbit-1 { width: 220px; height: 220px; }
      .orbit-2 { width: 268px; height: 268px; }
      .orbit-3 { width: 300px; height: 300px; }
    }

    /* ══════════════════════════════════════════════
       RESPONSIVE — MOBILE  (≤ 768px)
    ══════════════════════════════════════════════ */
    @media (max-width: 768px) {

      /* ── Header ── */
      .desktop-nav   { display: none !important; }
      .header-signin { display: none !important; }
      .menu-burger   { display: block !important; }
      .header-cta .btn-primary { padding: 8px 16px; font-size: 12px; }

      /* ── Hero ── */
      .hero-section { padding: 60px 20px 40px !important; min-height: auto !important; }
      .hero-inner   { gap: 32px; }
      .hero-left    { flex: 1 1 100%; max-width: 100%; text-align: center; }
      .hero-right   { flex: 1 1 100%; }
      .hero-cta-row { justify-content: center; }

      /* ── Orbit ── */
      .orbit-container { width: 220px; height: 220px; }
      .orbit-1 { width: 160px; height: 160px; }
      .orbit-2 { width: 196px; height: 196px; }
      .orbit-3 { width: 220px; height: 220px; }

      /* ── Ticker ── */
      .ticker-wrap { padding: 10px 0; }

      /* ── Stats ── */
      .stat-card {
        flex: 1 1 calc(50% - 1px) !important;
        border-right: none !important;
        border-bottom: 1px solid var(--border);
        padding: 20px 16px !important;
      }

      /* ── Features ── */
      .features-section { padding: 64px 20px; }
      .features-grid { grid-template-columns: 1fr; }
      .feat-card { padding: 24px; }

      /* ── EUDR ── */
      .eudr-section {
        margin: 0 16px 64px !important;
        padding: 40px 24px !important;
        gap: 32px;
      }
      .eudr-grid { grid-template-columns: 1fr 1fr; }

      /* ── Contact ── */
      .contact-section { padding: 64px 20px; }

      /* ── Footer ── */
      .footer-inner {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .footer-links { gap: 16px; }
      footer { padding: 32px 20px !important; }

      /* ── Mobile nav link font ── */
      .mobile-nav-link { font-size: 28px; }
    }

    /* ══════════════════════════════════════════════
       RESPONSIVE — SMALL MOBILE  (≤ 480px)
    ══════════════════════════════════════════════ */
    @media (max-width: 480px) {
      .eudr-grid { grid-template-columns: 1fr; }
      .stat-card { flex: 1 1 100% !important; border-bottom: 1px solid var(--border) !important; }
      .hero-cta-row .btn-primary,
      .hero-cta-row .btn-outline { width: 100%; justify-content: center; }
      .contact-chip { width: 100%; justify-content: center; }
    }

    /* ── KEYFRAMES ── */
    @keyframes radarSpin  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);   } }
    @keyframes loadBar    { from { width: 0; }                  to { width: 100%; } }
    @keyframes floatUp {
      0%   { opacity: 0; transform: translateY(0)   scale(0); }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.2; }
      100% { opacity: 0; transform: translateY(-120px) scale(0.5); }
    }
    @keyframes ticker     { from { transform: translateX(0);  } to { transform: translateX(-50%); } }
    @keyframes orbitSpin  { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(360deg);   } }
    @keyframes counterSpin{ from { transform: rotate(0deg);   } to { transform: rotate(-360deg);  } }
  `}</style>
);

/* ─── SPLASH SCREEN ─────────────────────────────────────────────────────────── */
const SplashScreen = ({ onDone }) => {
  const statuses = [
    "Connecting to satellite feed...",
    "Loading geospatial data...",
    "Initializing EUDR compliance...",
    "Ready.",
  ];
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const timers = statuses.map((_, i) => setTimeout(() => setStatusIdx(i), i * 600 + 200));
    const done = setTimeout(onDone, 2800);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  return (
    <motion.div
      className="splash"
      exit={{ y: "-100%", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
    >
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        pointerEvents: "none", opacity: 0.4,
      }} />

      <motion.div
        className="splash-radar"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="splash-ring" />
        <div className="splash-ring" />
        <div className="splash-ring" />
        <div className="splash-cross" />
        <div className="splash-scan" />
        <div className="splash-dot splash-dot-1" />
        <div className="splash-dot splash-dot-2" />
        <div className="splash-dot splash-dot-3" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ fontFamily: fonts.mono, fontSize: "clamp(36px,8vw,64px)", fontWeight: 700, color: colors.green, letterSpacing: "0.25em", textTransform: "uppercase" }}>
          NKUSU
        </div>
        <div style={{ ...monoLabel(colors.muted), marginTop: 8, fontSize: "11px" }}>
          Agriyields Traceability Portal
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        <div className="splash-progress">
          <div className="splash-progress-bar" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={statusIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ fontFamily: fonts.mono, fontSize: "10px", color: "rgba(34,197,94,0.5)", letterSpacing: "0.1em" }}
          >
            {statuses[statusIdx]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

/* ─── PARTICLES ──────────────────────────────────────────────────────────────── */
const Particles = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: `${Math.random() * 30}%`,
          "--dur":   `${6 + Math.random() * 10}s`,
          "--delay": `${Math.random() * 8}s`,
        }}
      />
    ))}
  </div>
);

/* ─── ORBIT VISUAL ───────────────────────────────────────────────────────────── */
const OrbitVisual = () => (
  <div className="orbit-container" style={{ flexShrink: 0 }}>
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      width: 80, height: 80, borderRadius: "50%",
      background: `radial-gradient(circle, ${colors.greenDim}, rgba(34,197,94,0.05))`,
      border: `1px solid rgba(34,197,94,0.4)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: shadows.glowMd,
      zIndex: 10,
    }}>
      <img src={parrot} alt="Nkusu" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
    </div>

    <div className="orbit-ring orbit-1">
      <div className="orbit-planet planet-1"><FaTree /></div>
    </div>
    <div className="orbit-ring orbit-2">
      <div className="orbit-planet planet-2"><FaQrcode /></div>
    </div>
    <div className="orbit-ring orbit-3">
      <div className="orbit-planet planet-3"><FaSatelliteDish /></div>
    </div>

    {[
      { label: "Forest", x: "85%", y: "8%"  },
      { label: "Farm",   x: "5%",  y: "45%" },
      { label: "EUDR",   x: "78%", y: "82%" },
    ].map(({ label, x, y }) => (
      <div key={label} style={{ position: "absolute", left: x, top: y, ...monoLabel("rgba(34,197,94,0.6)"), fontSize: "9px" }}>
        {label}
      </div>
    ))}
  </div>
);

/* ─── LANDING PAGE ───────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const features = [
    { Icon: FaTree,         label: "Forest",  title: "Forest Management",    color: colors.green,      bg: "rgba(34,197,94,0.1)",   desc: "Real-time data insights for biodiversity and forestry conservation, anti-deforestation, afforestation & reforestation with satellite precision." },
    { Icon: FaQrcode,       label: "Trace",   title: "Digital Trace ID",     color: colors.blue,       bg: colors.blueDim,          desc: "Track produce and inventory, trace supply chains from farm to fork by generating secure digital certificates & stamps." },
    { Icon: FaTractor,      label: "Farm",    title: "Farm Management",      color: colors.amber,      bg: colors.amberDim,         desc: "Manage and monitor farm operations with actionable geospatial data insights and AI-driven crop performance analytics." },
    { Icon: FaLeaf,         label: "EUDR",    title: "EUDR Compliance",      color: colors.purple,     bg: colors.purpleDim,        desc: "Leverage advanced geospatial analytics and machine learning for environmental risk assessments and EUDR compliance verification." },
    { Icon: FaCloudSunRain, label: "Climate", title: "Climate Intelligence", color: colors.sky,        bg: colors.skyDim,           desc: "Gain insights into how changing weather and climate patterns affect your business through area-based risk assessments." },
    { Icon: FaChartLine,    label: "Carbon",  title: "Carbon Offset",        color: colors.greenLight, bg: "rgba(74,222,128,0.1)",  desc: "Contribute to climate sustainability and the Net Zero agenda by managing and tracking carbon and GHG emissions precisely." },
  ];

  const stats = [
    { val: "50M+", label: "Hectares Monitored" },
    { val: "120+", label: "Countries Covered"  },
    { val: "99.2%",label: "EUDR Accuracy"      },
    { val: "< 3s", label: "Satellite Refresh"  },
  ];

  const ticker = [
    "🌍 Forest Risk Assessment", "📡 Live Satellite Feed",
    "🌿 Carbon Sequestration",   "🔗 Supply Chain Traceability",
    "📊 EUDR Compliance",        "🌱 Biodiversity Monitoring",
    "🗺️ Geospatial Intelligence","⚡ Real-Time Analytics",
  ];

  return (
    <>
      <LocalStyles />

      {/* SPLASH */}
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </AnimatePresence>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: colors.muted, fontSize: 22, cursor: "pointer" }}>
              <FaTimes />
            </button>
            {["Features", "About", "Tools", "Contact"].map((item, i) => (
              <motion.a
                key={item}
                href={item === "Features" ? "#features" : item === "Contact" ? "#contact" : "#"}
                className="mobile-nav-link"
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                {item}
              </motion.a>
            ))}
            <motion.a href="/login" className="btn-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              Get Started
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={splashDone ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "sticky", top: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 clamp(16px, 4vw, 40px)", height: 68,
          background: "rgba(5,12,6,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(34,197,94,0.35)", boxShadow: shadows.glowSm }}>
            <img src={parrot} alt="Nkusu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: fonts.mono, fontSize: 15, fontWeight: 700, letterSpacing: "0.15em", color: colors.text }}>
            NKUSU
          </span>
        </div>

        {/* Desktop nav — hidden on mobile via CSS */}
        <nav className="desktop-nav">
          {[
            { label: "Features", to: "features", scroll: true },
            { label: "About",    href: "/sectionfutur" },
            { label: "Tools",    href: "/EUDRSubmissionForGuest" },
            { label: "Contact",  to: "contact", scroll: true },
          ].map((item) =>
            item.scroll ? (
              <ScrollLink key={item.label} to={item.to} smooth duration={500} offset={-80} className="nav-link">
                {item.label}
              </ScrollLink>
            ) : (
              <a key={item.label} href={item.href} className="nav-link">{item.label}</a>
            )
          )}
        </nav>

        {/* CTA + burger */}
        <div className="header-cta">
          <a href="/login" className="btn-outline header-signin" style={{ padding: "9px 20px", fontSize: 13 }}>Sign In</a>
          <a href="/login" className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>Get Started</a>
          {/* Burger — hidden on desktop via CSS */}
          <button className="menu-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <FaBars />
          </button>
        </div>
      </motion.header>

      {/* HERO */}
      <section
        ref={heroRef}
        className="hero-section"
        style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", padding: "80px clamp(20px,5vw,60px) 60px", overflow: "hidden" }}
      >
        <motion.div className="hero-grid-bg" style={{ position: "absolute", inset: 0, y: heroY }} />
        <div className="glow-blob" style={{ width: 500, height: 500, background: "rgba(34,197,94,0.07)", top: "-10%", right: "10%" }} />
        <div className="glow-blob" style={{ width: 400, height: 400, background: `${colors.amberDim}`, bottom: "0%", left: "5%" }} />
        <Particles />

        <div className="hero-inner">
          {/* Left */}
          <div className="hero-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={splashDone ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: colors.greenDim, border: "1px solid rgba(34,197,94,0.25)", borderRadius: radius.full, marginBottom: 24 }}>
                <span style={{ width: 6, height: 6, background: colors.green, borderRadius: "50%", boxShadow: `0 0 6px ${colors.green}`, display: "inline-block" }} />
                <span style={{ ...monoLabel(), fontSize: "10px" }}>Live Satellite Data</span>
              </div>

              {/* Headline */}
              <h1 style={{ ...displayTitle("clamp(36px, 5.5vw, 80px)"), fontWeight: 300, letterSpacing: "-0.01em", marginBottom: 28 }}>
                Precision Agriculture{" "}
                <em style={{ color: colors.green, fontStyle: "italic" }}>Intelligence</em>{" "}
                from Space
              </h1>

              <p style={{ ...mutedText(16), maxWidth: 480, marginBottom: 40 }}>
                Data-driven monitoring and insights for your area of interest using next-generation satellite imagery, geospatial AI, and real-time traceability.
              </p>

              <div className="hero-cta-row">
                <a href="/login" className="btn-primary">Start Free Trial →</a>
                <a href="/EUDRSubmissionForGuest" className="btn-outline">EUDR Tools</a>
              </div>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: fonts.body, fontSize: 12, color: colors.muted, flexWrap: "wrap" }}>
                {[...Array(5)].map((_, i) => <span key={i} style={{ color: colors.amber }}>★</span>)}
                <span>Trusted by 2,000+ agronomists worldwide</span>
              </div>
            </motion.div>
          </div>

          {/* Right */}
          <motion.div
            className="hero-right"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={splashDone ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrbitVisual />
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ ...monoLabel(colors.muted), fontSize: "9px" }}>Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} style={{ width: 1, height: 28, background: `linear-gradient(to bottom, ${colors.green}, transparent)` }} />
        </div>
      </section>

      {/* TICKER */}
      <div style={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, padding: "14px 0", background: "rgba(34,197,94,0.03)" }}>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...ticker, ...ticker].map((item, i) => (
              <span key={i} style={{ fontFamily: fonts.mono, fontSize: 11, color: "rgba(34,197,94,0.55)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <section style={{ borderBottom: `1px solid ${colors.border}`, display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
        {stats.map(({ val, label }, i) => (
          <motion.div
            key={i} className="stat-card"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            style={{ flex: "1 1 160px", textAlign: "center" }}
          >
            <div style={{ ...displayTitle("clamp(28px,4vw,44px)"), fontWeight: 600, lineHeight: 1.1, marginBottom: 6 }}>{val}</div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, letterSpacing: "0.05em" }}>{label}</div>
          </motion.div>
        ))}
      </section>

      {/* FEATURES */}
      <section id="features" className="features-section">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 64 }}>
          <div style={sectionLabel}>Platform Features</div>
          <h2 style={{ ...displayTitle(), maxWidth: 520 }}>
            Everything you need to{" "}
            <em style={{ color: colors.green, fontStyle: "italic" }}>scale sustainably</em>
          </h2>
        </motion.div>

        <div className="features-grid">
          {features.map(({ Icon, label, title, color, bg, desc }, i) => (
            <motion.div
              key={i} className="feat-card"
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.07 }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
                e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top)  / r.height * 100).toFixed(1)}%`);
              }}
            >
              <span style={{ position: "absolute", top: 24, right: 24, fontFamily: fonts.mono, fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
                0{i + 1}
              </span>
              <div style={{ width: 52, height: 52, borderRadius: radius.md, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: bg, color, fontSize: 20 }}>
                <Icon />
              </div>
              <div style={{ ...monoLabel(color), marginBottom: 8 }}>{label}</div>
              <h3 style={{ fontFamily: fonts.display, fontSize: 22, fontWeight: 600, color: colors.text, marginBottom: 12 }}>{title}</h3>
              <p style={mutedText(14)}>{desc}</p>
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, color, fontSize: 12, fontFamily: fonts.mono, letterSpacing: "0.05em" }}>
                Learn more <span style={{ fontSize: 16 }}>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EUDR HIGHLIGHT */}
      <section className="eudr-section">
        <div className="glow-blob" style={{ width: 300, height: 300, background: "rgba(34,197,94,0.08)", top: "-50%", right: "10%", filter: "blur(60px)" }} />
        <div style={{ flex: "1 1 400px" }}>
          <div style={sectionLabel}>New Feature</div>
          <h2 style={{ ...displayTitle("clamp(28px,4vw,52px)"), marginBottom: 20 }}>
            EUDR Compliance{" "}
            <em style={{ color: colors.green, fontStyle: "italic" }}>made simple</em>
          </h2>
          <p style={{ ...mutedText(15), maxWidth: 480, marginBottom: 32 }}>
            Upload your GeoJSON, get instant risk assessments and generate certified Due Diligence Statements. Compliant with EU Regulation 2023/1115.
          </p>
          <a href="/EUDRSubmissionForGuest" className="btn-primary">Try EUDR Tools Free →</a>
        </div>

        <div className="eudr-grid">
          {[
            { icon: "🛰️", label: "Satellite Verified" },
            { icon: "⚡", label: "Instant Results"    },
            { icon: "📄", label: "Auto-Generated Docs"},
            { icon: "🔒", label: "EU Certified"       },
          ].map(({ icon, label }) => (
            <div key={label} style={{ padding: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, borderRadius: radius.md, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={mutedText(12)}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact-section">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ ...sectionLabel, textAlign: "center", marginBottom: 16 }}>Get In Touch</div>
          <h2 style={{ ...displayTitle("clamp(32px,6vw,80px)"), marginBottom: 20 }}>
            Join the big data{" "}
            <em style={{ color: colors.green, fontStyle: "italic" }}>revolution</em>
          </h2>
          <p style={{ ...mutedText(16), maxWidth: 480, margin: "0 auto 48px" }}>
            Explore and transform the way you do business with next-generation satellite intelligence.
          </p>
          <div className="contact-chips">
            <a href="/contactus"             className="contact-chip"><FaEnvelope style={{ color: colors.green }} /><span>Email Us</span></a>
            <a href="/signup"                className="contact-chip"><span>✦</span><span>Create Account</span></a>
            <a href="/EUDRSubmissionForGuest" className="contact-chip"><FaGlobe   style={{ color: colors.green }} /><span>Free Tools</span></a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${colors.border}`, padding: "40px clamp(20px,5vw,40px)" }}>
        <div className="footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: fonts.mono, fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", color: colors.muted }}>NKUSU</span>
            <span style={{ color: colors.border, fontSize: 12 }}>·</span>
            <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}>© {new Date().getFullYear()} Agriyields Traceability Portal</span>
          </div>
          <a
            href="mailto:nkusu@agriyields.com"
            style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fonts.body, fontSize: 12, color: colors.muted, textDecoration: "none", transition: "color 0.2s" }}
            onMouseOver={e => e.currentTarget.style.color = colors.green}
            onMouseOut={e  => e.currentTarget.style.color = colors.muted}
          >
            <FaEnvelope style={{ fontSize: 11 }} /> nkusu@agriyields.com
          </a>
          <div className="footer-links">
            {["Privacy", "Terms", "Blog"].map(l => (
              <a key={l} href="#" style={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;