import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiTrash2, FiLoader } from 'react-icons/fi';
import axiosInstance from '../../../axiosInstance';

// Forest inventory plots used to calibrate the Sentinel-2 index → biomass model
// of forests, replacing the generic NDVI model (backend:
// app/utils/forest_calibration_utils.py). Each plot: its area and the diameter
// and height of every measured tree; AGB per tree = Chave et al. 2014.

const INPUT_CLASSES =
  'w-full border border-gray-400 bg-white text-gray-900 placeholder-gray-400 rounded-lg p-2.5 text-sm ' +
  'focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-colors';
const LABEL_CLASSES = 'block text-xs font-medium text-gray-700 mb-1';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = { forest_id: '', measured_on: today(), plot_area_m2: '', wood_density: '', trees: '', notes: '' };
const fmt = (v, d = 3) => (v == null ? '—' : Number(v).toFixed(d));

// Same parsing as the backend (parse_trees): one tree per line, "D, H".
const parseTrees = (text) => {
  const trees = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.replace(/[;,\t]/g, ' ').split(/\s+/).filter(Boolean);
    const [d, h] = parts.map(Number);
    if (parts.length !== 2 || !(d > 0) || !(h > 0)) return { error: `Line ${i + 1}: enter the diameter and the height, e.g. "32.5, 18".` };
    trees.push([d, h]);
  }
  return { trees };
};

function StatusCard({ status, rules, genericFormula }) {
  const m = status?.model;
  const n = status?.n_plots ?? 0;
  const min = rules?.min_plots ?? 6;
  return (
    <div className={`rounded-xl border p-4 bg-white ${status?.active ? 'border-emerald-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-800">Forest model</h3>
        {status?.active ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            <FiCheckCircle aria-hidden="true" /> Calibrated
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
            <FiAlertCircle aria-hidden="true" /> Not active
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
        <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (n / min) * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500">{n} / {min} inventory plots</p>
      {m && (
        <p className="mt-2 text-xs text-gray-700 font-mono break-words">
          AGB = {m.a} + {m.b} × {m.index.toUpperCase()} · LOO R² {m.loo_r2} · RMSE {m.rmse_t_ha} t/ha
        </p>
      )}
      {!status?.active && status?.reason && <p className="mt-2 text-xs text-amber-700">{status.reason}</p>}
      <p className="mt-2 text-xs text-gray-500">
        {status?.active ? 'Used in every forest carbon report instead of' : 'Until then, reports use the generic model'}{' '}
        <span className="font-mono">{genericFormula}</span>.
      </p>
    </div>
  );
}

export default function ForestCalibration() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const load = async () => {
    try {
      const r = await axiosInstance.get('/api/sentinel/forest-calibration');
      setData(r.data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e.response?.data?.error || 'Could not load the calibration data.');
    }
  };

  useEffect(() => { load(); }, []);

  const parsed = useMemo(() => parseTrees(form.trees), [form.trees]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.forest_id) er.forest_id = 'Choose the forest where the plot was measured.';
    if (!form.measured_on) er.measured_on = 'Enter the measurement date.';
    if (!(Number(form.plot_area_m2) > 0)) er.plot_area_m2 = 'Enter the plot area in m².';
    if (form.wood_density !== '' && !(Number(form.wood_density) >= 0.1 && Number(form.wood_density) <= 1.5)) {
      er.wood_density = 'Enter a wood density between 0.1 and 1.5, or leave it empty.';
    }
    if (parsed.error) er.trees = parsed.error;
    else if (!parsed.trees.length) er.trees = 'Enter at least one measured tree.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const r = await axiosInstance.post('/api/sentinel/forest-calibration/plots', { ...form, trees: parsed.trees });
      setMessage({ type: 'success', text: `Plot saved: ${r.data.n_trees} trees, ${fmt(r.data.agb_t_ha, 2)} t/ha, NDVI ${fmt(r.data.ndvi)} (${r.data.index_date}).` });
      setForm((f) => ({ ...emptyForm, forest_id: f.forest_id, wood_density: f.wood_density }));
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'The plot could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await axiosInstance.delete(`/api/sentinel/forest-calibration/plots/${id}`);
      setPendingDelete(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'The plot could not be deleted.' });
    }
  };

  const field = (key, label, props = {}) => (
    <div>
      <label htmlFor={`fc-${key}`} className={LABEL_CLASSES}>{label}</label>
      <input id={`fc-${key}`} value={form[key]} onChange={set(key)} className={INPUT_CLASSES}
             aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `fc-${key}-err` : undefined} {...props} />
      {errors[key] && <p id={`fc-${key}-err`} className="mt-1 text-xs text-red-600">{errors[key]}</p>}
    </div>
  );

  const rules = data?.rules;
  const treeCount = parsed.trees?.length || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Forest Calibration</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">
          Inventory plots measured in the forests calibrate the satellite biomass model used in the forest carbon
          reports: the biomass of every measured tree (Chave et al. 2014, from diameter, height and wood density)
          divided by the plot area, against the Sentinel-2 indices of the forest within {rules?.window_days ?? 45} days
          of the measurement. The model is used once it has {rules?.min_plots ?? 6} plots and a cross-validated R² of at
          least {rules?.min_loo_r2 ?? 0.4}. Measure plots across sparse and dense parts of the forests so the indices vary.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{loadError}</p>
      )}

      {data && (
        <section aria-labelledby="fc-status" className="space-y-3">
          <h2 id="fc-status" className="text-lg font-semibold text-gray-800">Calibration status</h2>
          <div className="max-w-xl">
            <StatusCard status={data.status} rules={rules} genericFormula={data.generic_formula} />
          </div>
        </section>
      )}

      <section aria-labelledby="fc-add" className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 id="fc-add" className="text-lg font-semibold text-gray-800 mb-4">Add an inventory plot</h2>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="fc-forest_id" className={LABEL_CLASSES}>Forest *</label>
              <select id="fc-forest_id" value={form.forest_id} onChange={set('forest_id')} className={INPUT_CLASSES}
                      aria-invalid={!!errors.forest_id} aria-describedby={errors.forest_id ? 'fc-forest_id-err' : undefined}>
                <option value="">Choose a forest</option>
                {(data?.forests || []).map((f) => (
                  <option key={f.id} value={f.id}>{f.name}{f.tree_type ? ` (${f.tree_type})` : ''}</option>
                ))}
              </select>
              {errors.forest_id && <p id="fc-forest_id-err" className="mt-1 text-xs text-red-600">{errors.forest_id}</p>}
            </div>
            {field('measured_on', 'Measurement date *', { type: 'date', max: today() })}
            {field('plot_area_m2', 'Plot area (m²) *', { type: 'number', step: '1', min: '0', inputMode: 'decimal', placeholder: 'e.g. 400 for 20 × 20 m' })}
            {field('wood_density', `Wood density (g/cm³, optional, default ${rules?.default_wood_density ?? 0.58})`,
              { type: 'number', step: '0.01', min: '0', inputMode: 'decimal' })}
            <div className="md:col-span-2">{field('notes', 'Notes (optional)', { maxLength: 255 })}</div>
            <div className="md:col-span-3">
              <label htmlFor="fc-trees" className={LABEL_CLASSES}>Measured trees: diameter at breast height (cm), height (m), one tree per line *</label>
              <textarea id="fc-trees" rows={8} value={form.trees} onChange={set('trees')}
                        placeholder={'32.5, 18\n14, 11\n51, 24'} className={`${INPUT_CLASSES} font-mono`}
                        aria-invalid={!!errors.trees} aria-describedby={errors.trees ? 'fc-trees-err' : 'fc-trees-help'} />
              {errors.trees ? (
                <p id="fc-trees-err" className="mt-1 text-xs text-red-600">{errors.trees}</p>
              ) : (
                <p id="fc-trees-help" className="mt-1 text-xs text-gray-500">
                  {treeCount ? `${treeCount} tree${treeCount > 1 ? 's' : ''} entered. ` : ''}
                  Measure every tree in the plot. You can paste two columns from Excel.
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">The forest's GPS polygon is used for the satellite indices.</p>
          {message && (
            <p role={message.type === 'error' ? 'alert' : 'status'}
               className={`text-sm rounded-lg px-4 py-3 ${message.type === 'error'
                 ? 'text-red-700 bg-red-50 border border-red-200'
                 : 'text-emerald-800 bg-emerald-50 border border-emerald-200'}`}>
              {message.text}
            </p>
          )}
          <button type="submit" disabled={saving}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg text-sm font-semibold
                             text-white bg-teal-700 hover:bg-teal-800 disabled:bg-gray-400 transition-colors">
            {saving && <FiLoader className="animate-spin" aria-hidden="true" />}
            {saving ? 'Fetching Sentinel-2 indices…' : 'Save plot'}
          </button>
        </form>
      </section>

      {data && (
        <section aria-labelledby="fc-plots" className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <h2 id="fc-plots" className="text-lg font-semibold text-gray-800 p-4 sm:p-6 pb-0 sm:pb-0">
            Inventory plots ({data.plots.length})
          </h2>
          {data.plots.length === 0 ? (
            <p className="p-4 sm:p-6 text-sm text-gray-500">No plot measured yet.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    {['Date', 'Forest', 'Area (m²)', 'Trees', 'Mean D (cm)', 'Mean H (m)', 'ρ', 'AGB (t/ha)', 'NDVI', 'EVI', 'NDRE', ''].map((h) => (
                      <th key={h} scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.plots.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 whitespace-nowrap">{p.measured_on}</td>
                      <td className="px-3 py-2">{p.forest_name || `#${p.forest_id}`}</td>
                      <td className="px-3 py-2">{fmt(p.plot_area_m2, 0)}</td>
                      <td className="px-3 py-2">{p.n_trees}</td>
                      <td className="px-3 py-2">{fmt(p.mean_dbh_cm, 1)}</td>
                      <td className="px-3 py-2">{fmt(p.mean_height_m, 1)}</td>
                      <td className="px-3 py-2">{fmt(p.wood_density, 2)}</td>
                      <td className="px-3 py-2 font-semibold">{fmt(p.agb_t_ha, 2)}</td>
                      <td className="px-3 py-2">{fmt(p.ndvi)}</td>
                      <td className="px-3 py-2">{fmt(p.evi)}</td>
                      <td className="px-3 py-2">{fmt(p.ndre)}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {pendingDelete === p.id ? (
                          <span className="inline-flex gap-2">
                            <button onClick={() => remove(p.id)} className="min-h-[36px] px-3 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700">
                              Delete
                            </button>
                            <button onClick={() => setPendingDelete(null)} className="min-h-[36px] px-3 rounded-lg text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setPendingDelete(p.id)} aria-label={`Delete plot of ${p.measured_on}`}
                                  className="p-2.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50">
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
