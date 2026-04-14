import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link as ScrollLink } from "react-scroll";
import parrot from "../img/parrot.jpg";
import {
  FaGlobe, FaCloudSunRain, FaLeaf, FaTree, FaTractor, FaQrcode,
  FaChartLine, FaEnvelope, FaSatelliteDish, FaBrain, FaBars, FaTimes,
} from "react-icons/fa";

/* ─── FONTS ──────────────────────────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Epilogue:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #050c06;
      --bg2:       #081009;
      --surface:   rgba(255,255,255,0.04);
      --border:    rgba(255,255,255,0.07);
      --green:     #22c55e;
      --green-dim: rgba(34,197,94,0.15);
      --green-glow:rgba(34,197,94,0.35);
      --amber:     #d97706;
      --amber-dim: rgba(217,119,6,0.12);
      --text:      #e8f0e9;
      --muted:     rgba(232,240,233,0.45);
      --display:   'Cormorant Garamond', Georgia, serif;
      --body:      'Epilogue', sans-serif;
      --mono:      'Space Mono', monospace;
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--body);
      overflow-x: hidden;
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--green); border-radius: 2px; }

    /* ── SPLASH ── */
    .splash {
      position: fixed; inset: 0; z-index: 9999;
      background: #020602;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 32px;
    }
    .splash-radar {
      position: relative; width: 200px; height: 200px;
    }
    .splash-ring {
      position: absolute; inset: 0;
      border-radius: 50%;
      border: 1px solid rgba(34,197,94,0.3);
    }
    .splash-ring:nth-child(1) { inset: 0; }
    .splash-ring:nth-child(2) { inset: 20px; border-color: rgba(34,197,94,0.2); }
    .splash-ring:nth-child(3) { inset: 40px; border-color: rgba(34,197,94,0.15); }
    .splash-scan {
      position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
    }
    .splash-scan::before {
      content: '';
      position: absolute; top: 50%; left: 50%;
      width: 50%; height: 2px;
      background: linear-gradient(90deg, transparent, var(--green));
      transform-origin: left center;
      animation: radarSpin 1.8s linear infinite;
    }
    .splash-scan::after {
      content: '';
      position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from 0deg, rgba(34,197,94,0.15), transparent 40%, transparent);
      animation: radarSpin 1.8s linear infinite;
    }
    .splash-dot {
      position: absolute; border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 10px var(--green);
    }
    .splash-dot-1 { width: 6px; height: 6px; top: 30%; left: 60%; }
    .splash-dot-2 { width: 4px; height: 4px; top: 65%; left: 35%; opacity: 0.7; }
    .splash-dot-3 { width: 5px; height: 5px; top: 45%; left: 70%; opacity: 0.5; }
    .splash-cross {
      position: absolute; inset: 0;
    }
    .splash-cross::before, .splash-cross::after {
      content: '';
      position: absolute;
      background: rgba(34,197,94,0.2);
    }
    .splash-cross::before { width: 1px; height: 100%; left: 50%; top: 0; }
    .splash-cross::after  { height: 1px; width: 100%; top: 50%; left: 0; }

    .splash-logo-text {
      font-family: var(--mono);
      font-size: clamp(36px, 8vw, 64px);
      font-weight: 700;
      color: var(--green);
      letter-spacing: 0.25em;
      text-transform: uppercase;
    }
    .splash-sub {
      font-family: var(--body);
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.35em;
      text-transform: uppercase;
    }
    .splash-progress {
      width: 180px; height: 2px;
      background: rgba(34,197,94,0.15);
      border-radius: 2px;
      overflow: hidden;
    }
    .splash-progress-bar {
      height: 100%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      border-radius: 2px;
      animation: loadBar 2.2s ease-out forwards;
    }
    .splash-status {
      font-family: var(--mono);
      font-size: 10px;
      color: rgba(34,197,94,0.5);
      letter-spacing: 0.1em;
    }

    @keyframes radarSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes loadBar   { from { width: 0; } to { width: 100%; } }

    /* ── PARTICLES ── */
    .particle {
      position: absolute;
      width: 2px; height: 2px;
      background: var(--green);
      border-radius: 50%;
      opacity: 0;
      animation: floatUp var(--dur, 8s) var(--delay, 0s) infinite ease-in;
    }
    @keyframes floatUp {
      0%   { opacity: 0;   transform: translateY(0)   scale(0); }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.2; }
      100% { opacity: 0;   transform: translateY(-120px) scale(0.5); }
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
    @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    /* ── NAV ── */
    .nav-link {
      font-family: var(--body);
      font-size: 13px; font-weight: 500;
      letter-spacing: 0.08em;
      color: var(--muted);
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s;
      text-transform: uppercase;
    }
    .nav-link:hover { color: var(--text); }

    /* ── SECTION LABEL ── */
    .section-label {
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 16px;
    }

    /* ── FEATURE CARD ── */
    .feat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    .feat-card::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(34,197,94,0.06), transparent 60%);
      opacity: 0;
      transition: opacity 0.4s;
    }
    .feat-card:hover::before { opacity: 1; }
    .feat-card:hover {
      border-color: rgba(34,197,94,0.25);
      transform: translateY(-4px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(34,197,94,0.05);
    }

    /* ── ICON BADGE ── */
    .icon-badge {
      width: 52px; height: 52px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
      font-size: 20px;
    }

    /* ── CTA BTN ── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px;
      background: var(--green);
      color: #050c06;
      font-family: var(--body);
      font-size: 14px; font-weight: 700;
      border-radius: 100px;
      text-decoration: none;
      border: none; cursor: pointer;
      transition: all 0.25s;
      letter-spacing: 0.04em;
    }
    .btn-primary:hover {
      background: #4ade80;
      box-shadow: 0 0 30px rgba(34,197,94,0.4);
      transform: translateY(-2px);
    }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 13px 28px;
      background: transparent;
      color: var(--text);
      font-family: var(--body);
      font-size: 14px; font-weight: 500;
      border-radius: 100px;
      text-decoration: none;
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.25s;
      letter-spacing: 0.04em;
    }
    .btn-outline:hover {
      border-color: rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.05);
    }

    /* ── STAT ── */
    .stat-card {
      padding: 24px 32px;
      border-right: 1px solid var(--border);
    }
    .stat-card:last-child { border-right: none; }

    /* ── ORBIT ── */
    .orbit-container {
      position: relative; width: 380px; height: 380px;
    }
    .orbit-ring {
      position: absolute; border-radius: 50%;
      border: 1px dashed rgba(34,197,94,0.18);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }
    .orbit-planet {
      position: absolute;
      border-radius: 50%;
      background: var(--bg);
      border: 1px solid rgba(34,197,94,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      color: var(--green);
      box-shadow: 0 0 15px rgba(34,197,94,0.2);
    }
    .orbit-1 { width: 280px; height: 280px; animation: orbitSpin 14s linear infinite; }
    .orbit-2 { width: 340px; height: 340px; animation: orbitSpin 22s linear infinite reverse; }
    .orbit-3 { width: 380px; height: 380px; animation: orbitSpin 30s linear infinite; }
    .planet-1 { width: 34px; height: 34px; top: -17px; left: calc(50% - 17px); animation: counterSpin 14s linear infinite; }
    .planet-2 { width: 28px; height: 28px; top: -14px; left: calc(50% - 14px); animation: counterSpin 22s linear infinite reverse; }
    .planet-3 { width: 30px; height: 30px; top: -15px; left: calc(50% - 15px); animation: counterSpin 30s linear infinite; }
    @keyframes orbitSpin    { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(360deg);   } }
    @keyframes counterSpin  { from { transform: rotate(0deg);   } to { transform: rotate(-360deg);  } }

    /* ── GLOW BLOB ── */
    .glow-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
    }

    /* ── CONTACT ── */
    .contact-chip {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 12px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 100px;
      font-size: 13px; color: var(--muted);
      transition: all 0.25s;
      text-decoration: none;
    }
    .contact-chip:hover {
      border-color: rgba(34,197,94,0.3);
      color: var(--text);
      background: var(--green-dim);
    }

    /* Mobile menu */
    .mobile-menu {
      position: fixed; inset: 0;
      background: rgba(5,12,6,0.98);
      backdrop-filter: blur(20px);
      z-index: 400;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 40px;
    }
    .mobile-nav-link {
      font-family: var(--display);
      font-size: 36px; font-weight: 300;
      color: var(--text);
      text-decoration: none;
      letter-spacing: 0.05em;
      transition: color 0.2s;
    }
    .mobile-nav-link:hover { color: var(--green); }

    @media (max-width: 768px) {
      .orbit-container { width: 260px; height: 260px; }
      .orbit-1 { width: 180px; height: 180px; }
      .orbit-2 { width: 220px; height: 220px; }
      .orbit-3 { width: 256px; height: 256px; }
    }
  `}</style>
);

/* ─── SPLASH SCREEN ────────────────────────────────────────────────────────── */
const SplashScreen = ({ onDone }) => {
  const statuses = [
    "Connecting to satellite feed...",
    "Loading geospatial data...",
    "Initializing EUDR compliance...",
    "Ready.",
  ];
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const intervals = statuses.map((_, i) =>
      setTimeout(() => setStatusIdx(i), i * 600 + 200)
    );
    const done = setTimeout(onDone, 2800);
    return () => { intervals.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  return (
    <motion.div
      className="splash"
      exit={{ y: "-100%", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* Scanlines overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        pointerEvents: "none", opacity: 0.4,
      }} />

      {/* Radar */}
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

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: "center" }}
      >
        <div className="splash-logo-text">NKUSU</div>
        <div className="splash-sub" style={{ marginTop: 8 }}>Agriyields Traceability Portal</div>
      </motion.div>

      {/* Progress */}
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
            className="splash-status"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {statuses[statusIdx]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

/* ─── FLOATING PARTICLES ───────────────────────────────────────────────────── */
const Particles = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: `${Math.random() * 30}%`,
          "--dur": `${6 + Math.random() * 10}s`,
          "--delay": `${Math.random() * 8}s`,
          opacity: Math.random() * 0.6,
        }}
      />
    ))}
  </div>
);

/* ─── ORBIT VISUAL ─────────────────────────────────────────────────────────── */
const OrbitVisual = () => (
  <div className="orbit-container" style={{ flexShrink: 0 }}>
    {/* Core */}
    <div style={{
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      width: 80, height: 80, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(34,197,94,0.25), rgba(34,197,94,0.05))",
      border: "1px solid rgba(34,197,94,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 0 40px rgba(34,197,94,0.2)",
      zIndex: 10,
    }}>
      <img src={parrot} alt="Nkusu" style={{
        width: 56, height: 56, borderRadius: "50%", objectFit: "cover",
      }} />
    </div>

    {/* Orbit rings + planets */}
    <div className="orbit-ring orbit-1" style={{ position: "absolute" }}>
      <div className="orbit-planet planet-1"><FaTree /></div>
    </div>
    <div className="orbit-ring orbit-2" style={{ position: "absolute" }}>
      <div className="orbit-planet planet-2"><FaQrcode /></div>
    </div>
    <div className="orbit-ring orbit-3" style={{ position: "absolute" }}>
      <div className="orbit-planet planet-3"><FaSatelliteDish /></div>
    </div>

    {/* Corner labels */}
    {[
      { label: "Forest", x: "85%", y: "8%" },
      { label: "Farm", x: "5%", y: "45%" },
      { label: "EUDR", x: "78%", y: "82%" },
    ].map(({ label, x, y }) => (
      <div key={label} style={{
        position: "absolute", left: x, top: y,
        fontFamily: "var(--mono)", fontSize: 9,
        color: "rgba(34,197,94,0.6)", letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        {label}
      </div>
    ))}
  </div>
);

/* ─── MAIN COMPONENT ───────────────────────────────────────────────────────── */
const LandingPage = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const features = [
    {
      Icon: FaTree,
      label: "Forest",
      title: "Forest Management",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
      desc: "Real-time data insights for biodiversity and forestry conservation, anti-deforestation, afforestation & reforestation with satellite precision.",
    },
    {
      Icon: FaQrcode,
      label: "Trace",
      title: "Digital Trace ID",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.1)",
      desc: "Track produce and inventory, trace supply chains from farm to fork by generating secure digital certificates & stamps.",
    },
    {
      Icon: FaTractor,
      label: "Farm",
      title: "Farm Management",
      color: "#d97706",
      bg: "rgba(217,119,6,0.1)",
      desc: "Manage and monitor farm operations with actionable geospatial data insights and AI-driven crop performance analytics.",
    },
    {
      Icon: FaLeaf,
      label: "EUDR",
      title: "EUDR Compliance",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.1)",
      desc: "Leverage advanced geospatial analytics and machine learning for environmental risk assessments and EUDR compliance verification.",
    },
    {
      Icon: FaCloudSunRain,
      label: "Climate",
      title: "Climate Intelligence",
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.1)",
      desc: "Gain insights into how changing weather and climate patterns affect your business through area-based risk assessments.",
    },
    {
      Icon: FaChartLine,
      label: "Carbon",
      title: "Carbon Offset",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.1)",
      desc: "Contribute to climate sustainability and the Net Zero agenda by managing and tracking carbon and GHG emissions precisely.",
    },
  ];

  const stats = [
    { val: "50M+", label: "Hectares Monitored" },
    { val: "120+", label: "Countries Covered" },
    { val: "99.2%", label: "EUDR Accuracy" },
    { val: "< 3s",  label: "Satellite Refresh" },
  ];

  const ticker = [
    "🌍 Forest Risk Assessment",
    "📡 Live Satellite Feed",
    "🌿 Carbon Sequestration",
    "🔗 Supply Chain Traceability",
    "📊 EUDR Compliance",
    "🌱 Biodiversity Monitoring",
    "🗺️ Geospatial Intelligence",
    "⚡ Real-Time Analytics",
  ];

  return (
    <>
      <FontLoader />

      {/* SPLASH */}
      <AnimatePresence>
        {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      </AnimatePresence>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setMenuOpen(false)}
              style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "var(--muted)", fontSize: 22, cursor: "pointer" }}
            >
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
            <motion.a
              href="/login"
              className="btn-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
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
          padding: "0 40px", height: 68,
          background: "rgba(5,12,6,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            overflow: "hidden", border: "1px solid rgba(34,197,94,0.35)",
            boxShadow: "0 0 12px rgba(34,197,94,0.2)",
          }}>
            <img src={parrot} alt="Nkusu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, letterSpacing: "0.15em", color: "var(--text)" }}>
            NKUSU
          </span>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 36, alignItems: "center" }} className="hidden md:flex">
          {[
            { label: "Features", to: "features", scroll: true },
            { label: "About", href: "/sectionfutur" },
            { label: "Tools", href: "/EUDRSubmissionForGuest" },
            { label: "Contact", to: "contact", scroll: true },
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

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/login" className="btn-outline hidden md:inline-flex" style={{ padding: "9px 20px", fontSize: 13 }}>
            Sign In
          </a>
          <a href="/login" className="btn-primary hidden md:inline-flex" style={{ padding: "9px 20px", fontSize: 13 }}>
            Get Started
          </a>
          <button
            onClick={() => setMenuOpen(true)}
            style={{ background: "none", border: "none", color: "var(--text)", fontSize: 20, cursor: "pointer" }}
            className="md:hidden"
          >
            <FaBars />
          </button>
        </div>
      </motion.header>

      {/* HERO */}
      <section
        ref={heroRef}
        style={{
          position: "relative", minHeight: "100vh",
          display: "flex", alignItems: "center",
          padding: "80px 40px 60px",
          overflow: "hidden",
        }}
      >
        {/* Grid bg */}
        <motion.div
          className="hero-grid-bg"
          style={{ position: "absolute", inset: 0, y: heroY }}
        />

        {/* Glow blobs */}
        <div className="glow-blob" style={{ width: 500, height: 500, background: "rgba(34,197,94,0.07)", top: "-10%", right: "10%" }} />
        <div className="glow-blob" style={{ width: 400, height: 400, background: "rgba(217,119,6,0.05)", bottom: "0%", left: "5%" }} />

        <Particles />

        {/* Content */}
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 60, justifyContent: "space-between", flexWrap: "wrap" }}>
          {/* Left */}
          <div style={{ flex: "1 1 480px", maxWidth: 600 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={splashDone ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 14px",
                background: "var(--green-dim)",
                border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 100,
                marginBottom: 24,
              }}>
                <span style={{ width: 6, height: 6, background: "var(--green)", borderRadius: "50%", boxShadow: "0 0 6px var(--green)", display: "inline-block" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--green)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  Live Satellite Data
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: "var(--display)",
                fontSize: "clamp(44px, 6vw, 80px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                color: "var(--text)",
                marginBottom: 28,
              }}>
                Precision Agriculture{" "}
                <em style={{ color: "var(--green)", fontStyle: "italic" }}>Intelligence</em>{" "}
                from Space
              </h1>

              <p style={{
                fontFamily: "var(--body)",
                fontSize: 16, lineHeight: 1.75,
                color: "var(--muted)",
                maxWidth: 480,
                marginBottom: 40,
              }}>
                Data-driven monitoring and insights for your area of interest using next-generation satellite imagery, geospatial AI, and real-time traceability.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
                <a href="/login" className="btn-primary">
                  Start Free Trial →
                </a>
                <a href="/EUDRSubmissionForGuest" className="btn-outline">
                  EUDR Tools
                </a>
              </div>

              {/* Social proof */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)",
              }}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#d97706" }}>★</span>
                ))}
                <span>Trusted by 2,000+ agronomists worldwide</span>
              </div>
            </motion.div>
          </div>

          {/* Right — Orbit visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={splashDone ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: "1 1 300px", display: "flex", justifyContent: "center" }}
          >
            <OrbitVisual />
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            style={{ width: 1, height: 28, background: "linear-gradient(to bottom, var(--green), transparent)" }}
          />
        </div>
      </section>

      {/* TICKER */}
      <div style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "14px 0",
        background: "rgba(34,197,94,0.03)",
      }}>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...ticker, ...ticker].map((item, i) => (
              <span key={i} style={{
                fontFamily: "var(--mono)", fontSize: 11,
                color: "rgba(34,197,94,0.55)", letterSpacing: "0.1em",
                whiteSpace: "nowrap",
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <section style={{
        borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "center", flexWrap: "wrap",
      }}>
        {stats.map(({ val, label }, i) => (
          <motion.div
            key={i}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{ flex: "1 1 160px", textAlign: "center" }}
          >
            <div style={{
              fontFamily: "var(--display)", fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 600, color: "var(--text)",
              lineHeight: 1.1, marginBottom: 6,
            }}>
              {val}
            </div>
            <div style={{ fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.05em" }}>
              {label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* FEATURES */}
      <section
        id="features"
        style={{ padding: "120px 40px", maxWidth: 1240, margin: "0 auto" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: 64 }}
        >
          <div className="section-label">Platform Features</div>
          <h2 style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(36px, 5vw, 62px)",
            fontWeight: 300, lineHeight: 1.1,
            color: "var(--text)", maxWidth: 520,
          }}>
            Everything you need to{" "}
            <em style={{ color: "var(--green)", fontStyle: "italic" }}>scale sustainably</em>
          </h2>
        </motion.div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {features.map(({ Icon, label, title, color, bg, desc }, i) => (
            <motion.div
              key={i}
              className="feat-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.07 }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
                const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
                e.currentTarget.style.setProperty("--mx", `${x}%`);
                e.currentTarget.style.setProperty("--my", `${y}%`);
              }}
            >
              {/* Number */}
              <span style={{
                position: "absolute", top: 24, right: 24,
                fontFamily: "var(--mono)", fontSize: 11,
                color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em",
              }}>
                0{i + 1}
              </span>

              <div className="icon-badge" style={{ background: bg, color }}>
                <Icon />
              </div>

              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8 }}>
                {label}
              </div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>
                {title}
              </h3>
              <p style={{ fontFamily: "var(--body)", fontSize: 14, lineHeight: 1.7, color: "var(--muted)" }}>
                {desc}
              </p>

              {/* Arrow */}
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, color, fontSize: 12, fontFamily: "var(--mono)", letterSpacing: "0.05em" }}>
                Learn more <span style={{ fontSize: 16 }}>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EUDR HIGHLIGHT */}
      <section style={{
        margin: "0 40px 120px",
        borderRadius: 24,
        background: "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(96,165,250,0.04))",
        border: "1px solid rgba(34,197,94,0.12)",
        padding: "80px 60px",
        display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap",
        position: "relative", overflow: "hidden",
      }}>
        <div className="glow-blob" style={{ width: 300, height: 300, background: "rgba(34,197,94,0.08)", top: "-50%", right: "10%", filter: "blur(60px)" }} />

        <div style={{ flex: "1 1 400px" }}>
          <div className="section-label">New Feature</div>
          <h2 style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 300, lineHeight: 1.15,
            color: "var(--text)", marginBottom: 20,
          }}>
            EUDR Compliance{" "}
            <em style={{ color: "var(--green)", fontStyle: "italic" }}>made simple</em>
          </h2>
          <p style={{ fontFamily: "var(--body)", fontSize: 15, lineHeight: 1.75, color: "var(--muted)", maxWidth: 480, marginBottom: 32 }}>
            Upload your GeoJSON, get instant risk assessments and generate certified Due Diligence Statements. Compliant with EU Regulation 2023/1115.
          </p>
          <a href="/EUDRSubmissionForGuest" className="btn-primary">
            Try EUDR Tools Free →
          </a>
        </div>

        <div style={{
          flex: "1 1 280px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        }}>
          {[
            { icon: "🛰️", label: "Satellite Verified" },
            { icon: "⚡", label: "Instant Results" },
            { icon: "📄", label: "Auto-Generated Docs" },
            { icon: "🔒", label: "EU Certified" },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              padding: "16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        style={{
          padding: "120px 40px",
          textAlign: "center",
          background: "linear-gradient(180deg, transparent, rgba(34,197,94,0.03), transparent)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-label" style={{ textAlign: "center", marginBottom: 16 }}>Get In Touch</div>
          <h2 style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(40px, 6vw, 80px)",
            fontWeight: 300, lineHeight: 1.05,
            color: "var(--text)", marginBottom: 20,
          }}>
            Join the big data{" "}
            <em style={{ color: "var(--green)", fontStyle: "italic" }}>revolution</em>
          </h2>
          <p style={{
            fontFamily: "var(--body)", fontSize: 16, color: "var(--muted)",
            maxWidth: 480, margin: "0 auto 48px",
          }}>
            Explore and transform the way you do business with next-generation satellite intelligence.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/contactus" className="contact-chip">
              <FaEnvelope style={{ color: "var(--green)" }} />
              <span>Email Us</span>
            </a>
            <a href="/signup" className="contact-chip">
              <span>✦</span>
              <span>Create Account</span>
            </a>
            <a href="/EUDRSubmissionForGuest" className="contact-chip">
              <FaGlobe style={{ color: "var(--green)" }} />
              <span>Free Tools</span>
            </a>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "40px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", color: "var(--muted)" }}>
            NKUSU
          </span>
          <span style={{ color: "var(--border)", fontSize: 12 }}>·</span>
          <span style={{ fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)" }}>
            © {new Date().getFullYear()} Agriyields Traceability Portal
          </span>
        </div>

        <a href="mailto:nkusu@agriyields.com" style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)",
          textDecoration: "none", transition: "color 0.2s",
        }}
          onMouseOver={e => e.currentTarget.style.color = "var(--green)"}
          onMouseOut={e => e.currentTarget.style.color = "var(--muted)"}
        >
          <FaEnvelope style={{ fontSize: 11 }} />
          nkusu@agriyields.com
        </a>

        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Blog"].map(l => (
            <a key={l} href="#" style={{ fontFamily: "var(--body)", fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </>
  );
};

export default LandingPage;