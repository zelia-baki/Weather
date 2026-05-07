import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import SoapResponseDisplay from "./SoapResponseDisplay";
import { SendPaymentModal } from '../Payment/SendPaymentModal';
import {
  FileText, Send, RefreshCw, Trash2, Search, Eye,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Loader2, Upload, X,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const ACTIVITY_TYPES = ["DOMESTIC", "TRADE", "IMPORT", "EXPORT"];
const EU_COUNTRIES   = [
  "AT","BE","BG","CY","CZ","DE","DK","EE","ES","FI","FR",
  "GR","HR","HU","IE","IT","LT","LU","LV","MT","NL","PL",
  "PT","RO","SE","SI","SK","XI",
];
const QUALIFIERS = [
  "ASV","ASVX","CCT","CEN","CTM","DAP","DHS","DTN","DTNE","DTNF",
  "DTNG","DTNL","DTNM","DTNR","DTNS","DTNZ","ENP","EUR","GFI","GRM",
  "GRT","HLT","HMT","KAC","KCC","KCL","KGM","KGMA","KGME","KGMG",
  "KGMP","KGMS","KGMT","KLT","KMA","KMT","KNI","KNS","KPH","KPO",
  "KPP","KSD","KSH","KUR","LPA","LTR","LTRA","MIL","MPR","MTK",
  "MTQ","MTQC","MTR","MWH","NAR","NARB","NCL","NPR","TJO","TNE",
  "TNEE","TNEI","TNEJ","TNEK","TNEM","TNER","TNEZ","WAT",
];
const IDENTIFIER_TYPES = [
  "eori","vat","cin","duns","comp_reg","comp_num",
  "cbr","ship_man_comp_imo","ship_reg_owner_imo","remos","gln","tin",
];

// ── Reusable field components ─────────────────────────────────────────────────
const iCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all hover:border-gray-300";
const sCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all";

const Field = ({ label, required, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

// ── Section header (collapsible) ──────────────────────────────────────────────
const Section = ({ title, icon, children, badge }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-blue-600">{icon}</span>
          <span className="text-sm font-bold text-gray-700">{title}</span>
          {badge && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
      </button>
      {open && <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>}
    </div>
  );
};

// ── Action button ─────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, label, icon, color = "blue", disabled }) => {
  const map = {
    blue:   "bg-blue-600 hover:bg-blue-700 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    red:    "bg-red-600 hover:bg-red-700 text-white",
    gray:   "bg-gray-600 hover:bg-gray-700 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-700 text-white",
    green:  "bg-emerald-600 hover:bg-emerald-700 text-white",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                  text-sm font-semibold transition-colors disabled:opacity-50
                  disabled:cursor-not-allowed ${map[color]}`}>
      {icon}{label}
    </button>
  );
};

// =============================================================================
const EMPTY_FORM = {
  internalReferenceNumber: '',
  activityType:            '',
  borderCrossCountry:      '',
  comment:                 '',
  descriptionOfGoods:      '',
  hsHeading:               '',
  geoLocationConfidential: false,
  goodsMeasure: { volume: '', netWeight: '', supplementaryUnit: '', supplementaryUnitQualifier: '' },
  speciesInfo:  { scientificName: '', commonName: '' },
  producers:    [{ country: '', name: '' }],
  operator: {
    identifierType: '', identifierValue: '', name: '',
    country: '', address: '', email: '', phone: '',
  },
  countryOfActivity: '',
};

const EUDRManager = () => {
  const [formData,         setFormData]         = useState(EMPTY_FORM);
  const [geojson,          setGeojson]          = useState('');
  const [ddsIdentifier,    setDdsIdentifier]    = useState('');
  const [referenceCheck,   setReferenceCheck]   = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationMode, setVerificationMode] = useState(false);
  const [responseData,     setResponseData]     = useState(null);
  const [showResult,       setShowResult]       = useState(false);
  const [showPreview,      setShowPreview]      = useState(false);
  const [loading,          setLoading]          = useState('');  // action key being loaded
  const [allCountries,     setAllCountries]     = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [geojsonError,     setGeojsonError]     = useState('');
  const [resultOpen,       setResultOpen]       = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/pays/')
      .then(r => setAllCountries(r.data.pays || []))
      .catch(() => {});
  }, []);

  // ── handleChange supports nested keys (e.g. "goodsMeasure.volume") ─────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("producers.")) {
      const field = name.split(".")[1];
      setFormData(p => ({ ...p, producers: [{ ...p.producers[0], [field]: value }] }));
    } else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(p => ({ ...p, [parent]: { ...p[parent], [child]: value } }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  // ── GeoJSON validation ────────────────────────────────────────────────────
  const parseGeoJSON = () => {
    if (!geojson.trim()) { setGeojsonError('GeoJSON is required.'); return null; }
    try {
      const parsed = JSON.parse(geojson);
      setGeojsonError('');
      return parsed;
    } catch {
      setGeojsonError('Invalid JSON — please check the syntax.');
      return null;
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const run = async (key, fn) => {
    setLoading(key);
    setVerificationMode(false);
    try {
      const res = await fn();
      setResponseData(res.data);
      setShowResult(true);
    } catch (err) {
      setResponseData({ error: err.response?.data || err.message });
      setShowResult(true);
    } finally {
      setLoading('');
    }
  };

  const handleSubmit  = () => {
    const geo = parseGeoJSON(); if (!geo) return;
    run('submit',  () => axiosInstance.post('/api/eudr/submit',  { statement: formData, geojson: geo }));
  };
  const handleAmend   = () => {
    const geo = parseGeoJSON(); if (!geo) return;
    run('amend',   () => axiosInstance.post('/api/eudr/amend',   { statement: formData, geojson: geo, ddsIdentifier }));
  };
  const handleRetract = () =>
    run('retract', () => axiosInstance.delete(`/api/eudr/retract/${ddsIdentifier}`));
  const handleGetByRef = () =>
    run('byRef',   () => axiosInstance.get(`/api/eudr/info/by-internal-ref/${formData.internalReferenceNumber}`));
  const handleGetByDds = () =>
    run('byDds',   () => axiosInstance.get(`/api/eudr/info/by-dds-id/${ddsIdentifier}`));
  const handleVerify = async () => {
    setLoading('verify');
    setVerificationMode(true);
    try {
      const res = await axiosInstance.post('/api/eudr/info/by-ref-verification', {
        reference: referenceCheck, verification: verificationCode,
      });
      setResponseData(res.data);
      setShowResult(true);
      setShowPreview(true);
    } catch (err) {
      setResponseData({ error: err.response?.data || err.message });
      setShowResult(true);
    } finally {
      setLoading('');
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM); setGeojson(''); setDdsIdentifier('');
    setReferenceCheck(''); setVerificationCode(''); setResponseData(null);
    setShowResult(false); setGeojsonError('');
  };

  const isLoading = (key) => loading === key;
  const btnIcon   = (key) => isLoading(key)
    ? <Loader2 size={15} className="animate-spin"/>
    : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 p-4 sm:p-6 light-panel">

      {/* Page header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={22} className="text-blue-600"/> Due Diligence Statements
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              EU Regulation 2023/1115 — EUDR Submission Portal · Admin only
            </p>
          </div>
          <button onClick={resetForm}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <X size={14}/> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── LEFT: Form ── */}
        <div className="space-y-4">

          {/* 1 — Statement */}
          <Section title="Statement Info" icon={<FileText size={16}/>}>
            <Field label="Internal Reference Number" required>
              <input name="internalReferenceNumber" value={formData.internalReferenceNumber}
                onChange={handleChange} placeholder="e.g. REF-2024-001" className={iCls}/>
            </Field>
            <Field label="Activity Type" required>
              <select name="activityType" value={formData.activityType}
                onChange={handleChange} className={sCls}>
                <option value="">Select activity type</option>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Border Cross Country" required>
              <select name="borderCrossCountry" value={formData.borderCrossCountry}
                onChange={handleChange} className={sCls}>
                <option value="">Select country</option>
                {EU_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Country of Activity">
              <select name="countryOfActivity" value={formData.countryOfActivity}
                onChange={handleChange} className={sCls}>
                <option value="">Select country</option>
                {EU_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Comment" hint="Optional additional information">
              <input name="comment" value={formData.comment}
                onChange={handleChange} placeholder="Optional comment" className={iCls}/>
            </Field>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={formData.geoLocationConfidential}
                  onChange={() => setFormData(p => ({ ...p, geoLocationConfidential: !p.geoLocationConfidential }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"/>
                <span className="text-sm text-gray-700">Geo Location Confidential</span>
              </label>
            </div>
          </Section>

          {/* 2 — Goods & Species */}
          <Section title="Goods & Species" icon={<Search size={16}/>}>
            <Field label="Description of Goods" required>
              <input name="descriptionOfGoods" value={formData.descriptionOfGoods}
                onChange={handleChange} placeholder="e.g. Cocoa beans" className={iCls}/>
            </Field>
            <Field label="HS Heading (2–8 digits)" required>
              <input name="hsHeading" value={formData.hsHeading} pattern="[0-9]{2,8}"
                onChange={handleChange} placeholder="e.g. 1801" className={iCls}/>
            </Field>
            <Field label="Volume" required>
              <input type="number" step="any" min="0" name="goodsMeasure.volume"
                value={formData.goodsMeasure.volume}
                onChange={handleChange} placeholder="0.00" className={iCls}/>
            </Field>
            <Field label="Net Weight (kg)" required>
              <input type="number" step="any" min="0" name="goodsMeasure.netWeight"
                value={formData.goodsMeasure.netWeight}
                onChange={handleChange} placeholder="0.00" className={iCls}/>
            </Field>
            <Field label="Supplementary Unit">
              <input type="number" step="1" min="0" name="goodsMeasure.supplementaryUnit"
                value={formData.goodsMeasure.supplementaryUnit}
                onChange={handleChange} placeholder="0" className={iCls}/>
            </Field>
            <Field label="Unit Qualifier">
              <select name="goodsMeasure.supplementaryUnitQualifier"
                value={formData.goodsMeasure.supplementaryUnitQualifier}
                onChange={handleChange} className={sCls}>
                <option value="">Select qualifier</option>
                {QUALIFIERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </Field>
            <Field label="Scientific Name">
              <input name="speciesInfo.scientificName" value={formData.speciesInfo.scientificName}
                onChange={handleChange} placeholder="e.g. Theobroma cacao" className={iCls}/>
            </Field>
            <Field label="Common Name">
              <input name="speciesInfo.commonName" value={formData.speciesInfo.commonName}
                onChange={handleChange} placeholder="e.g. Cocoa" className={iCls}/>
            </Field>
          </Section>

          {/* 3 — Producer */}
          <Section title="Producer" icon={<CheckCircle size={16}/>} badge="1 producer">
            <Field label="Producer Country" required>
              <select name="producers.country" value={formData.producers[0].country}
                onChange={handleChange} className={sCls}>
                <option value="">Select country</option>
                {allCountries.map(c => (
                  <option key={c.id} value={c.alpha2}>{c.nom_en_gb}</option>
                ))}
              </select>
            </Field>
            <Field label="Producer Name" required>
              <input name="producers.name" value={formData.producers[0].name}
                onChange={handleChange} placeholder="Producer or company name" className={iCls}/>
            </Field>
          </Section>

          {/* 4 — Operator */}
          <Section title="Operator Info" icon={<Eye size={16}/>}>
            <Field label="Identifier Type">
              <select name="operator.identifierType" value={formData.operator.identifierType}
                onChange={handleChange} className={sCls}>
                <option value="">Select type</option>
                {IDENTIFIER_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </Field>
            <Field label="Identifier Value">
              <input name="operator.identifierValue" value={formData.operator.identifierValue}
                onChange={handleChange} placeholder="e.g. HRUG000004679" className={iCls}/>
            </Field>
            <Field label="Operator Name">
              <input name="operator.name" value={formData.operator.name}
                onChange={handleChange} placeholder="Company name" className={iCls}/>
            </Field>
            <Field label="Country">
              <select name="operator.country" value={formData.operator.country}
                onChange={handleChange} className={sCls}>
                <option value="">Select country</option>
                {allCountries.map(c => <option key={c.id} value={c.alpha2}>{c.nom_en_gb}</option>)}
              </select>
            </Field>
            <Field label="Address">
              <input name="operator.address" value={formData.operator.address}
                onChange={handleChange} placeholder="Full address" className={iCls}/>
            </Field>
            <Field label="Email">
              <input type="email" name="operator.email" value={formData.operator.email}
                onChange={handleChange} placeholder="operator@example.com" className={iCls}/>
            </Field>
            <Field label="Phone" hint="Format: +256 123 456 789">
              <input type="tel" name="operator.phone" value={formData.operator.phone}
                onChange={handleChange} placeholder="+256..." className={iCls}/>
            </Field>
          </Section>

          {/* 5 — GeoJSON */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <Upload size={16} className="text-blue-600"/>
                <span className="text-sm font-bold text-gray-700">GeoJSON</span>
                {geojson && !geojsonError && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Loaded
                  </span>
                )}
                {geojsonError && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <AlertTriangle size={10}/> Invalid
                  </span>
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                <Upload size={12}/> Import file
                <input type="file" accept=".json,.geojson" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const r = new FileReader();
                    r.onload = (ev) => {
                      try {
                        const parsed = JSON.parse(ev.target.result);
                        setGeojson(JSON.stringify(parsed, null, 2));
                        setGeojsonError('');
                      } catch { setGeojsonError('Invalid JSON file.'); }
                    };
                    r.readAsText(file);
                  }}
                />
              </label>
            </div>
            <div className="p-5">
              <textarea rows={6}
                placeholder='Paste GeoJSON here or import a .json/.geojson file…'
                value={geojson}
                onChange={(e) => { setGeojson(e.target.value); setGeojsonError(''); }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono resize-y
                            bg-white text-gray-800 placeholder-gray-400
                            focus:outline-none focus:ring-2 focus:border-transparent transition-all
                            ${geojsonError ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-400'}`}
              />
              {geojsonError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle size={11}/>{geojsonError}
                </p>
              )}
            </div>
          </div>

          {/* 6 — Submit actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</p>

            {/* Primary */}
            <div className="grid grid-cols-2 gap-3">
              <ActionBtn onClick={handleSubmit} label={isLoading('submit') ? 'Submitting…' : 'Submit Statement'}
                icon={btnIcon('submit') || <Send size={15}/>} color="blue" disabled={!!loading}/>
              <ActionBtn onClick={handleAmend} label={isLoading('amend') ? 'Amending…' : 'Amend Statement'}
                icon={btnIcon('amend') || <RefreshCw size={15}/>} color="yellow" disabled={!!loading}/>
            </div>

            {/* DDS Identifier + retract */}
            <div className="flex gap-3">
              <input value={ddsIdentifier} onChange={e => setDdsIdentifier(e.target.value)}
                placeholder="DDS Identifier (for Amend / Retract / Get)"
                className={iCls + " flex-1"}/>
              <ActionBtn onClick={handleRetract} label={isLoading('retract') ? '…' : 'Retract'}
                icon={btnIcon('retract') || <Trash2 size={15}/>} color="red" disabled={!!loading}/>
            </div>

            {/* Query actions */}
            <div className="grid grid-cols-2 gap-3">
              <ActionBtn onClick={handleGetByRef} label={isLoading('byRef') ? 'Loading…' : 'Get by Internal Ref'}
                icon={btnIcon('byRef') || <Search size={15}/>} color="gray" disabled={!!loading}/>
              <ActionBtn onClick={handleGetByDds} label={isLoading('byDds') ? 'Loading…' : 'Get by DDS ID'}
                icon={btnIcon('byDds') || <Search size={15}/>} color="gray" disabled={!!loading}/>
            </div>

            {/* Verify */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Verify Statement
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input value={referenceCheck} onChange={e => setReferenceCheck(e.target.value)}
                  placeholder="Reference Number" className={iCls}/>
                <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)}
                  placeholder="Verification Code" className={iCls}/>
              </div>
              <ActionBtn onClick={() => setShowPaymentModal(true)}
                label={isLoading('verify') ? 'Verifying…' : 'Verify Statement'}
                icon={btnIcon('verify') || <Eye size={15}/>} color="indigo" disabled={!!loading}/>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Result ── */}
        <div>
          {!showResult ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center sticky top-6">
              <FileText size={40} className="mx-auto mb-3 text-gray-300"/>
              <p className="text-gray-500 font-medium">No result yet</p>
              <p className="text-gray-400 text-sm mt-1">Submit or query a statement to see the response here</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600"/> Result
                </h3>
                <button onClick={() => setShowResult(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                  <X size={15}/>
                </button>
              </div>
              <div className="p-5">
                <SoapResponseDisplay
                  data={responseData}
                  referenceNumber={referenceCheck}
                  verificationCode={verificationCode}
                  showPreview={showPreview}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {showPaymentModal && (
        <SendPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          featureName="eudrsubmission"
          phone={formData.operator.phone}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            handleVerify();
          }}
        />
      )}
    </div>
  );
};

export default EUDRManager;