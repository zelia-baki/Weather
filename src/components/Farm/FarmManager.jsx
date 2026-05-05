import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

const FarmComponent = () => {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [countriesList, setCountriesList] = useState([]);
  const [formData, setFormData] = useState({
    name: '', subcounty: '', district_id: '', parishe: '',
    village: '', farmergroup_id: '', geolocation: '',
    phonenumber1: '', phonenumber2: '', gender: '', cin: '',
  });
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [districts, setDistricts]         = useState([]);
  const [farmerGroups, setFarmerGroups]   = useState([]);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [error, setError]                 = useState('');
  const [csvFile, setCsvFile]             = useState(null);
  const [search, setSearch]               = useState('');

  useEffect(() => {
    fetchFarms(currentPage);
    fetchDistricts();
    fetchFarmerGroups();
    fetchCountryList();
  }, [currentPage]);

  const fetchFarms        = async (page) => {
    try {
      const r = await axiosInstance.get(`/api/farm/?page=${page}`);
      setFarms(r.data.farms); setTotalPages(r.data.total_pages);
      if (r.data.farms?.length > 0) {
        console.log('[FarmManager] Fields:', Object.keys(r.data.farms[0]));
        console.log('[FarmManager] Farm[0]:', r.data.farms[0]);
      }
    } catch { setError('Error fetching farms.'); }
  };
  const fetchDistricts    = async () => {
    try { const r = await axiosInstance.get('/api/district/'); setDistricts(r.data.districts); } catch {}
  };
  const fetchFarmerGroups = async () => {
    try { const r = await axiosInstance.get('/api/farmergroup/'); setFarmerGroups(r.data); } catch {}
  };
  const fetchCountryList  = async () => {
    try { const r = await axiosInstance.get('/api/pays/'); setCountriesList(r.data.pays); } catch {}
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentFarmId) await axiosInstance.post(`/api/farm/${currentFarmId}/update`, formData);
      else                await axiosInstance.post('/api/farm/create', formData);
      fetchFarms(currentPage); resetForm(); setIsModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Saved!', text: 'Farm has been saved.', timer: 1500, showConfirmButton: false });
    } catch { Swal.fire('Error!', 'Could not save farm.', 'error'); }
  };

  const handleEdit = (farm) => {
    setFormData({
      name: farm.name, subcounty: farm.subcounty, parishe: farm.parishe,
      village: farm.village, district_id: farm.district_id,
      farmergroup_id: farm.farmergroup_id, geolocation: farm.geolocation,
      phonenumber1: farm.phonenumber1, phonenumber2: farm.phonenumber2,
      gender: farm.gender, cin: farm.cin,
    });
    setCurrentFarmId(farm.id); setIsModalOpen(true);
  };

  const handleDelete = async (farmId) => {
    const r = await Swal.fire({
      title: 'Delete farm?', text: "This can't be undone.", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Delete',
    });
    if (r.isConfirmed) {
      try {
        await axiosInstance.post(`/api/farm/${farmId}/delete`);
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        fetchFarms(currentPage);
      } catch { setError('Error deleting farm.'); }
    }
  };

  const resetForm = () => {
    setFormData({ name:'',subcounty:'',district_id:'',parishe:'',village:'',
                  farmergroup_id:'',geolocation:'',phonenumber1:'',phonenumber2:'',gender:'',cin:'' });
    setCurrentFarmId(null);
  };

  const handleBulkUpload = async () => {
    if (!csvFile) { Swal.fire('Error!', 'Please select a CSV file.', 'error'); return; }
    Papa.parse(csvFile, {
      header: true, skipEmptyLines: true,
      complete: async (result) => {
        if (result.errors.length) { Swal.fire('Error!', 'Invalid CSV format.', 'error'); return; }
        try {
          await axiosInstance.post('/api/farm/bulk_create', result.data);
          Swal.fire('Success!', 'Farmers uploaded!', 'success');
          fetchFarms(currentPage);
        } catch (err) {
          Swal.fire('Error!', err.response?.data?.message || 'Upload failed.', 'error');
        }
      },
    });
  };

  const filtered = farms.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.subcounty?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Action buttons config ─────────────────────────────
  const farmActions = (farm) => [
    { label: '🗺 Map',          to: '/mapview',        state: { owner_id: farm.id, owner_type: 'farmer', geolocation: farm.geolocation }, color: 'blue' },
    { label: '✏️ Draw',         to: '/mapbox',         state: { owner_id: farm.id, owner_type: 'farmer', geolocation: farm.geolocation }, color: 'purple' },
    { label: '📋 Farm Data',    to: '/farmdatamanager',state: { farmId: farm.id }, color: 'green' },
    { label: '📊 GFW Report',   to: '/reportfarmer',   state: { farmId: farm.id }, color: 'orange' },
    { label: '🌿 Carbon',       to: '/reportcarbon',   state: { farmId: farm.id }, color: 'teal' },
    { label: '🛰️ Sentinel',
      to: `/sentinel/farm/${farm.id}`,
      state: { farmId: farm.id },
      color: 'indigo' },
  ];

  const colorMap = {
    blue:   'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200',
    green:  'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200',
    teal:   'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200',
    indigo: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200',
    red:    'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
  };

  const InputField = ({ label, name, type='text', placeholder, required=false, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children || (
        <input
          type={type} name={name} placeholder={placeholder}
          value={formData[name]} onChange={handleChange} required={required}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none
                     focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 p-4 sm:p-6">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🌱 Farm Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">{farms.length} farms registered</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/mapviewall" state={{ owner_type: 'farmer' }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white
                         text-sm px-4 py-2 rounded-lg transition-colors font-medium">
              🗺 View All
            </Link>
            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white
                         text-sm px-4 py-2 rounded-lg transition-colors font-medium">
              + Create Farm
            </button>
          </div>
        </div>

        {/* Compliance badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-center">
            Certificates:
          </span>
          {[
            { label: 'All',           state: 'all',            color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
            { label: '✅ Compliant',  state: 'compliant',      color: 'bg-green-100 text-green-700 hover:bg-green-200' },
            { label: '⚠️ Likely',     state: 'likely_compliant',color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
            { label: '❌ Not Compliant',state:'not_compliant',  color: 'bg-red-100 text-red-700 hover:bg-red-200' },
          ].map(({ label, state, color }) => (
            <Link key={state} to="/stats-certificate" state={{ certificateType: state }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${color}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Search + CSV ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text" placeholder="Search farms..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files[0])}
            className="hidden" id="csvUpload" />
          <label htmlFor="csvUpload"
            className="cursor-pointer flex items-center gap-1.5 border border-gray-200 bg-white
                       hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-lg transition-colors">
            📁 {csvFile ? csvFile.name.substring(0,15)+'...' : 'Select CSV'}
          </label>
          <button onClick={handleBulkUpload}
            className="bg-gray-700 hover:bg-gray-800 text-white text-sm px-4 py-2
                       rounded-lg transition-colors font-medium">
            ⬆ Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* ── Farm List ── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">🌾</div>
            <p className="text-gray-500">No farms found</p>
          </div>
        ) : filtered.map((farm) => (
          <div key={farm.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm
                       hover:shadow-md hover:border-green-200 transition-all p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">

              {/* ── Farm info ── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center
                                  justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                    {farm.name?.[0]?.toUpperCase() || 'F'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{farm.name}</h3>
                    <p className="text-xs text-gray-400">{farm.id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {farm.subcounty && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      📍 {farm.subcounty}
                    </span>
                  )}
                  {farm.phonenumber && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      📞 {farm.phonenumber}
                    </span>
                  )}
                  {farm.gender && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {farm.gender}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Action buttons ── */}
              <div className="flex flex-wrap gap-1.5 sm:justify-end">
                {farmActions(farm).map(({ label, to, state, color }) => (
                  <Link key={label} to={to} state={state}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border
                                transition-colors ${colorMap[color]}`}>
                    {label}
                  </Link>
                ))}
                <button onClick={() => handleEdit(farm)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border
                             bg-yellow-50 text-yellow-700 hover:bg-yellow-100
                             border-yellow-200 transition-colors">
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(farm.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border
                             bg-red-50 text-red-700 hover:bg-red-100
                             border-red-200 transition-colors">
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between mt-6 bg-white rounded-2xl
                      border border-gray-100 shadow-sm px-5 py-3">
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))}
          disabled={currentPage === 1}
          className="text-sm font-medium text-gray-600 hover:text-gray-800
                     disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          ← Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const page = i + 1;
            return (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {page}
              </button>
            );
          })}
          {totalPages > 7 && <span className="text-gray-400 text-sm px-1">…{totalPages}</span>}
        </div>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
          disabled={currentPage === totalPages}
          className="text-sm font-medium text-gray-600 hover:text-gray-800
                     disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          Next →
        </button>
      </div>

      {/* ── Modal Create / Edit ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                        bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4
                            border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {currentFarmId ? '✏️ Update Farm' : '🌱 Create Farm'}
              </h2>
              <button onClick={() => { resetForm(); setIsModalOpen(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-full
                           hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <InputField label="Farm Name" name="name" placeholder="Enter farm name" required />

                <InputField label="Destination Country" name="subcounty" required>
                  <select name="subcounty" value={formData.subcounty} onChange={handleChange} required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:ring-2 focus:ring-green-400 focus:border-transparent">
                    <option value="">Select Country</option>
                    {countriesList.map(c => (
                      <option key={c.nom_en_gb} value={c.nom_en_gb}>{c.nom_en_gb} / {c.nom_fr_fr}</option>
                    ))}
                  </select>
                </InputField>

                <InputField label="Parish" name="parishe" placeholder="Enter parish" />
                <InputField label="Village" name="village" placeholder="Enter village" required />

                <InputField label="District" name="district_id">
                  <select name="district_id" value={formData.district_id} onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:ring-2 focus:ring-green-400">
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </InputField>

                <InputField label="Farmer Group" name="farmergroup_id">
                  <select name="farmergroup_id" value={formData.farmergroup_id} onChange={handleChange} required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:ring-2 focus:ring-green-400">
                    <option value="">Select Group</option>
                    {farmerGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </InputField>

                <div className="sm:col-span-2">
                  <InputField label="Geolocation (lat, lon)" name="geolocation"
                    placeholder="0.3136, 32.5811" required />
                </div>

                <InputField label="Phone Number 1" name="phonenumber1" placeholder="+256..." />
                <InputField label="Phone Number 2" name="phonenumber2" placeholder="+256..." />

                <InputField label="Gender" name="gender">
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none
                               focus:ring-2 focus:ring-green-400">
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </InputField>

                <InputField label="National ID" name="cin" placeholder="Enter NIN" />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { resetForm(); setIsModalOpen(false); }}
                  className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600
                             hover:bg-gray-50 text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700
                             text-white text-sm font-semibold transition-colors">
                  {currentFarmId ? 'Update Farm' : 'Create Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmComponent;