import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import {
  Sprout, Search, Map, PenLine, ClipboardList, BarChart2,
  Leaf, Radio, Trash2, Plus, Edit2, Upload, FolderOpen,
  ChevronLeft, ChevronRight, AlertTriangle, X, Check,
  Loader2, Wheat, Award,
} from 'lucide-react';

const EMPTY_FORM = {
  name: '', subcounty: '', district_id: '', farmergroup_id: '',
  geolocation: '', phonenumber1: '', phonenumber2: '', gender: '', cin: '',
};

const inputCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800 placeholder-gray-400
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-emerald-400 hover:border-gray-300'}`;

const selectCls = (err) =>
  `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none
   bg-white text-gray-800
   focus:ring-2 focus:border-transparent
   ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-emerald-400 hover:border-gray-300'}`;

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {label}{required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
  </div>
);

const FarmManager = () => {
  const [farms,         setFarms]         = useState([]);
  const [countriesList, setCountriesList] = useState([]);
  const [districts,     setDistricts]     = useState([]);
  const [farmerGroups,  setFarmerGroups]  = useState([]);
  const [formData,      setFormData]      = useState(EMPTY_FORM);
  const [formErrors,    setFormErrors]    = useState({});
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalFarms,    setTotalFarms]    = useState(0);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [globalError,   setGlobalError]   = useState('');
  const [csvFile,       setCsvFile]       = useState(null);
  const [search,        setSearch]        = useState('');
  const [searching,     setSearching]     = useState(false);
  const searchTimer = useRef(null);

  const fetchFarms = useCallback(async (page, searchTerm = '') => {
    try {
      const params = new URLSearchParams({ page });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const r = await axiosInstance.get(`/api/farm/?${params}`);
      setFarms(r.data.farms ?? []);
      setTotalPages(r.data.total_pages ?? 1);
      setTotalFarms(r.data.total_farms ?? r.data.farms?.length ?? 0);
    } catch { setGlobalError('Error fetching farms.'); }
    finally  { setSearching(false); }
  }, []);

  useEffect(() => {
    fetchFarms(currentPage, search);
    axiosInstance.get('/api/district/').then(r => setDistricts(r.data.districts ?? [])).catch(() => {});
    axiosInstance.get('/api/farmergroup/').then(r => setFarmerGroups(r.data ?? [])).catch(() => {});
    axiosInstance.get('/api/pays/').then(r => setCountriesList(r.data.pays ?? [])).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSearching(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setCurrentPage(1); fetchFarms(1, val); }, 400);
  };
  const clearSearch = () => { setSearch(''); setCurrentPage(1); fetchFarms(1, ''); };

  const validate = () => {
    const e = {};
    if (!formData.name.trim())        e.name           = 'Farm name is required';
    if (!formData.subcounty)          e.subcounty      = 'Destination country is required';
    if (!formData.district_id)        e.district_id    = 'District is required';
    if (!formData.farmergroup_id)     e.farmergroup_id = 'Farmer group is required';
    if (!formData.geolocation.trim()) e.geolocation    = 'Geolocation is required';
    else {
      const parts = formData.geolocation.trim().split(',');
      if (parts.length !== 2 || parts.some(p => isNaN(parseFloat(p.trim()))))
        e.geolocation = 'Format: latitude, longitude  (e.g. 0.3136, 32.5811)';
    }
    if (!formData.gender)             e.gender = 'Gender is required';
    if (!formData.cin.trim())         e.cin    = 'National ID is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true); setFormErrors({});
    try {
      if (currentFarmId) await axiosInstance.post(`/api/farm/${currentFarmId}/update`, formData);
      else               await axiosInstance.post('/api/farm/create', formData);
      await fetchFarms(currentPage, search);
      closeDrawer();
      Swal.fire({ icon: 'success', title: currentFarmId ? 'Farm updated!' : 'Farm created!',
        text: `"${formData.name}" saved.`, timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.msg || err.message || 'Could not save.', customClass: { popup: 'rounded-2xl' } });
    } finally { setSubmitting(false); }
  };

  const handleEdit = (farm) => {
    setFormData({
      name: farm.name ?? '', subcounty: farm.subcounty ?? '', district_id: farm.district_id ?? '',
      farmergroup_id: farm.farmergroup_id ?? '', geolocation: farm.geolocation ?? '',
      phonenumber1: farm.phonenumber1 ?? farm.phonenumber ?? '', phonenumber2: farm.phonenumber2 ?? '',
      gender: farm.gender ?? '', cin: farm.cin ?? '',
    });
    setCurrentFarmId(farm.id); setFormErrors({}); setDrawerOpen(true);
  };

  const handleDelete = async (farmId, farmName) => {
    const r = await Swal.fire({ title: `Delete "${farmName}"?`, text: 'Cannot be undone.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' } });
    if (!r.isConfirmed) return;
    try {
      await axiosInstance.post(`/api/farm/${farmId}/delete`);
      await fetchFarms(currentPage, search);
    } catch { setGlobalError('Error deleting farm.'); }
  };

  const openDrawer  = () => { setFormData(EMPTY_FORM); setCurrentFarmId(null); setFormErrors({}); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setFormData(EMPTY_FORM); setCurrentFarmId(null); setFormErrors({}); };

  const handleBulkUpload = () => {
    if (!csvFile) { Swal.fire('Error!', 'Select a CSV file first.', 'error'); return; }
    Papa.parse(csvFile, { header: true, skipEmptyLines: true,
      complete: async (result) => {
        if (result.errors.length) { Swal.fire('Error!', 'Invalid CSV.', 'error'); return; }
        try {
          await axiosInstance.post('/api/farm/bulk_create', result.data);
          Swal.fire('Success!', 'Farms uploaded!', 'success');
          fetchFarms(currentPage, search);
        } catch (err) { Swal.fire('Error!', err.response?.data?.message || 'Upload failed.', 'error'); }
      },
    });
  };

  const farmActions = (farm) => [
    { icon: <Map size={12}/>,           label: 'Map',       to: '/mapview',         state: { owner_id: farm.id, owner_type: 'farmer', geolocation: farm.geolocation }, cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    { icon: <PenLine size={12}/>,       label: 'Draw',      to: '/mapbox',          state: { owner_id: farm.id, owner_type: 'farmer', geolocation: farm.geolocation }, cls: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
    { icon: <ClipboardList size={12}/>, label: 'Data',      to: '/farmdatamanager', state: { farmId: farm.id }, cls: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
    { icon: <BarChart2 size={12}/>,     label: 'EUDR Report',      to: '/reportfarmer',    state: { farmId: farm.id }, cls: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200' },
    { icon: <Leaf size={12}/>,          label: 'Carbon Report',    to: '/reportcarbon',    state: { farmId: farm.id }, cls: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
    { icon: <Radio size={12}/>,         label: 'SatIndex', to: `/sentinel/farm/${farm.id}`, state: { farmId: farm.id }, cls: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6 light-panel">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sprout size={22} className="text-emerald-600"/> Farm Management
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {search ? `${totalFarms} result${totalFarms !== 1 ? 's' : ''} for "${search}"`
                      : `${totalFarms} farm${totalFarms !== 1 ? 's' : ''} registered`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/mapviewall" state={{ owner_type: 'farmer' }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
              <Map size={15}/> View All
            </Link>
            <button onClick={openDrawer}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
              <Plus size={15}/> Create Farm
            </button>
          </div>
        </div>
        {/* Certificates */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-center flex items-center gap-1">
            <Award size={12}/> Certificates:
          </span>
          {[
            { label: 'All',           state: 'all',              cls: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
            { label: 'Compliant',     state: 'compliant',        cls: 'bg-green-100 text-green-700 hover:bg-green-200' },
            { label: 'Likely',        state: 'likely_compliant', cls: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
            { label: 'Non-Compliant', state: 'not_compliant',    cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
          ].map(({ label, state, cls }) => (
            <Link key={state} to="/stats-certificate" state={{ certificateType: state }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${cls}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Search + CSV */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {searching ? <Loader2 size={16} className="animate-spin text-emerald-500"/> : <Search size={16}/>}
          </span>
          <input type="text" placeholder="Search across all farms — name, location, NIN…"
            value={search} onChange={handleSearchChange}
            className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm
                       bg-white text-gray-800 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
          {search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16}/>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])} className="hidden" id="csvUpload"/>
          <label htmlFor="csvUpload"
            className="cursor-pointer inline-flex items-center gap-1.5 border border-gray-200 bg-white
                       hover:bg-gray-50 text-gray-600 text-sm px-4 py-2.5 rounded-xl transition-colors">
            <FolderOpen size={15}/> {csvFile ? csvFile.name.substring(0, 12) + '…' : 'CSV'}
          </label>
          <button onClick={handleBulkUpload}
            className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-colors">
            <Upload size={15}/> Upload
          </button>
        </div>
      </div>

      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertTriangle size={15}/> {globalError}
          <button onClick={() => setGlobalError('')} className="ml-auto text-red-400 hover:text-red-600"><X size={15}/></button>
        </div>
      )}

      {/* Farm list */}
      <div className="space-y-3">
        {farms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Wheat size={40} className="mx-auto mb-3 text-gray-300"/>
            <p className="text-gray-500 font-medium">No farms found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Create your first farm to get started'}
            </p>
            {!search && (
              <button onClick={openDrawer}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-5 py-2 rounded-xl font-medium transition-colors">
                <Plus size={15}/> Create Farm
              </button>
            )}
          </div>
        ) : farms.map((farm) => (
          <div key={farm.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {farm.name?.[0]?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 leading-tight">{farm.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{farm.id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 ml-12">
                  {farm.subcounty   && <span className="text-xs text-gray-500">{farm.subcounty}</span>}
                  {farm.phonenumber && <span className="text-xs text-gray-500">{farm.phonenumber}</span>}
                  {farm.gender      && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{farm.gender}</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {farmActions(farm).map(({ icon, label, to, state, cls }) => (
                  <Link key={label} to={to} state={state}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${cls}`}>
                    {icon} {label}
                  </Link>
                ))}
                <button onClick={() => handleEdit(farm)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                  <Edit2 size={12}/> Edit
                </button>
                <button onClick={() => handleDelete(farm.id, farm.name)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                  <Trash2 size={12}/> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16}/> Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {page}
              </button>
            ))}
            {totalPages > 7 && <span className="text-gray-400 text-sm px-1">…{totalPages}</span>}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
            Next <ChevronRight size={16}/>
          </button>
        </div>
      )}

      {/* Drawer backdrop */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDrawer}/>}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full z-50 w-full max-w-lg bg-white shadow-2xl
                       flex flex-col transition-transform duration-300 ease-out light-panel
                       ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {currentFarmId ? <Edit2 size={18} className="text-yellow-500"/> : <Plus size={18} className="text-emerald-600"/>}
              {currentFarmId ? 'Edit Farm' : 'New Farm'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentFarmId ? 'Update farm details below' : 'Fill in the details to register a new farm'}
            </p>
          </div>
          <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 1 — Identity */}
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">1</span>
              Farm Identity
            </p>
            <div className="space-y-4">
              <Field label="Farm Name" required error={formErrors.name}>
                <input type="text" placeholder="e.g. Namanya Farm" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputCls(formErrors.name)}/>
              </Field>
              <Field label="National ID (NIN)" required error={formErrors.cin}>
                <input type="text" placeholder="e.g. CM1234567890" value={formData.cin}
                  onChange={e => setFormData({ ...formData, cin: e.target.value })} className={inputCls(formErrors.cin)}/>
              </Field>
              <Field label="Gender" required error={formErrors.gender}>
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className={selectCls(formErrors.gender)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </Field>
            </div>
          </div>
          <div className="border-t border-gray-100"/>

          {/* 2 — Location */}
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">2</span>
              Location
            </p>
            <div className="space-y-4">
              <Field label="Destination Country" required error={formErrors.subcounty}>
                <select value={formData.subcounty} onChange={e => setFormData({ ...formData, subcounty: e.target.value })} className={selectCls(formErrors.subcounty)}>
                  <option value="">Select country</option>
                  {countriesList.map(c => <option key={c.nom_en_gb} value={c.nom_en_gb}>{c.nom_en_gb} / {c.nom_fr_fr}</option>)}
                </select>
              </Field>
              <Field label="District" required error={formErrors.district_id}>
                <select value={formData.district_id} onChange={e => setFormData({ ...formData, district_id: e.target.value })} className={selectCls(formErrors.district_id)}>
                  <option value="">Select district</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Geolocation" required error={formErrors.geolocation}>
                <input type="text" placeholder="latitude, longitude  →  0.3136, 32.5811"
                  value={formData.geolocation} onChange={e => setFormData({ ...formData, geolocation: e.target.value })}
                  className={inputCls(formErrors.geolocation)}/>
                <p className="text-xs text-gray-400">Format: <code className="bg-gray-100 px-1 rounded text-gray-600">lat, lon</code> — or use the Draw tool.</p>
              </Field>
            </div>
          </div>
          <div className="border-t border-gray-100"/>

          {/* 3 — Group & Contact */}
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold">3</span>
              Group & Contact
            </p>
            <div className="space-y-4">
              <Field label="Farmer Group" required error={formErrors.farmergroup_id}>
                <select value={formData.farmergroup_id} onChange={e => setFormData({ ...formData, farmergroup_id: e.target.value })} className={selectCls(formErrors.farmergroup_id)}>
                  <option value="">Select group</option>
                  {farmerGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone 1">
                  <input type="tel" placeholder="+256…" value={formData.phonenumber1}
                    onChange={e => setFormData({ ...formData, phonenumber1: e.target.value })} className={inputCls(false)}/>
                </Field>
                <Field label="Phone 2">
                  <input type="tel" placeholder="+256…" value={formData.phonenumber2}
                    onChange={e => setFormData({ ...formData, phonenumber2: e.target.value })} className={inputCls(false)}/>
                </Field>
              </div>
            </div>
          </div>
          <div className="h-4"/>
        </form>

        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
          <button type="button" onClick={closeDrawer}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${submitting ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
            {submitting
              ? <><Loader2 size={15} className="animate-spin"/> Saving…</>
              : <><Check size={15}/> {currentFarmId ? 'Update Farm' : 'Create Farm'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmManager;