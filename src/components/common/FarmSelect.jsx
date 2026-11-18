import React, { useEffect, useId, useRef, useState } from "react";
import axiosInstance from "../../axiosInstance";

/**
 * FarmSelect — choix d'une ferme par recherche côté serveur.
 *
 * Remplace les <select> qui chargeaient toutes les fermes (/api/farm/all :
 * 50 000+ options pour l'admin). Recherche sur nom, farm_id, NIN, ID officiel
 * et sous-comté via /api/farm/?search=…, 20 résultats à la fois.
 *
 * Même signature qu'un <select> : onChange({ target: { name, value } }, farm)
 *   value = farm.id (le farm_id, ex. « CAWOFA0001 »), farm = objet complet
 *   (name, subcounty, geolocation, phonenumber1, district_id…) ou null si vidé.
 */
const PAGE = 20;
const cache = new Map();          // farm_id → farm, partagé entre instances

export const farmLabel = (f) =>
  f ? `${f.name || f.id}${f.subcounty ? ` — ${f.subcounty}` : ""}` : "";

const FarmSelect = ({
  value = "",
  onChange,
  name = "farm_id",
  placeholder = "Search a farm by name, ID or NIN…",
  className = "",
  inputClassName = "",
  required = false,
  disabled = false,
  id,
}) => {
  const autoId = useId();
  const inputId = id || `farm-select-${autoId}`;
  const listId = `${inputId}-list`;
  const boxRef = useRef(null);
  const reqRef = useRef(null);

  const [selected, setSelected] = useState(() => cache.get(value) || null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  // Libellé de la ferme déjà choisie (valeur venant du parent / de l'URL)
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected?.id === value) return;
    if (cache.has(value)) { setSelected(cache.get(value)); return; }
    let alive = true;
    axiosInstance.get(`/api/farm/${encodeURIComponent(value)}`)
      .then(({ data }) => {
        const f = data?.data || data;
        if (f?.id) cache.set(f.id, f);
        if (alive) setSelected(f?.id ? f : { id: value, name: value });
      })
      .catch(() => alive && setSelected({ id: value, name: value }));
    return () => { alive = false; };
  }, [value]); // eslint-disable-line

  // Recherche (debounce 250 ms, requête précédente annulée)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      reqRef.current?.abort();
      const ctrl = new AbortController();
      reqRef.current = ctrl;
      setLoading(true);
      try {
        const { data } = await axiosInstance.get("/api/farm/", {
          params: { search: query.trim(), page: 1, per_page: PAGE },
          signal: ctrl.signal,
        });
        const farms = data.farms || [];
        farms.forEach((f) => cache.set(f.id, f));
        setResults(farms);
        setTotal(data.total_farms ?? farms.length);
        setActive(farms.length ? 0 : -1);
      } catch (e) {
        if (e?.code !== "ERR_CANCELED") { setResults([]); setTotal(0); }
      } finally {
        if (reqRef.current === ctrl) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const emit = (farm) => {
    setSelected(farm);
    setOpen(false);
    setQuery("");
    onChange?.({ target: { name, value: farm?.id ?? "" } }, farm);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) { setOpen(true); e.preventDefault(); return; }
    if (e.key === "ArrowDown") { setActive((i) => Math.min(results.length - 1, i + 1)); e.preventDefault(); }
    else if (e.key === "ArrowUp") { setActive((i) => Math.max(0, i - 1)); e.preventDefault(); }
    else if (e.key === "Enter" && active >= 0 && results[active]) { emit(results[active]); e.preventDefault(); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const shown = open ? query : farmLabel(selected);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={shown}
          placeholder={selected && open ? farmLabel(selected) : placeholder}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
          // style en ligne : certains thèmes du site forcent une couleur claire sur les <input>
          style={{ color: "#111827", WebkitTextFillColor: "#111827" }}
          className={inputClassName || "w-full p-3 pr-16 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"}
        />
        {/* champ caché pour la validation HTML « required » des formulaires */}
        {required && (
          <input tabIndex={-1} aria-hidden="true" required value={value || ""} onChange={() => {}}
                 className="absolute inset-x-0 bottom-0 h-px opacity-0 pointer-events-none" />
        )}
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {loading && (
            <span className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-emerald-500 animate-spin" />
          )}
          {selected && !disabled && (
            <button type="button" aria-label="Clear farm" onClick={() => emit(null)}
                    className="px-1.5 text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
          )}
        </div>
      </div>

      {open && !disabled && (
        <ul id={listId} role="listbox"
            className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
          {results.map((f, i) => (
            <li key={f.id} role="option" aria-selected={f.id === value}
                onMouseDown={(e) => { e.preventDefault(); emit(f); }}
                onMouseEnter={() => setActive(i)}
                className={`px-3 py-2 cursor-pointer ${i === active ? "bg-emerald-50" : ""} ${f.id === value ? "font-semibold" : ""}`}>
              <div className="text-gray-900 truncate">{f.name || f.id}</div>
              <div className="text-xs text-gray-500 truncate">
                {f.id}{f.subcounty ? ` · ${f.subcounty}` : ""}{f.government_id ? ` · ${f.government_id}` : ""}
              </div>
            </li>
          ))}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-gray-500">No farm found</li>
          )}
          {total > results.length && (
            <li className="px-3 py-2 text-xs text-gray-400 border-t">
              {results.length} of {total.toLocaleString()} farms — type to narrow the search
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default FarmSelect;
