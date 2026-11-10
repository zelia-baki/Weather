// ── REGIONAL PRICES ───────────────────────────────────────────────────────────
// src/components/Ecommerce/PriceRegionManager.jsx — NOUVEAU
// Route : /priceregions   (menu E-commerce → Regional prices)
//
// Un coefficient par région : prix affiché = prix du produit × coefficient du
// pays de LIVRAISON. Exemple : café à 10 000 UGX/kg, Europe ×1.30 → 13 000.
// S'applique à la boutique et aux abonnements (pas aux enchères).
import React, { useCallback, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../axiosInstance';
import { loadRegions, countryName } from '../../utils/region';
import { Globe2, Loader2, Save } from 'lucide-react';

const inputCls = 'w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-800 outline-none focus:ring-2 focus:ring-emerald-400';

const EXAMPLE_BASE = 10000;   // pour l'aperçu « 10 000 UGX devient … »

const PriceRegionManager = () => {
  const [regions, setRegions] = useState([]);
  const [drafts, setDrafts] = useState({});      // id → valeur saisie
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [openId, setOpenId] = useState(null);    // région dont on voit les pays

  const load = useCallback(async (force = false) => {
    setLoading(true);
    const data = await loadRegions(force);
    setRegions(data.regions || []);
    setDrafts(Object.fromEntries((data.regions || []).map(r => [r.id, String(r.multiplier)])));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (region) => {
    const value = Number(drafts[region.id]);
    if (!value || value < 0.5 || value > 5) {
      Swal.fire({ icon: 'warning', title: 'Invalid coefficient',
        text: 'Use a number between 0.5 and 5 (1 = base price).' });
      return;
    }
    setSavingId(region.id);
    try {
      await axiosInstance.put(`/api/pricing/regions/${region.id}`, { multiplier: value });
      await load(true);
      Swal.fire({ icon: 'success', title: `${region.name} updated`, timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update failed', text: err.response?.data?.msg || '' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Globe2 size={22} className="text-emerald-600"/> Regional prices
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Customer price = product price × coefficient of the delivery country's region.
          1.00 = base price. Applies to the shop and subscriptions, not auctions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Region</th>
              <th className="text-left px-4 py-3">Countries</th>
              <th className="text-left px-4 py-3">Coefficient</th>
              <th className="text-left px-4 py-3">Example</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                <Loader2 size={18} className="animate-spin inline"/>
              </td></tr>
            ) : regions.map(r => {
              const draft = drafts[r.id] ?? '';
              const changed = Number(draft) !== Number(r.multiplier);
              const example = Math.round(EXAMPLE_BASE * (Number(draft) || 0));
              return (
                <tr key={r.id} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-md">
                    {r.countries ? (
                      <>
                        <button type="button" onClick={() => setOpenId(openId === r.id ? null : r.id)}
                          className="text-emerald-700 hover:underline">
                          {r.countries.length} countries {openId === r.id ? '▴' : '▾'}
                        </button>
                        {openId === r.id && (
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            {r.countries.map(countryName).join(', ')}
                          </p>
                        )}
                      </>
                    ) : <span className="text-xs">All other countries</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 mr-1">×</span>
                    <input type="number" step="0.05" min="0.5" max="5" value={draft}
                      onChange={e => setDrafts(d => ({ ...d, [r.id]: e.target.value }))}
                      className={inputCls}/>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    10,000 → <b className="text-gray-800">{example.toLocaleString('en-US')}</b> UGX
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" disabled={!changed || savingId === r.id} onClick={() => save(r)}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs px-3 py-2 rounded-xl font-semibold">
                      {savingId === r.id ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceRegionManager;