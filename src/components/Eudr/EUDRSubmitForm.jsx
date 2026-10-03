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
// EUDR V3: TRADE no longer exists (traders are excluded from DDS submission)
const ACTIVITY_TYPES = ["DOMESTIC", "IMPORT", "EXPORT"];
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

// ── Reusable field components ─────────────────────────────────────────────────
// EUDR V3 n'accepte que des sous-positions à 6 chiffres (0901 → rejeté,
// 090111 → accepté), alors que l'Annexe I (table hscode) liste des positions à
// 4 chiffres. Sous-positions du Système harmonisé (HS 2022) des commodités
// principales ; pour les autres positions, l'utilisateur complète les 2
// derniers chiffres depuis sa déclaration en douane.
const HS_SUBHEADINGS = {
  '0201': [['020110', 'Carcasses and half-carcasses'], ['020120', 'Other cuts with bone in'], ['020130', 'Boneless']],
  '0202': [['020210', 'Carcasses and half-carcasses'], ['020220', 'Other cuts with bone in'], ['020230', 'Boneless']],
  '0901': [['090111', 'Coffee, not roasted, not decaffeinated'], ['090112', 'Coffee, not roasted, decaffeinated'],
           ['090121', 'Coffee, roasted, not decaffeinated'], ['090122', 'Coffee, roasted, decaffeinated'],
           ['090190', 'Other (coffee husks and skins, coffee substitutes)']],
  '1201': [['120110', 'Soya beans, seed'], ['120190', 'Soya beans, other']],
  '1507': [['150710', 'Soya-bean oil, crude'], ['150790', 'Soya-bean oil, other']],
  '1511': [['151110', 'Palm oil, crude'], ['151190', 'Palm oil, other']],
  '1801': [['180100', 'Cocoa beans, whole or broken, raw or roasted']],
  '1802': [['180200', 'Cocoa shells, husks, skins and other cocoa waste']],
  '1803': [['180310', 'Cocoa paste, not defatted'], ['180320', 'Cocoa paste, wholly or partly defatted']],
  '1804': [['180400', 'Cocoa butter, fat and oil']],
  '1805': [['180500', 'Cocoa powder, not containing added sugar']],
  '1806': [['180610', 'Cocoa powder, containing added sugar'], ['180620', 'Other preparations in blocks > 2 kg or in bulk'],
           ['180631', 'Blocks, slabs or bars, filled'], ['180632', 'Blocks, slabs or bars, not filled'],
           ['180690', 'Other chocolate preparations']],
  '2304': [['230400', 'Oilcake and other solid residues of soya-bean oil']],
  '4001': [['400110', 'Natural rubber latex'], ['400121', 'Smoked sheets'],
           ['400122', 'Technically specified natural rubber (TSNR)'], ['400129', 'Natural rubber, other forms'],
           ['400130', 'Balata, gutta-percha, guayule, chicle and similar natural gums']],
};
const hsDigits = (code) => String(code || '').replace(/\D/g, '');

// Unité supplémentaire : TRACES rejette tout qualificatif qui ne correspond pas
// à l'unité de la Nomenclature combinée du code HS (même règle que
// _supplementary_unit() côté backend, eudr_utils.py).
const SUPPLEMENTARY_UNIT_BY_HS = {
  '0102': 'NAR', '4011': 'NAR', '4012': 'NAR',
  '4403': 'MTQ', '4406': 'MTQ', '4407': 'MTQ', '4408': 'MTQ', '4412': 'MTQ',
};
const NO_SUPPLEMENTARY_UNIT_CHAPTERS = ['02', '09', '12', '15', '16', '18', '23'];
// 'none' → pas d'unité supplémentaire ; 'NAR'/'MTQ' → imposée ; null → libre
const supplementaryRule = (hs) => {
  const d = hsDigits(hs);
  if (d.length < 2) return null;
  if (NO_SUPPLEMENTARY_UNIT_CHAPTERS.includes(d.slice(0, 2))) return 'none';
  return SUPPLEMENTARY_UNIT_BY_HS[d.slice(0, 4)] || null;
};

const iCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all hover:border-gray-300 [color-scheme:light]";
const sCls = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all [color-scheme:light]";

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
  // ✅ Operator Info figé — c'est toujours le même opérateur (Agriyields),
  // affiché en lecture seule dans le formulaire (voir Section "Operator Info"
  // plus bas) plutôt que ressaisi à chaque soumission.
  operator: {
    identifierType: 'eori', identifierValue: 'HRUG000004679',
    name: 'AGRIYIELDS ENTERPRISES UG SMC LTD',
    country: 'UG', address: 'T2 Building, Papaya Rise',
    email: 'lwetutb@agriyields.com', phone: '0783130358',
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
  const [allHscodes,       setAllHscodes]       = useState([]);
  // Code choisi dans la liste Annexe I ; formData.hsHeading = code final à 6 chiffres
  const [hsBase,           setHsBase]           = useState('');
  const suppRule = supplementaryRule(formData.hsHeading || hsBase);

  // Aligne l'unité supplémentaire sur la règle du code HS choisi
  useEffect(() => {
    setFormData(p => {
      const g = p.goodsMeasure;
      const next = suppRule === 'none' ? { ...g, supplementaryUnit: '', supplementaryUnitQualifier: '' }
                 : suppRule ? { ...g, supplementaryUnitQualifier: suppRule }
                 : g;
      return next === g || (next.supplementaryUnit === g.supplementaryUnit &&
                            next.supplementaryUnitQualifier === g.supplementaryUnitQualifier)
        ? p : { ...p, goodsMeasure: next };
    });
  }, [suppRule]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [geojsonError,     setGeojsonError]     = useState('');
  const [resultOpen,       setResultOpen]       = useState(true);

  useEffect(() => {
    axiosInstance.get('/api/pays/')
      .then(r => setAllCountries(r.data.pays || []))
      .catch(() => {});
    axiosInstance.get('/api/hscode/')
      .then(r => setAllHscodes(r.data.hscodes || []))
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

  // ── HS code : position Annexe I → sous-position 6 chiffres ────────────────
  const handleHsBaseChange = (e) => {
    const code = e.target.value;
    const d = hsDigits(code);
    setHsBase(code);
    const subs = HS_SUBHEADINGS[d];
    // 6 chiffres déjà (ex. "1513 21") ou une seule sous-position possible → automatique
    const auto = d.length >= 6 ? d.slice(0, 6) : (subs && subs.length === 1 ? subs[0][0] : '');
    setFormData(p => ({ ...p, hsHeading: auto }));
  };
  const handleHsSuffixChange = (e) => {
    const base = hsDigits(hsBase);
    const suffix = e.target.value.replace(/\D/g, '').slice(0, 6 - base.length);
    setFormData(p => ({ ...p, hsHeading: base + suffix }));
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

  // Client-side check of the fields TRACES V3 rejects when missing/empty
  const validateStatement = () => {
    const f = formData;
    const missing = [];
    if (!f.internalReferenceNumber.trim()) missing.push('Internal Reference Number');
    if (!f.activityType)                    missing.push('Activity Type');
    if (!f.countryOfActivity)               missing.push('Country of Activity');
    if (!f.descriptionOfGoods.trim())       missing.push('Description of Goods');
    if (!hsBase)                            missing.push('HS Heading');
    else if (hsDigits(f.hsHeading).length !== 6)
      missing.push(`HS Subheading (6 digits) for heading ${hsBase}`);
    if (!f.producers[0].country || !f.producers[0].name.trim()) missing.push('Producer (country + name)');
    const rule = supplementaryRule(f.hsHeading);
    const g = f.goodsMeasure;
    if (rule && rule !== 'none' && !(Number(g.supplementaryUnit) > 0))
      missing.push(`Supplementary Unit in ${rule} for HS ${hsDigits(f.hsHeading)}`);
    if (!rule && g.supplementaryUnit && !g.supplementaryUnitQualifier)
      missing.push('Unit Qualifier (required with a supplementary unit)');
    if (missing.length) {
      setResponseData({ error: `Missing required field(s): ${missing.join(', ')}` });
      setShowResult(true);
      return false;
    }
    return true;
  };

  const handleSubmit  = () => {
    if (!validateStatement()) return;
    const geo = parseGeoJSON(); if (!geo) return;
    run('submit',  () => axiosInstance.post('/api/eudr/submit',  { statement: formData, geojson: geo }));
  };
  const handleAmend   = () => {
    if (!ddsIdentifier.trim()) {
      setResponseData({ error: 'Enter the DDS Identifier of the statement to amend.' });
      setShowResult(true);
      return;
    }
    if (!validateStatement()) return;
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
    setFormData(EMPTY_FORM); setHsBase(''); setGeojson(''); setDdsIdentifier('');
    setReferenceCheck(''); setVerificationCode(''); setResponseData(null);
    setShowResult(false); setGeojsonError('');
  };

  const isLoading = (key) => loading === key;
  const btnIcon   = (key) => isLoading(key)
    ? <Loader2 size={15} className="animate-spin"/>
    : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 p-4 sm:p-6 light-panel eudr-form [color-scheme:light]" style={{ colorScheme: 'light' }}>
      <style>{`
        .eudr-form input,
        .eudr-form select,
        .eudr-form textarea {
          background-color: #ffffff !important;
          color: #1f2937 !important;
          -webkit-text-fill-color: #1f2937 !important;
          color-scheme: light !important;
        }
        .eudr-form input::placeholder,
        .eudr-form textarea::placeholder {
          color: #9ca3af !important;
          -webkit-text-fill-color: #9ca3af !important;
          opacity: 1 !important;
        }
        .eudr-form input:-webkit-autofill,
        .eudr-form input:-webkit-autofill:hover,
        .eudr-form input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #1f2937 !important;
        }
      `}</style>

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
                onChange={handleChange} maxLength={35} placeholder="e.g. REF-2024-001" className={iCls}/>
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
            <Field label="Country of Activity" required>
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
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 [color-scheme:light]"/>
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
            <Field label="HS Heading" required>
              <select name="hsBase" value={hsBase}
                onChange={handleHsBaseChange} className={sCls}>
                <option value="">Select HS code</option>
                {allHscodes.map(h => (
                  <option key={h.id} value={h.code}>
                    {h.code} — {h.description}
                  </option>
                ))}
              </select>
            </Field>
            {hsBase && hsDigits(hsBase).length < 6 && (
              <Field label="HS Subheading (6 digits)" required
                hint={`EUDR requires a 6-digit code. Selected: ${formData.hsHeading || 'none'}`}>
                {HS_SUBHEADINGS[hsDigits(hsBase)] ? (
                  <select name="hsHeading" value={formData.hsHeading}
                    onChange={handleChange} className={sCls}>
                    <option value="">Select subheading</option>
                    {HS_SUBHEADINGS[hsDigits(hsBase)].map(([code, label]) => (
                      <option key={code} value={code}>{code} — {label}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2.5 rounded-xl bg-gray-100 text-sm font-mono text-gray-700">
                      {hsDigits(hsBase)}
                    </span>
                    <input value={formData.hsHeading.slice(hsDigits(hsBase).length)}
                      onChange={handleHsSuffixChange} inputMode="numeric"
                      maxLength={6 - hsDigits(hsBase).length}
                      placeholder={'0'.repeat(6 - hsDigits(hsBase).length)}
                      className={iCls}/>
                  </div>
                )}
              </Field>
            )}
            <Field label="Volume" hint="Not transmitted to EUDR (removed in V3)">
              <input type="number" step="any" min="0" name="goodsMeasure.volume"
                value={formData.goodsMeasure.volume}
                onChange={handleChange} placeholder="0.00" className={iCls}/>
            </Field>
            <Field label="Net Weight (kg)" required>
              <input type="number" step="any" min="0" name="goodsMeasure.netWeight"
                value={formData.goodsMeasure.netWeight}
                onChange={handleChange} placeholder="0.00" className={iCls}/>
            </Field>
            {suppRule === 'none' ? (
              <Field label="Supplementary Unit"
                hint="Not applicable for this HS code: only the net weight (kg) is declared">
                <input disabled value="Not applicable" className={`${iCls} opacity-60`}/>
              </Field>
            ) : (
              <>
                <Field label="Supplementary Unit" required={!!suppRule}
                  hint={suppRule === 'MTQ' ? 'Volume in cubic metres (m³)'
                      : suppRule === 'NAR' ? 'Number of items / heads' : undefined}>
                  <input type="number" step="any" min="0" name="goodsMeasure.supplementaryUnit"
                    value={formData.goodsMeasure.supplementaryUnit}
                    onChange={handleChange} placeholder="0" className={iCls}/>
                </Field>
                <Field label="Unit Qualifier" hint={suppRule ? 'Imposed by the EU Combined Nomenclature' : undefined}>
                  {suppRule ? (
                    <input disabled value={suppRule} className={`${iCls} opacity-60`}/>
                  ) : (
                    <select name="goodsMeasure.supplementaryUnitQualifier"
                      value={formData.goodsMeasure.supplementaryUnitQualifier}
                      onChange={handleChange} className={sCls}>
                      <option value="">Select qualifier</option>
                      {QUALIFIERS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  )}
                </Field>
              </>
            )}
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

          {/* 4 — Operator (figé — toujours le même opérateur, non modifiable) */}
          <Section title="Operator Info" icon={<Eye size={16}/>} badge="Fixed">
            {[
              ['Identifier Type',  formData.operator.identifierType.toUpperCase()],
              ['Identifier Value', formData.operator.identifierValue],
              ['Operator Name',    formData.operator.name],
              ['Country',          formData.operator.country],
              ['Address',          formData.operator.address],
              ['Email',            formData.operator.email],
              ['Phone',            formData.operator.phone],
            ].map(([label, value]) => (
              <Field label={label} key={label}>
                <p className="text-sm text-gray-800 px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  {value}
                </p>
              </Field>
            ))}
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
                            bg-white text-gray-800 placeholder-gray-400 [color-scheme:light]
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