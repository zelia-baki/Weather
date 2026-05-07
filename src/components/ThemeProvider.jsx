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

    /* ──────────────────────────────────────────────────────────────────────
       FORM ELEMENTS — les inputs/selects héritent du thème sombre par défaut.
       On neutralise ce comportement dans les panels clairs (bg-white, .light-panel).
       Les composants sombres continuent à surcharger via leurs propres styles.
    ────────────────────────────────────────────────────────────────────── */

    /* Reset de base : les form elements n'héritent pas du background sombre */
    input, select, textarea, button {
      font-family: inherit;
    }

    /* Dans tout container blanc ou panel clair, forcer les couleurs claires */
    .bg-white input,
    .bg-white select,
    .bg-white textarea,
    .light-panel input,
    .light-panel select,
    .light-panel textarea {
      background-color: #ffffff !important;
      color: #111827 !important;
    }

    /* Placeholder lisible dans les panels clairs */
    .bg-white input::placeholder,
    .bg-white textarea::placeholder,
    .light-panel input::placeholder,
    .light-panel textarea::placeholder {
      color: #9ca3af !important;
    }

    /* Options dans les selects clairs */
    .bg-white select option,
    .light-panel select option {
      background-color: #ffffff;
      color: #111827;
    }

    /* Focus ring — ne pas laisser le thème sombre écraser les rings Tailwind */
    .bg-white input:focus,
    .bg-white select:focus,
    .bg-white textarea:focus,
    .light-panel input:focus,
    .light-panel select:focus,
    .light-panel textarea:focus {
      outline: none;
    }
  `}</style>
);

export default ThemeProvider;