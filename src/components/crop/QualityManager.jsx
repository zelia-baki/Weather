// ── QUALITY MANAGER ───────────────────────────────────────────────────────────
// Quality parameters and grading rules, per commodity and optionally per variety.
// A row without a variety applies to every variety of the commodity.
import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import {
  FlaskConical, Plus, Edit2, Trash2, X, Check, Loader2, AlertTriangle,
  Ruler, Award, PlayCircle, CheckCircle2, XCircle,
} from 'lucide-react';

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-violet-400 hover:border-gray-300'}`;

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

const VALUE_TYPES = [
  { value: 'number',  label: 'Number',   hint: 'Measured value, e.g. moisture 12.5 %' },
  { value: 'choice',  label: 'Choice',   hint: 'One option from a list, e.g. Washed / Natural' },
  { value: 'boolean', label: 'Yes / No', hint: 'Simple check, e.g. free from foreign matter' },
];

const OPERATORS = [
  { value: 'lte',     label: 'at most' },
  { value: 'gte',     label: 'at least' },
  { value: 'between', label: 'between' },
  { value: 'eq',      label: 'equals' },
];

const EMPTY_PARAM = {
  name: '', unit: '', value_type: 'number', options: '', min_value: '', max_value: '',
  is_required: true, is_active: true, position: 0, variety_id: '',
};
const EMPTY_RULE = { grade_id: '', parameter_id: '', operator: 'lte', min_value: '', max_value: '', expected_value: '' };

const ruleText = (rule, parameters) => {
  const p = parameters.find(x => x.id === rule.parameter_id);
  const unit = p?.unit ? ` ${p.unit}` : '';
  const name = p?.name || rule.parameter_name || `#${rule.parameter_id}`;
  if (rule.operator === 'between') return `${name} between ${rule.min_value}${unit} and ${rule.max_value}${unit}`;
  if (rule.operator === 'lte')     return `${name} at most ${rule.max_value}${unit}`;
  if (rule.operator === 'gte')     return `${name} at least ${rule.min_value}${unit}`;
  return `${name} equals ${rule.expected_value ?? rule.min_value}${unit}`;
};

const ScopeBadge = ({ varietyName }) => (
  varietyName
    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{varietyName} only</span>
    : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">All varieties</span>
);

const QualityManager = () => {
  const [tab,         setTab]         = useState('parameters');
  const [crops,       setCrops]       = useState([]);
  const [varieties,   setVarieties]   = useState([]);
  const [cropId,      setCropId]      = useState('');
  const [varietyId,   setVarietyId]   = useState('');      // '' = commodity level
  const [parameters,  setParameters]  = useState([]);
  const [grades,      setGrades]      = useState([]);
  const [drawer,      setDrawer]      = useState(null);
  const [paramForm,   setParamForm]   = useState(EMPTY_PARAM);
  const [ruleForm,    setRuleForm]    = useState(EMPTY_RULE);
  const [errors,      setErrors]      = useState({});
  const [editingId,   setEditingId]   = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [testValues,  setTestValues]  = useState({});
  const [testResult,  setTestResult]  = useState(null);
  const [testing,     setTesting]     = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    axiosInstance.get('/api/crop/')
      .then(r => setCrops(r.data.crops ?? []))
      .catch(() => setGlobalError('Could not load commodities.'));
  }, []);

  useEffect(() => {
    if (!cropId) { setVarieties([]); return; }
    axiosInstance.get('/api/crop-variety/', { params: { crop_id: cropId, active: 1 } })
      .then(r => setVarieties(r.data.varieties ?? []))
      .catch(() => setVarieties([]));
  }, [cropId]);

  // scope=applicable returns the commodity-wide rows plus the variety-specific ones.
  const fetchParameters = useCallback(async () => {
    if (!cropId) { setParameters([]); return; }
    try {
      const r = await axiosInstance.get('/api/quality/parameters', {
        params: { crop_id: cropId, scope: 'applicable', variety_id: varietyId || undefined },
      });
      setParameters(r.data.parameters ?? []);
    } catch { setGlobalError('Could not load quality parameters.'); }
  }, [cropId, varietyId]);

  const fetchRules = useCallback(async () => {
    if (!cropId) { setGrades([]); return; }
    try {
      const r = await axiosInstance.get('/api/quality/rules', {
        params: { crop_id: cropId, variety_id: varietyId || undefined },
      });
      setGrades(r.data.grades ?? []);
    } catch { setGlobalError('Could not load grading rules.'); }
  }, [cropId, varietyId]);

  useEffect(() => {
    fetchParameters(); fetchRules();
    setTestValues({}); setTestResult(null);
  }, [fetchParameters, fetchRules]);

  // ── Parameters ──────────────────────────────────────────────────────────────
  const openParamCreate = () => {
    setParamForm({ ...EMPTY_PARAM, variety_id: varietyId });
    setEditingId(null); setErrors({}); setDrawer('param');
  };
  const openParamEdit = (p) => {
    setParamForm({
      name: p.name, unit: p.unit ?? '', value_type: p.value_type,
      options: (p.options ?? []).join(', '),
      min_value: p.min_value ?? '', max_value: p.max_value ?? '',
      is_required: p.is_required, is_active: p.is_active, position: p.position ?? 0,
      variety_id: p.variety_id ?? '',
    });
    setEditingId(p.id); setErrors({}); setDrawer('param');
  };

  const submitParam = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!paramForm.name.trim()) e.name = 'Parameter name is required';
    if (paramForm.value_type === 'choice' && paramForm.options.split(',').filter(o => o.trim()).length < 2)
      e.options = 'Enter at least two options, separated by commas';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    const payload = {
      ...paramForm,
      crop_id: cropId,
      variety_id: paramForm.variety_id || null,
      options: paramForm.options.split(',').map(o => o.trim()).filter(Boolean),
    };
    try {
      if (editingId) await axiosInstance.put(`/api/quality/parameters/${editingId}/edit`, payload);
      else           await axiosInstance.post('/api/quality/parameters/create', payload);
      await fetchParameters(); closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'Parameter updated' : 'Parameter created', timer: 1800, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not save', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const deleteParam = async (p) => {
    const r = await Swal.fire({ title: `Delete ${p.name}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try { await axiosInstance.delete(`/api/quality/parameters/${p.id}/delete`); await fetchParameters(); await fetchRules(); }
    catch (err) { Swal.fire({ icon: 'error', title: 'Could not delete', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } }); }
  };

  // ── Rules ───────────────────────────────────────────────────────────────────
  const openRuleCreate = (gradeId) => { setRuleForm({ ...EMPTY_RULE, grade_id: gradeId }); setEditingId(null); setErrors({}); setDrawer('rule'); };
  const openRuleEdit = (rule) => {
    setRuleForm({
      grade_id: rule.grade_id, parameter_id: rule.parameter_id, operator: rule.operator,
      min_value: rule.min_value ?? '', max_value: rule.max_value ?? '', expected_value: rule.expected_value ?? '',
    });
    setEditingId(rule.id); setErrors({}); setDrawer('rule');
  };

  const ruleParam = parameters.find(p => p.id === Number(ruleForm.parameter_id));
  const ruleGrade = grades.find(g => g.id === Number(ruleForm.grade_id));

  // A variety-specific parameter cannot drive a commodity-wide grade.
  const selectableParams = parameters.filter(p =>
    p.is_active && (!p.variety_id || (ruleGrade && ruleGrade.variety_id === p.variety_id)));

  const submitRule = async (ev) => {
    ev.preventDefault();
    if (!ruleForm.parameter_id) { setErrors({ parameter_id: 'Choose a parameter' }); return; }
    setSubmitting(true);
    try {
      if (editingId) await axiosInstance.put(`/api/quality/rules/${editingId}/edit`, ruleForm);
      else           await axiosInstance.post('/api/quality/rules/create', ruleForm);
      await fetchRules(); closeDrawer();
      Swal.fire({ icon: 'success', title: editingId ? 'Rule updated' : 'Rule added', timer: 1800, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not save', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const deleteRule = async (rule) => {
    try { await axiosInstance.delete(`/api/quality/rules/${rule.id}/delete`); await fetchRules(); }
    catch (err) { Swal.fire({ icon: 'error', title: 'Could not delete', text: err.response?.data?.message || err.message, customClass: { popup: 'rounded-2xl' } }); }
  };

  const closeDrawer = () => { setDrawer(null); setEditingId(null); setErrors({}); setParamForm(EMPTY_PARAM); setRuleForm(EMPTY_RULE); };

  // ── Tester ──────────────────────────────────────────────────────────────────
  const runTest = async () => {
    setTesting(true);
    try {
      const r = await axiosInstance.post('/api/quality/evaluate', {
        crop_id: cropId, variety_id: varietyId || null, measurements: testValues,
      });
      setTestResult(r.data);
    } catch (err) {
      setTestResult({ accepted: false, grade: null, errors: [err.response?.data?.message || err.message], notes: [] });
    } finally { setTesting(false); }
  };

  const activeParams = parameters.filter(p => p.is_active);
  const scopeLabel = varietyId
    ? varieties.find(v => String(v.id) === String(varietyId))?.name
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/20 p-4 sm:p-6 light-panel">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FlaskConical size={22} className="text-violet-600"/> Quality Manager</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Define what is measured at the warehouse, and which grade each result gives
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select value={cropId} onChange={e => { setCropId(e.target.value); setVarietyId(''); }}
              className="sm:w-52 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="">Select a commodity</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={varietyId} onChange={e => setVarietyId(e.target.value)} disabled={!cropId}
              className="sm:w-52 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-gray-50">
              <option value="">All varieties</option>
              {varieties.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
        {cropId && (
          <p className="text-xs text-gray-400 mt-3">
            {scopeLabel
              ? `Showing what applies to ${scopeLabel}: the shared rows of the commodity plus those specific to this variety.`
              : 'Showing the rows shared by every variety. Pick a variety to add specific ones.'}
          </p>
        )}
      </div>

      {globalError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertTriangle size={15}/>{globalError}<button onClick={() => setGlobalError('')} className="ml-auto"><X size={15}/></button></div>}

      {!cropId ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FlaskConical size={40} className="mx-auto mb-3 text-gray-300"/>
          <p className="text-gray-500 font-medium">Select a commodity to start</p>
          <p className="text-sm text-gray-400 mt-1">Quality parameters and grading rules are defined per commodity, and refined per variety.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-5 shadow-sm w-fit">
            {[
              { id: 'parameters', label: 'Parameters',    icon: <Ruler size={15}/>, count: parameters.length },
              { id: 'rules',      label: 'Grading rules', icon: <Award size={15}/>, count: grades.reduce((n, g) => n + (g.rules?.length || 0), 0) },
            ].map(({ id, label, icon, count }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                {icon} {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
              </button>
            ))}
          </div>

          {/* ── Parameters ─────────────────────────────────────────────────── */}
          {tab === 'parameters' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button onClick={openParamCreate} className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"><Plus size={15}/> New Parameter</button>
              </div>
              {parameters.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Ruler size={40} className="mx-auto mb-3 text-gray-300"/>
                  <p className="text-gray-500 font-medium">No quality parameters yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add what the warehouse measures on delivery: moisture content, purity, defects…</p>
                </div>
              ) : parameters.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all p-4 sm:p-5 ${p.is_active ? '' : 'opacity-60'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 flex-shrink-0"><Ruler size={16}/></div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                          {p.name}
                          {p.unit && <span className="text-xs font-mono text-gray-500">({p.unit})</span>}
                          <ScopeBadge varietyName={p.variety_name}/>
                          {p.is_required && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Required</span>}
                          {!p.is_active && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.value_type === 'number'
                            ? `Number${p.min_value != null || p.max_value != null ? ` · accepted ${p.min_value ?? '−∞'} to ${p.max_value ?? '+∞'}` : ''}`
                            : p.value_type === 'choice' ? `Choice: ${(p.options ?? []).join(', ')}` : 'Yes / No'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openParamEdit(p)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors"><Edit2 size={12}/> Edit</button>
                      <button onClick={() => deleteParam(p)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors"><Trash2 size={12}/> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Rules + tester ─────────────────────────────────────────────── */}
          {tab === 'rules' && (
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-3">
                {grades.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <Award size={40} className="mx-auto mb-3 text-gray-300"/>
                    <p className="text-gray-500 font-medium">No grades for this selection</p>
                    <p className="text-sm text-gray-400 mt-1">Create grades in the Grade Manager first, then set their rules here.</p>
                  </div>
                ) : grades.map(g => (
                  <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">{g.grade_value?.[0]?.toUpperCase() || 'G'}</span>
                        <div>
                          <h3 className="font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                            Grade {g.grade_value}
                            <ScopeBadge varietyName={g.variety_name}/>
                          </h3>
                          <p className="text-xs text-gray-400">Priority {g.sort_order ?? 0} · lower is checked first</p>
                        </div>
                      </div>
                      <button onClick={() => openRuleCreate(g.id)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200 transition-colors"><Plus size={12}/> Add rule</button>
                    </div>
                    {(!g.rules || g.rules.length === 0) ? (
                      <p className="text-sm text-gray-400 italic">No rule yet — this grade is never assigned automatically.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {g.rules.map(rule => (
                          <li key={rule.id} className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700">{ruleText(rule, parameters)}</span>
                            <span className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => openRuleEdit(rule)} className="text-xs text-yellow-700 hover:underline">Edit</button>
                              <button onClick={() => deleteRule(rule)} className="text-xs text-red-600 hover:underline">Remove</button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-fit lg:sticky lg:top-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-1"><PlayCircle size={18} className="text-violet-600"/> Test the rules</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Enter values as a warehouse operator would{scopeLabel ? `, for ${scopeLabel}` : ''}, and see the resulting grade.
                </p>

                {activeParams.length === 0 ? (
                  <p className="text-sm text-gray-400">Add active parameters first.</p>
                ) : (
                  <div className="space-y-3">
                    {activeParams.map(p => (
                      <Field key={p.id} label={`${p.name}${p.unit ? ` (${p.unit})` : ''}`}>
                        {p.value_type === 'number' ? (
                          <input type="number" step="any" value={testValues[p.id] ?? ''}
                            onChange={e => setTestValues(v => ({ ...v, [p.id]: e.target.value }))} className={inputCls(false)}/>
                        ) : (
                          <select value={testValues[p.id] ?? ''} onChange={e => setTestValues(v => ({ ...v, [p.id]: e.target.value }))} className={inputCls(false)}>
                            <option value="">—</option>
                            {(p.value_type === 'boolean' ? ['yes', 'no'] : (p.options ?? [])).map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                      </Field>
                    ))}
                    <button onClick={runTest} disabled={testing}
                      className={`w-full px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 ${testing ? 'bg-violet-400' : 'bg-violet-600 hover:bg-violet-700'}`}>
                      {testing ? <><Loader2 size={15} className="animate-spin"/> Checking…</> : <><PlayCircle size={15}/> Evaluate</>}
                    </button>
                  </div>
                )}

                {testResult && (
                  <div className={`mt-4 rounded-xl border p-3 text-sm ${testResult.accepted ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    <p className="font-semibold flex items-center gap-1.5">
                      {testResult.accepted ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
                      {testResult.accepted
                        ? (testResult.grade ? `Accepted — Grade ${testResult.grade.grade_value}` : 'Accepted — no grade matched')
                        : 'Rejected'}
                    </p>
                    {(testResult.errors ?? []).map((e, i) => <p key={i} className="text-xs mt-1">• {e}</p>)}
                    {(testResult.notes ?? []).map((n, i) => <p key={i} className="text-xs mt-1 opacity-80">• {n}</p>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Drawer ───────────────────────────────────────────────────────────── */}
      {drawer && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out light-panel ${drawer ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {editingId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-violet-600"/>}
            {drawer === 'param'
              ? (editingId ? 'Edit Parameter' : 'New Parameter')
              : (editingId ? 'Edit Rule' : 'New Rule')}
          </h2>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {drawer === 'param' && (
            <>
              <Field label="Applies to"
                hint="All varieties, or only one of them">
                <select value={paramForm.variety_id}
                  onChange={e => setParamForm({ ...paramForm, variety_id: e.target.value })}
                  className={inputCls(false)}>
                  <option value="">All varieties of this commodity</option>
                  {varieties.map(v => <option key={v.id} value={v.id}>{v.name} only</option>)}
                </select>
              </Field>

              <Field label="Parameter Name" required error={errors.name}>
                <input type="text" placeholder="e.g. Moisture content" value={paramForm.name}
                  onChange={e => setParamForm({ ...paramForm, name: e.target.value })} className={inputCls(errors.name)}/>
              </Field>

              <Field label="Value Type" required hint={VALUE_TYPES.find(v => v.value === paramForm.value_type)?.hint}>
                <div className="grid grid-cols-3 gap-2">
                  {VALUE_TYPES.map(v => (
                    <button key={v.value} type="button" onClick={() => setParamForm({ ...paramForm, value_type: v.value })}
                      className={`px-2 py-2 rounded-xl border text-xs font-medium transition-colors ${paramForm.value_type === v.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </Field>

              {paramForm.value_type === 'number' && (
                <>
                  <Field label="Unit" hint="Shown next to the value, e.g. %, kg, count">
                    <input type="text" placeholder="e.g. %" value={paramForm.unit}
                      onChange={e => setParamForm({ ...paramForm, unit: e.target.value })} className={inputCls(false)}/>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Accepted min">
                      <input type="number" step="any" value={paramForm.min_value}
                        onChange={e => setParamForm({ ...paramForm, min_value: e.target.value })} className={inputCls(false)}/>
                    </Field>
                    <Field label="Accepted max">
                      <input type="number" step="any" value={paramForm.max_value}
                        onChange={e => setParamForm({ ...paramForm, max_value: e.target.value })} className={inputCls(false)}/>
                    </Field>
                  </div>
                  <p className="text-xs text-gray-400 -mt-2">Outside this range the delivery is rejected at reception. Leave empty for no limit.</p>
                </>
              )}

              {paramForm.value_type === 'choice' && (
                <Field label="Options" required error={errors.options} hint="Separate the options with commas">
                  <input type="text" placeholder="Washed, Natural, Honey" value={paramForm.options}
                    onChange={e => setParamForm({ ...paramForm, options: e.target.value })} className={inputCls(errors.options)}/>
                </Field>
              )}

              <Field label="Display order" hint="Lower numbers appear first on the reception form">
                <input type="number" value={paramForm.position}
                  onChange={e => setParamForm({ ...paramForm, position: e.target.value })} className={inputCls(false)}/>
              </Field>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                  <input type="checkbox" checked={paramForm.is_required}
                    onChange={e => setParamForm({ ...paramForm, is_required: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"/>
                  Required at reception
                </label>
                <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                  <input type="checkbox" checked={paramForm.is_active}
                    onChange={e => setParamForm({ ...paramForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"/>
                  Active
                </label>
              </div>
            </>
          )}

          {drawer === 'rule' && (
            <>
              <Field label="Grade" required>
                <select value={ruleForm.grade_id}
                  onChange={e => setRuleForm({ ...ruleForm, grade_id: e.target.value, parameter_id: '' })}
                  className={inputCls(false)}>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>
                      Grade {g.grade_value}{g.variety_name ? ` (${g.variety_name})` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Parameter" required error={errors.parameter_id}
                hint={ruleGrade && !ruleGrade.variety_id
                  ? 'A commodity-wide grade can only use parameters shared by every variety'
                  : undefined}>
                <select value={ruleForm.parameter_id}
                  onChange={e => setRuleForm({ ...ruleForm, parameter_id: e.target.value, expected_value: '' })}
                  className={inputCls(errors.parameter_id)}>
                  <option value="">Select parameter</option>
                  {selectableParams.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.variety_name ? ` (${p.variety_name})` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              {ruleParam?.value_type === 'number' ? (
                <>
                  <Field label="Condition" required>
                    <select value={ruleForm.operator} onChange={e => setRuleForm({ ...ruleForm, operator: e.target.value })} className={inputCls(false)}>
                      {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  {(ruleForm.operator === 'gte' || ruleForm.operator === 'eq' || ruleForm.operator === 'between') && (
                    <Field label={ruleForm.operator === 'between' ? 'From' : 'Value'} required>
                      <input type="number" step="any" value={ruleForm.min_value}
                        onChange={e => setRuleForm({ ...ruleForm, min_value: e.target.value })} className={inputCls(false)}/>
                    </Field>
                  )}
                  {(ruleForm.operator === 'lte' || ruleForm.operator === 'between') && (
                    <Field label={ruleForm.operator === 'between' ? 'To' : 'Value'} required>
                      <input type="number" step="any" value={ruleForm.max_value}
                        onChange={e => setRuleForm({ ...ruleForm, max_value: e.target.value })} className={inputCls(false)}/>
                    </Field>
                  )}
                </>
              ) : ruleParam ? (
                <Field label="Expected value" required>
                  <select value={ruleForm.expected_value}
                    onChange={e => setRuleForm({ ...ruleForm, expected_value: e.target.value, operator: 'eq' })} className={inputCls(false)}>
                    <option value="">Select</option>
                    {(ruleParam.value_type === 'boolean' ? ['yes', 'no'] : (ruleParam.options ?? [])).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              ) : null}
            </>
          )}
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
          <button onClick={drawer === 'param' ? submitParam : submitRule} disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 shadow-sm'}`}>
            {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving…</> : <><Check size={15}/> {editingId ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityManager;