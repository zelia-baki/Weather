import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import { PERMISSIONS_CONFIG, DEFAULT_PERMISSIONS } from './permissionsConfig';

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
      transition-colors duration-200 focus:outline-none
      ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
      ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username:        '',
    email:           '',
    phonenumber:     '',
    user_type:       'farmer',
    is_admin:        false,
    has_access_wbii: false,
    password:        '',
    permissions:     { ...DEFAULT_PERMISSIONS },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePermissionToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const setAllPermissions = (value) => {
    setFormData((prev) => ({
      ...prev,
      permissions: Object.fromEntries(PERMISSIONS_CONFIG.map((p) => [p.key, value])),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/users/create', formData);
      Swal.fire({
        title: 'Utilisateur créé !',
        text: `${formData.username} a été créé avec succès.`,
        icon: 'success',
        confirmButtonText: 'OK',
      });
      setFormData({
        username: '', email: '', phonenumber: '', user_type: 'farmer',
        is_admin: false, has_access_wbii: false, password: '',
        permissions: { ...DEFAULT_PERMISSIONS },
      });
    } catch (err) {
      Swal.fire({
        title: 'Erreur',
        text: err.response?.data?.message || 'Une erreur est survenue.',
        icon: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-5 text-center text-gray-800">Créer un utilisateur</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phonenumber" value={formData.phonenumber} onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <select name="user_type" value={formData.user_type} onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required>
                <option value="farmer">Farmer</option>
                <option value="forest">Forest</option>
                <option value="weather">Weather</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" name="is_admin" checked={formData.is_admin} onChange={handleChange}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Administrator</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" name="has_access_wbii" checked={formData.has_access_wbii} onChange={handleChange}
                  className="w-4 h-4 accent-purple-600" />
                <span className="text-sm font-medium text-purple-800">WBII Access</span>
              </label>
            </div>
          </div>

          {/* ── Permissions modulaires ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Module Permissions</h4>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAllPermissions(true)}
                  className="text-xs text-green-600 hover:underline font-medium">
                  Tout activer
                </button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setAllPermissions(false)}
                  className="text-xs text-red-500 hover:underline font-medium">
                  Tout désactiver
                </button>
              </div>
            </div>

            <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              {PERMISSIONS_CONFIG.map(({ key, label, Icon, description }) => (
                <div key={key}
                  onClick={() => handlePermissionToggle(key)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer select-none ${
                    formData.permissions[key] ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      formData.permissions[key] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </div>
                  <Toggle checked={formData.permissions[key]} onToggle={() => handlePermissionToggle(key)} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button"
              onClick={() => setFormData({
                username: '', email: '', phonenumber: '', user_type: 'farmer',
                is_admin: false, has_access_wbii: false, password: '',
                permissions: { ...DEFAULT_PERMISSIONS },
              })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-5 rounded-lg transition text-sm">
              Réinitialiser
            </button>
            <button type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg transition text-sm">
              Créer l'utilisateur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;