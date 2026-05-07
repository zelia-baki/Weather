// src/components/ThemeProvider.jsx
import { cssVars, googleFontsUrl } from "../theme";

const ThemeProvider = () => (
  <style>{`
    @import url('${googleFontsUrl}');
    ${cssVars}
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
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

    /* ── Buttons hover (global) ── */
    .btn-primary:hover {
      background: #4ade80 !important;
      box-shadow: 0 0 30px rgba(34,197,94,0.4) !important;
      transform: translateY(-2px) !important;
    }
    .btn-outline:hover {
      border-color: rgba(255,255,255,0.25) !important;
      background: rgba(255,255,255,0.05) !important;
    }

    /* ══════════════════════════════════════════════════════════
       .light-panel — à placer sur le div racine de chaque page
       ou composant clair. Fixe texte + inputs sans toucher
       aux composants sombres du reste de l'app.
    ══════════════════════════════════════════════════════════ */

    /* Texte général */
    .light-panel { color: #111827; }

    /* Inputs / selects / textareas */
    .light-panel input,
    .light-panel select,
    .light-panel textarea {
      background-color: #ffffff !important;
      color: #111827 !important;
    }

    /* Placeholders */
    .light-panel input::placeholder,
    .light-panel textarea::placeholder {
      color: #9ca3af !important;
    }

    /* Options dans les selects */
    .light-panel select option {
      background-color: #ffffff;
      color: #111827;
    }

    /* Focus rings Tailwind non écrasés */
    .light-panel input:focus,
    .light-panel select:focus,
    .light-panel textarea:focus {
      outline: none;
    }
  `}</style>
);

export default ThemeProvider;