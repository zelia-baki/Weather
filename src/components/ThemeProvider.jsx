// src/components/ThemeProvider.jsx
// Injecte les variables CSS globales + reset + fonts. À placer UNE seule fois dans App.jsx.

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
  `}</style>
);

export default ThemeProvider;