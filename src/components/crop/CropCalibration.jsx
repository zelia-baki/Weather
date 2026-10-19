import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiTrash2, FiLoader } from 'react-icons/fi';
import axiosInstance from '../../axiosInstance';

// Field plots used to calibrate the Sentinel-2 index → biomass model of each
// perennial crop (backend: app/utils/crop_calibration_utils.py). Each crop
// option lists the measurements its allometric equation needs; rho = the
// equation (Chave 2014) takes a wood density.
const CROPS = [
  { name: 'Coffee Robusta',           needs: ['dbh'],           dbhLabel: 'Mean stem diameter (cm)' },
  { name: 'Coffee Arabica',           needs: ['dbh', 'height'], dbhLabel: 'Mean diameter 15 cm above ground (cm)' },
  { name: 'Coffee Liberica',          needs: ['dbh'],           dbhLabel: 'Mean stem diameter (cm)' },
  { name: 'Coffee (variety unknown)', needs: ['dbh', 'height'], rho: true, dbhLabel: 'Mean stem diameter (cm)' },
  { name: 'Cocoa',                    needs: ['dbh'],           dbhLabel: 'Mean diameter at breast height (cm)' },
  { name: 'Hass Avocado',             needs: ['dbh', 'height'], rho: true, dbhLabel: 'Mean diameter at breast height (cm)' },
  { name: 'Oil Palm',                 needs: ['height'],        heightLabel: 'Mean trunk height (m)' },
  { name: 'Rubber',                   needs: ['dbh', 'height'], rho: true, dbhLabel: 'Mean diameter at breast height (cm)' },
  { name: 'Macadamia',                needs: ['dbh', 'height'], rho: true, dbhLabel: 'Mean diameter at breast height (cm)' },
];

const INPUT_CLASSES =
  'w-full border border-gray-400 bg-white text-gray-900 placeholder-gray-400 rounded-lg p-2.5 text-sm ' +
  'focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-colors';
const LABEL_CLASSES = 'block text-xs font-medium text-gray-700 mb-1';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = {
  farm_id: '', crop: CROPS[0].name, measured_on: today(),
  mean_dbh_cm: '', mean_height_m: '', plants_per_ha: '', wood_density: '', notes: '',
};
const fmt = (v, d = 3) => (v == null ? '—' : Number(v).toFixed(d));

function FamilyCard({ f }) {
  const m = f.model;
  return (
    <div className={`rounded-xl border p-4 bg-white ${f.active ? 'border-emerald-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-800">{f.label}</h3>
        {f.active ? (
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
        <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, (f.n_plots / f.min_plots) * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-500">{f.n_plots} / {f.min_plots} field plots</p>
      {m ? (
        <p className="mt-2 text-xs text-gray-700 font-mono break-words">
          AGB = {m.a} + {m.b} × {m.index.toUpperCase()} · LOO R² {m.loo_r2} · RMSE {m.rmse_t_ha} t/ha
        </p>
      ) : null}
      {!f.active && f.reason && <p className="mt-2 text-xs text-amber-700">{f.reason}</p>}
    </div>
  );
}

export default function CropCalibration() {
  const [data, setData] = useState(null);
  const [farms, setFarms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const crop = useMemo(() => CROPS.find((c) => c.name === form.crop) || CROPS[0], [form.crop]);

  const load = async () => {
    try {
      const r = await axiosInstance.get('/api/sentinel/crop-calibration');
      setData(r.data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e.response?.data?.error || 'Could not load the calibration data.');
    }
  };

  useEffect(() => {
    load();
    axiosInstance.get('/api/farm/all').then((r) => setFarms(r.data.farms || [])).catch(() => {});
  }, []);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.farm_id.trim()) er.farm_id = 'Choose the farm where the plot was measured.';
    if (!form.measured_on) er.measured_on = 'Enter the measurement date.';
    if (crop.needs.includes('dbh') && !(Number(form.mean_dbh_cm) > 0)) er.mean_dbh_cm = 'Enter a diameter above 0.';
    if (crop.needs.includes('height') && !(Number(form.mean_height_m) > 0)) er.mean_height_m = 'Enter a height above 0.';
    if (!(Number(form.plants_per_ha) > 0)) er.plants_per_ha = 'Enter the number of plants per hectare.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;
    setSaving(true);
    try {
      const body = { ...form };
      if (!crop.needs.includes('dbh')) body.mean_dbh_cm = '';
      if (!crop.needs.includes('height')) body.mean_height_m = '';
      const r = await axiosInstance.post('/api/sentinel/crop-calibration/plots', body);
      setMessage({ type: 'success', text: `Plot saved: ${fmt(r.data.agb_t_ha, 2)} t/ha, NDVI ${fmt(r.data.ndvi)} (${r.data.index_date}).` });
      setForm((f) => ({ ...emptyForm, farm_id: f.farm_id, crop: f.crop }));
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'The plot could not be saved.' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await axiosInstance.delete(`/api/sentinel/crop-calibration/plots/${id}`);
      setPendingDelete(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'The plot could not be deleted.' });
    }
  };

  const field = (key, label, props = {}) => (
    <div>
      <label htmlFor={`cc-${key}`} className={LABEL_CLASSES}>{label}</label>
      <input id={`cc-${key}`} value={form[key]} onChange={set(key)} className={INPUT_CLASSES}
             aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `cc-${key}-err` : undefined} {...props} />
      {errors[key] && <p id={`cc-${key}-err`} className="mt-1 text-xs text-red-600">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Crop Calibration</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl">
          Field plots measured on Nkusu farms calibrate the satellite biomass model of each perennial crop:
          biomass from the crop's allometric equation × planting density, against the Sentinel-2 indices of
          the farm within {data?.rules?.window_days ?? 45} days of the measurement. A crop's model is used in the
          carbon reports once it has {data?.rules?.min_plots ?? 6} plots and a cross-validated R² of at
          least {data?.rules?.min_loo_r2 ?? 0.4}.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{loadError}</p>
      )}

      {data && (
        <section aria-labelledby="cc-status" className="space-y-3">
          <h2 id="cc-status" className="text-lg font-semibold text-gray-800">Calibration status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.families.map((f) => <FamilyCard key={f.family} f={f} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="cc-add" className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h2 id="cc-add" className="text-lg font-semibold text-gray-800 mb-4">Add a measured plot</h2>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cc-farm_id" className={LABEL_CLASSES}>Farm *</label>
              <input id="cc-farm_id" list="cc-farms" value={form.farm_id} onChange={set('farm_id')}
                     placeholder="Farm ID" className={INPUT_CLASSES} aria-invalid={!!errors.farm_id}
                     aria-describedby={errors.farm_id ? 'cc-farm_id-err' : undefined} />
              <datalist id="cc-farms">
                {farms.map((f) => <option key={f.farm_id} value={f.farm_id}>{f.name}</option>)}
              </datalist>
              {errors.farm_id && <p id="cc-farm_id-err" className="mt-1 text-xs text-red-600">{errors.farm_id}</p>}
            </div>
            <div>
              <label htmlFor="cc-crop" className={LABEL_CLASSES}>Crop *</label>
              <select id="cc-crop" value={form.crop} onChange={set('crop')} className={INPUT_CLASSES}>
                {CROPS.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            {field('measured_on', 'Measurement date *', { type: 'date', max: today() })}
            {crop.needs.includes('dbh') &&
              field('mean_dbh_cm', `${crop.dbhLabel} *`, { type: 'number', step: '0.1', min: '0', inputMode: 'decimal' })}
            {crop.needs.includes('height') &&
              field('mean_height_m', `${crop.heightLabel || 'Mean height (m)'} *`, { type: 'number', step: '0.1', min: '0', inputMode: 'decimal' })}
            {field('plants_per_ha', 'Plants per hectare *', { type: 'number', step: '1', min: '0', inputMode: 'numeric' })}
            {crop.rho &&
              field('wood_density', 'Wood density (g/cm³, optional)', { type: 'number', step: '0.01', min: '0', inputMode: 'decimal' })}
            <div className="md:col-span-2">{field('notes', 'Notes (optional)', { maxLength: 255 })}</div>
          </div>
          <p className="text-xs text-gray-500">
            Measure a representative sample of plants and enter their mean values. The farm's GPS polygon is used for the satellite indices.
          </p>
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
        <section aria-labelledby="cc-plots" className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <h2 id="cc-plots" className="text-lg font-semibold text-gray-800 p-4 sm:p-6 pb-0 sm:pb-0">
            Measured plots ({data.plots.length})
          </h2>
          {data.plots.length === 0 ? (
            <p className="p-4 sm:p-6 text-sm text-gray-500">No plot measured yet.</p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                  <tr>
                    {['Date', 'Farm', 'Crop', 'D (cm)', 'H (m)', 'Plants/ha', 'AGB (t/ha)', 'NDVI', 'EVI', 'NDRE', ''].map((h) => (
                      <th key={h} scope="col" className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.plots.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 whitespace-nowrap">{p.measured_on}</td>
                      <td className="px-3 py-2">{p.farm_id}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.crop_name}</td>
                      <td className="px-3 py-2">{fmt(p.mean_dbh_cm, 1)}</td>
                      <td className="px-3 py-2">{fmt(p.mean_height_m, 1)}</td>
                      <td className="px-3 py-2">{fmt(p.plants_per_ha, 0)}</td>
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
