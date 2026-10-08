// ── WAREHOUSE RECEPTION ───────────────────────────────────────────────────────
// Four steps: warehouse & depositor · commodity & weight · quality · farms & price.
// The grade is computed live from the measurements, so the operator sees the
// result before issuing anything. A rejected delivery never produces a receipt.
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  Warehouse, Package, FlaskConical, Users, Check, X, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, Printer, Plus, Trash2, CheckCircle2, XCircle, FileText,
} from 'lucide-react';

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-amber-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const DEPOSITOR_TYPES = [
  { value: 'farmer',      label: 'Farmer' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'sacco',       label: 'SACCO' },
  { value: 'aggregator',  label: 'Aggregator' },
  { value: 'trader',      label: 'Trader' },
  { value: 'other',       label: 'Other' },
];

const STEPS = [
  { id: 0, label: 'Warehouse', Icon: Warehouse },
  { id: 1, label: 'Commodity', Icon: Package },
  { id: 2, label: 'Quality',   Icon: FlaskConical },
  { id: 3, label: 'Farms & price', Icon: Users },
];

const EMPTY = {
  store_id: '', depositor_type: 'cooperative', depositor_name: '', depositor_code: '',
  crop_id: '', variety_id: '', gross_weight_kg: '', net_weight_kg: '',
  price_per_kg: '', currency: 'UGX', note: '',
};

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 3 });

// =============================================================================
//  Printable receipt — what the depositor, the buyer and the bank actually read
// =============================================================================
export const PrintableReceipt = ({ receipt, onClose }) => {
  const verifyUrl = `${window.location.origin}/verify/${receipt.serial}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=0&data=${encodeURIComponent(verifyUrl)}`;

  const Row = ({ label, value, strong }) => (
    <div className="flex justify-between gap-6 py-2 border-b border-dashed border-gray-200">
      <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
      <span className={`text-sm text-right ${strong ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{value ?? '—'}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4 print:p-0 print:bg-white print:static">
      <div className="max-w-3xl mx-auto my-6 print:my-0">
        {/* Toolbar — hidden when printing */}
        <div className="flex justify-end gap-2 mb-3 print:hidden">
          <button onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-xl font-medium">
            <Printer size={15}/> Print
          </button>
          <button onClick={onClose}
            className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-200 text-sm px-4 py-2 rounded-xl font-medium">
            <X size={15}/> Close
          </button>
        </div>

        <div id="printable-receipt" className="bg-white rounded-2xl shadow-xl p-10 print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-8 pb-6 border-b-2 border-gray-900">
            <div>
              <img src="https://www.nkusu.com/parrotlogo.png" alt="" className="w-12 h-12 mb-3"/>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">WAREHOUSE RECEIPT</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                Negotiable · Issued by a certified warehouse
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-gray-500">Serial number</p>
              <p className="text-2xl font-mono font-bold text-gray-900">{receipt.serial}</p>
              <p className="text-xs text-gray-500 mt-1">
                {receipt.received_at ? new Date(receipt.received_at).toLocaleString('en-GB') : ''}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0 pt-6">
            <div>
              <h2 className="text-[11px] uppercase tracking-widest text-amber-700 font-bold mb-2">Warehouse</h2>
              <Row label="Name" value={receipt.warehouse_name} strong/>
              <Row label="Code" value={receipt.warehouse_code}/>
              <Row label="Country" value={receipt.country}/>

              <h2 className="text-[11px] uppercase tracking-widest text-amber-700 font-bold mt-6 mb-2">Depositor</h2>
              <Row label="Name" value={receipt.depositor_name} strong/>
              <Row label="Type" value={receipt.depositor_type}/>
              <Row label="Reference" value={receipt.depositor_code}/>
            </div>

            <div>
              <h2 className="text-[11px] uppercase tracking-widest text-amber-700 font-bold mb-2">Goods held</h2>
              <Row label="Commodity" value={receipt.commodity} strong/>
              <Row label="Variety" value={receipt.variety}/>
              <Row label="Grade" value={receipt.grade} strong/>
              <Row label="Gross weight" value={`${fmt(receipt.gross_weight_kg, 0)} kg`}/>
              <Row label="Net weight" value={`${fmt(receipt.net_weight_kg, 0)} kg`} strong/>
              {receipt.price_per_kg != null && (
                <>
                  <Row label="Price per kg" value={`${fmt(receipt.price_per_kg)} ${receipt.currency}`}/>
                  <Row label="Declared value" value={`${fmt(receipt.total_value)} ${receipt.currency}`} strong/>
                </>
              )}
            </div>
          </div>

          {/* Quality */}
          {receipt.measurements?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-[11px] uppercase tracking-widest text-amber-700 font-bold mb-2">Quality at reception</h2>
              <table className="w-full text-sm">
                <tbody>
                  {receipt.measurements.map(m => (
                    <tr key={m.id} className="border-b border-dashed border-gray-200">
                      <td className="py-2 text-gray-600">{m.name}</td>
                      <td className="py-2 text-right font-mono text-gray-900">
                        {m.value} {m.unit || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Farms */}
          {receipt.farms?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-[11px] uppercase tracking-widest text-amber-700 font-bold mb-2">
                Contributing farms ({receipt.farms.length})
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-300">
                    <th className="text-left py-1.5">Farm ID</th>
                    <th className="text-left py-1.5">Name</th>
                    <th className="text-right py-1.5">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.farms.map(f => (
                    <tr key={f.id} className="border-b border-dashed border-gray-200">
                      <td className="py-2 font-mono text-gray-900">{f.farm_id || '—'}</td>
                      <td className="py-2 text-gray-600">{f.farm_name || '—'}</td>
                      <td className="py-2 text-right font-mono">{fmt(f.weight_kg, 0)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* QR + signatures */}
          <div className="mt-10 pt-6 border-t-2 border-gray-900 flex items-start justify-between gap-8 flex-wrap">
            <div className="flex items-start gap-5">
              <img src={qrSrc} alt="Verification QR code" className="w-32 h-32"/>
              <div className="max-w-xs">
                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1">Verify this receipt</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Scan the code, or open the address below, to confirm that this receipt
                  is genuine and that the goods are still held.
                </p>
                <p className="text-[10px] font-mono text-gray-500 mt-2 break-all">{verifyUrl}</p>
              </div>
            </div>

            <div className="flex gap-10 text-center">
              {['Warehouse officer', 'Depositor'].map(role => (
                <div key={role}>
                  <div className="w-40 border-b border-gray-400 h-14"/>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{role}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-8 leading-relaxed">
            This receipt certifies that the goods described above were received and are held at the
            warehouse named, on behalf of the depositor. It may be presented as evidence of ownership.
            Any release is recorded against this serial number and reflected on the verification page.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-receipt, #printable-receipt * { visibility: visible !important; }
          #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 14mm; }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
const ReceiptReception = () => {
  const [step,        setStep]        = useState(0);
  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [warehouses,  setWarehouses]  = useState([]);
  const [crops,       setCrops]       = useState([]);
  const [varieties,   setVarieties]   = useState([]);
  const [parameters,  setParameters]  = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [grading,     setGrading]     = useState(null);
  const [grading_busy, setGradingBusy] = useState(false);
  const [farms,       setFarms]       = useState([]);         // catalogue
  const [farmLines,   setFarmLines]   = useState([]);         // what was delivered
  const [stock,       setStock]       = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [issued,      setIssued]      = useState(null);
  const [globalError, setGlobalError] = useState('');
  const gradeTimer = useRef(null);

  // ── Reference data ──────────────────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get('/api/store/', { params: { store_type: 'warehouse', per_page: 100 } })
      .then(r => setWarehouses((r.data.stores ?? []).filter(s => s.is_certified && s.status !== false)))
      .catch(() => setGlobalError('Could not load warehouses.'));
    axiosInstance.get('/api/crop/').then(r => setCrops(r.data.crops ?? [])).catch(() => {});
    axiosInstance.get('/api/farm/').then(r => setFarms(r.data.farms ?? [])).catch(() => {});
  }, []);

  // Free space, so the operator knows before weighing.
  useEffect(() => {
    if (!form.store_id) { setStock(null); return; }
    axiosInstance.get(`/api/receipts/stock/${form.store_id}`)
      .then(r => setStock(r.data)).catch(() => setStock(null));
  }, [form.store_id]);

  useEffect(() => {
    if (!form.crop_id) { setVarieties([]); return; }
    axiosInstance.get('/api/crop-variety/', { params: { crop_id: form.crop_id, active: 1 } })
      .then(r => setVarieties(r.data.varieties ?? [])).catch(() => setVarieties([]));
  }, [form.crop_id]);

  useEffect(() => {
    if (!form.crop_id) { setParameters([]); return; }
    axiosInstance.get('/api/quality/parameters', {
      params: { crop_id: form.crop_id, scope: 'applicable', variety_id: form.variety_id || undefined },
    })
      .then(r => setParameters((r.data.parameters ?? []).filter(p => p.is_active)))
      .catch(() => setParameters([]));
    setMeasurements({}); setGrading(null);
  }, [form.crop_id, form.variety_id]);

  // ── Live grading, debounced ────────────────────────────────────────────────
  const evaluate = useCallback(() => {
    if (!form.crop_id || parameters.length === 0) return;
    setGradingBusy(true);
    axiosInstance.post('/api/quality/evaluate', {
      crop_id: form.crop_id,
      variety_id: form.variety_id || null,
      measurements,
    })
      .then(r => setGrading(r.data))
      .catch(err => setGrading({ accepted: false, grade: null, notes: [],
        errors: [err.response?.data?.message || err.message] }))
      .finally(() => setGradingBusy(false));
  }, [form.crop_id, form.variety_id, parameters.length, measurements]);

  useEffect(() => {
    if (step !== 2) return undefined;
    clearTimeout(gradeTimer.current);
    gradeTimer.current = setTimeout(evaluate, 500);
    return () => clearTimeout(gradeTimer.current);
  }, [step, measurements, evaluate]);

  // ── Farm lines ──────────────────────────────────────────────────────────────
  const addFarmLine = () => setFarmLines(l => [...l, { farm_id: '', weight_kg: '' }]);
  const updateFarmLine = (i, patch) =>
    setFarmLines(l => l.map((line, idx) => (idx === i ? { ...line, ...patch } : line)));
  const removeFarmLine = (i) => setFarmLines(l => l.filter((_, idx) => idx !== i));

  const farmTotal = useMemo(
    () => farmLines.reduce((sum, l) => sum + (parseFloat(l.weight_kg) || 0), 0),
    [farmLines]);
  const netWeight = parseFloat(form.net_weight_kg) || 0;
  const farmGap = farmLines.length > 0 ? Math.abs(farmTotal - netWeight) : 0;

  // ── Validation per step ─────────────────────────────────────────────────────
  const validateStep = (index) => {
    const e = {};
    if (index === 0) {
      if (!form.store_id) e.store_id = 'Select the warehouse receiving the goods';
      if (!form.depositor_name.trim()) e.depositor_name = 'Who is depositing?';
    }
    if (index === 1) {
      if (!form.crop_id) e.crop_id = 'Select the commodity';
      if (!(parseFloat(form.net_weight_kg) > 0)) e.net_weight_kg = 'Enter the net weight';
      if (form.gross_weight_kg && parseFloat(form.gross_weight_kg) < parseFloat(form.net_weight_kg))
        e.gross_weight_kg = 'Gross cannot be lower than net';
      if (stock?.capacity_kg != null) {
        const free = stock.capacity_kg - stock.held_kg;
        if (parseFloat(form.net_weight_kg) > free)
          e.net_weight_kg = `Only ${fmt(free, 0)} kg of free space left in this warehouse`;
      }
    }
    if (index === 2) {
      parameters.filter(p => p.is_required).forEach(p => {
        if (measurements[p.id] === undefined || measurements[p.id] === '')
          e[`m_${p.id}`] = 'Required';
      });
      if (grading && !grading.accepted) e.grading = 'The delivery is outside the accepted range';
    }
    if (index === 3) {
      if (farmLines.length > 0 && farmGap > 0.5)
        e.farms = `Farm weights add up to ${fmt(farmTotal, 0)} kg, net weight is ${fmt(netWeight, 0)} kg`;
    }
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setStep(s => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => { setErrors({}); setStep(s => Math.max(0, s - 1)); };

  // ── Issue ───────────────────────────────────────────────────────────────────
  const submit = async () => {
    const e = { ...validateStep(2), ...validateStep(3) };
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        variety_id: form.variety_id || null,
        gross_weight_kg: form.gross_weight_kg || form.net_weight_kg,
        measurements,
        farms: farmLines
          .filter(l => l.farm_id || l.weight_kg)
          .map(l => ({ farm_id: l.farm_id || null, weight_kg: parseFloat(l.weight_kg) || 0 })),
      };
      const { data } = await axiosInstance.post('/api/receipts/create', payload);
      setIssued(data.receipt);
      Swal.fire({ icon: 'success', title: `Receipt ${data.receipt.serial} issued`,
        timer: 2200, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      const body = err.response?.data;
      Swal.fire({
        icon: 'error', title: 'Receipt not issued',
        html: `${body?.message || err.message}${
          body?.errors?.length ? `<ul style="text-align:left;margin-top:10px;font-size:13px">${
            body.errors.map(x => `<li>• ${x}</li>`).join('')}</ul>` : ''}`,
        customClass: { popup: 'rounded-2xl' },
      });
    } finally { setSubmitting(false); }
  };

  const reset = () => {
    setIssued(null); setForm(EMPTY); setMeasurements({}); setFarmLines([]);
    setGrading(null); setErrors({}); setStep(0);
  };

  const warehouse = warehouses.find(w => String(w.id) === String(form.store_id));
  const freeSpace = stock?.capacity_kg != null ? stock.capacity_kg - stock.held_kg : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50/20 p-4 sm:p-6 light-panel">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileText size={22} className="text-amber-600"/> Receive a delivery
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Weigh, measure, grade — then issue a warehouse receipt the depositor can use as collateral.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto">
        {STEPS.map(({ id, label, Icon }) => {
          const done = step > id;
          const active = step === id;
          return (
            <React.Fragment key={id}>
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors
                ${active ? 'bg-amber-600 text-white' : done ? 'bg-amber-50 text-amber-700' : 'bg-white text-gray-400 border border-gray-100'}`}>
                {done ? <Check size={15}/> : <Icon size={15}/>} {label}
              </div>
              {id < STEPS.length - 1 && <span className="h-px w-5 bg-gray-200 flex-shrink-0"/>}
            </React.Fragment>
          );
        })}
      </div>

      {globalError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertTriangle size={15}/>{globalError}</div>}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">

          {step === 0 && (
            <>
              <Field label="Warehouse" required error={errors.store_id}
                hint="Only certified, active warehouses can issue receipts">
                <select value={form.store_id} onChange={e => setForm({ ...form, store_id: e.target.value })}
                  className={inputCls(errors.store_id)}>
                  <option value="">Select warehouse</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.code ? `${w.code} — ` : ''}{w.name} ({w.district}, {w.country})</option>
                  ))}
                </select>
              </Field>

              {warehouse && stock && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                  <div className="flex justify-between gap-4 flex-wrap">
                    <span className="text-amber-800">Currently held</span>
                    <span className="font-semibold text-amber-900">{fmt(stock.held_kg, 0)} kg</span>
                  </div>
                  {freeSpace != null && (
                    <div className="flex justify-between gap-4 flex-wrap mt-1">
                      <span className="text-amber-800">Free space</span>
                      <span className="font-semibold text-amber-900">{fmt(freeSpace, 0)} kg</span>
                    </div>
                  )}
                </div>
              )}

              <Field label="Depositor type" required>
                <div className="grid grid-cols-3 gap-2">
                  {DEPOSITOR_TYPES.map(d => (
                    <button key={d.value} type="button"
                      onClick={() => setForm({ ...form, depositor_type: d.value })}
                      className={`px-2 py-2 rounded-xl border text-xs font-medium transition-colors
                        ${form.depositor_type === d.value ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Depositor name" required error={errors.depositor_name}>
                <input type="text" placeholder="e.g. Bugisu Cooperative Union" value={form.depositor_name}
                  onChange={e => setForm({ ...form, depositor_name: e.target.value })}
                  className={inputCls(errors.depositor_name)}/>
              </Field>

              <Field label="Depositor reference" hint="Their own ID: cooperative number, SACCO code, farm ID…">
                <input type="text" placeholder="e.g. COOP-0012" value={form.depositor_code}
                  onChange={e => setForm({ ...form, depositor_code: e.target.value })}
                  className={inputCls(false)}/>
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Commodity" required error={errors.crop_id}>
                <select value={form.crop_id}
                  onChange={e => setForm({ ...form, crop_id: e.target.value, variety_id: '' })}
                  className={inputCls(errors.crop_id)}>
                  <option value="">Select commodity</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>

              <Field label="Variety" hint={varieties.length === 0 ? 'No variety recorded for this commodity' : undefined}>
                <select value={form.variety_id} onChange={e => setForm({ ...form, variety_id: e.target.value })}
                  disabled={varieties.length === 0} className={inputCls(false)}>
                  <option value="">Not specified</option>
                  {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Gross weight (kg)" error={errors.gross_weight_kg} hint="With bags">
                  <input type="number" min="0" step="0.001" value={form.gross_weight_kg}
                    onChange={e => setForm({ ...form, gross_weight_kg: e.target.value })}
                    className={inputCls(errors.gross_weight_kg)}/>
                </Field>
                <Field label="Net weight (kg)" required error={errors.net_weight_kg} hint="What the receipt covers">
                  <input type="number" min="0" step="0.001" value={form.net_weight_kg}
                    onChange={e => setForm({ ...form, net_weight_kg: e.target.value })}
                    className={inputCls(errors.net_weight_kg)}/>
                </Field>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {parameters.length === 0 ? (
                <div className="text-center py-10">
                  <FlaskConical size={36} className="mx-auto mb-3 text-gray-300"/>
                  <p className="text-gray-500 font-medium">No quality parameter for this commodity</p>
                  <p className="text-sm text-gray-400 mt-1">
                    The receipt will be issued without a measured grade. Define parameters in the Quality Manager.
                  </p>
                </div>
              ) : parameters.map(p => (
                <Field key={p.id} label={`${p.name}${p.unit ? ` (${p.unit})` : ''}`}
                  required={p.is_required} error={errors[`m_${p.id}`]}
                  hint={p.value_type === 'number' && (p.min_value != null || p.max_value != null)
                    ? `Accepted between ${p.min_value ?? '−∞'} and ${p.max_value ?? '+∞'}`
                    : undefined}>
                  {p.value_type === 'number' ? (
                    <input type="number" step="any" value={measurements[p.id] ?? ''}
                      onChange={e => setMeasurements(m => ({ ...m, [p.id]: e.target.value }))}
                      className={inputCls(errors[`m_${p.id}`])}/>
                  ) : (
                    <select value={measurements[p.id] ?? ''}
                      onChange={e => setMeasurements(m => ({ ...m, [p.id]: e.target.value }))}
                      className={inputCls(errors[`m_${p.id}`])}>
                      <option value="">—</option>
                      {(p.value_type === 'boolean' ? ['yes', 'no'] : (p.options ?? [])).map(o =>
                        <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </Field>
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Contributing farms</p>
                  <p className="text-xs text-gray-400">
                    Optional, but this is what keeps the delivery traceable to its plots.
                  </p>
                </div>
                <button type="button" onClick={addFarmLine}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
                  <Plus size={13}/> Add farm
                </button>
              </div>

              {farmLines.map((line, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select value={line.farm_id} onChange={e => updateFarmLine(i, { farm_id: e.target.value })}
                    className={`${inputCls(false)} flex-1`}>
                    <option value="">Select farm</option>
                    {farms.map(f => (
                      <option key={f.farm_id || f.id} value={f.farm_id}>{f.farm_id} — {f.name}</option>
                    ))}
                  </select>
                  <input type="number" min="0" step="0.001" placeholder="kg" value={line.weight_kg}
                    onChange={e => updateFarmLine(i, { weight_kg: e.target.value })}
                    className={`${inputCls(false)} w-32`}/>
                  <button type="button" onClick={() => removeFarmLine(i)}
                    className="p-2.5 rounded-xl border border-gray-200 text-red-500 hover:bg-red-50">
                    <Trash2 size={15}/>
                  </button>
                </div>
              ))}

              {farmLines.length > 0 && (
                <div className={`rounded-xl border px-4 py-2.5 text-sm flex justify-between
                  ${farmGap > 0.5 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  <span>Farms total</span>
                  <span className="font-semibold">{fmt(farmTotal, 0)} kg / {fmt(netWeight, 0)} kg net</span>
                </div>
              )}
              {errors.farms && <p className="text-xs text-red-500">{errors.farms}</p>}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Field label="Price per kg">
                  <input type="number" min="0" step="0.01" value={form.price_per_kg}
                    onChange={e => setForm({ ...form, price_per_kg: e.target.value })}
                    className={inputCls(false)}/>
                </Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                    className={inputCls(false)}>
                    {['UGX', 'USD', 'EUR', 'RWF', 'KES'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Note">
                <input type="text" placeholder="Anything worth recording about this delivery" value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls(false)}/>
              </Field>
            </>
          )}

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={back} disabled={step === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium disabled:opacity-40">
              <ChevronLeft size={15}/> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold">
                Continue <ChevronRight size={15}/>
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting || (grading && !grading.accepted)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold
                  ${submitting || (grading && !grading.accepted) ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}>
                {submitting ? <><Loader2 size={15} className="animate-spin"/> Issuing…</> : <><FileText size={15}/> Issue receipt</>}
              </button>
            )}
          </div>
        </div>

        {/* ── Live summary ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit lg:sticky lg:top-6 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">This delivery</p>

          {[
            ['Warehouse', warehouse ? (warehouse.code ? `${warehouse.code} · ${warehouse.name}` : warehouse.name) : '—'],
            ['Depositor', form.depositor_name || '—'],
            ['Commodity', crops.find(c => String(c.id) === String(form.crop_id))?.name || '—'],
            ['Variety', varieties.find(v => String(v.id) === String(form.variety_id))?.name || '—'],
            ['Net weight', form.net_weight_kg ? `${fmt(form.net_weight_kg, 0)} kg` : '—'],
            ['Value', form.price_per_kg && form.net_weight_kg
              ? `${fmt(form.price_per_kg * form.net_weight_kg)} ${form.currency}` : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 text-sm">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-800 text-right">{v}</span>
            </div>
          ))}

          {/* Grading verdict */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quality</p>
            {grading_busy ? (
              <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Checking…</p>
            ) : !grading ? (
              <p className="text-sm text-gray-400">Enter the measurements to see the grade.</p>
            ) : (
              <div className={`rounded-xl border p-3 text-sm ${grading.accepted ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                <p className="font-semibold flex items-center gap-1.5">
                  {grading.accepted ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
                  {grading.accepted
                    ? (grading.grade ? `Grade ${grading.grade.grade_value}` : 'Accepted — no grade matched')
                    : 'Rejected'}
                </p>
                {(grading.errors ?? []).map((e, i) => <p key={i} className="text-xs mt-1">• {e}</p>)}
                {(grading.notes ?? []).map((n, i) => <p key={i} className="text-xs mt-1 opacity-80">• {n}</p>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {issued && (
        <>
          <PrintableReceipt receipt={issued} onClose={reset}/>
        </>
      )}
    </div>
  );
};

export default ReceiptReception;