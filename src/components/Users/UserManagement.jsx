import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import { PERMISSIONS_CONFIG, DEFAULT_PERMISSIONS } from './permissionsConfig';

// ─── Toggle switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400
      ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
        ${checked ? 'translate-x-4' : 'translate-x-0'}`}
    />
  </button>
);

// ─── Modal rapide de gestion des permissions ──────────────────────────────────
const PermissionsModal = ({ user, onClose, onToggle }) => {
  if (!user) return null;
  const perms = user.permissions || {};
  const enabledCount = PERMISSIONS_CONFIG.filter((p) => perms[p.key]).length;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60] bg-black bg-opacity-60"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              Permissions — <span className="text-green-700">{user.username}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {enabledCount} module{enabledCount !== 1 ? 's' : ''} activé{enabledCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            ×
          </button>
        </div>

        {/* Permission list */}
        <div className="p-4 space-y-2">
          {PERMISSIONS_CONFIG.map(({ key, label, Icon, description }) => {
            const enabled = !!perms[key];
            return (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  enabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${enabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                  </div>
                </div>
                <Toggle checked={enabled} onToggle={() => onToggle(user, key)} />
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// UserManagement
// ═════════════════════════════════════════════════════════════════════════════
const UserManagement = () => {
  const [users, setUsers]         = useState([]);
  const [userForm, setUserForm]   = useState({
    username: '', email: '', password: '', phonenumber: '',
    company_name: '', user_type: '', is_admin: false,
    has_access_wbii: false, permissions: { ...DEFAULT_PERMISSIONS },
  });
  const [editing, setEditing]         = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permTarget, setPermTarget]   = useState(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const { data } = await axiosInstance.get('/api/users/');
      setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (key) => {
    setUserForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] },
    }));
  };

  const setAllPermissions = (value) => {
    setUserForm((prev) => ({
      ...prev,
      permissions: Object.fromEntries(PERMISSIONS_CONFIG.map((p) => [p.key, value])),
    }));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axiosInstance.put(`/api/users/${editingId}/edit`, userForm);
      } else {
        await axiosInstance.post('/api/users/create', userForm);
      }
      resetForm();
      Swal.fire({
        title: 'Success!',
        text: editing ? 'User updated successfully!' : 'User created successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      fetchUsers();
    } catch (err) {
      console.error('Submit error:', err);
      Swal.fire({ title: 'Error', text: 'Something went wrong.', icon: 'error' });
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?', text: 'This action cannot be undone!',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Delete', cancelButtonText: 'Cancel',
    });
    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/users/${userId}/delete`);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        Swal.fire({ title: 'Deleted!', icon: 'success' });
      } catch (err) { console.error(err); }
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────
  const handleEditClick = (user) => {
    setEditing(true);
    setEditingId(user.id);
    setUserForm({
      username:        user.username,
      email:           user.email,
      password:        '',
      phonenumber:     user.phonenumber    || '',
      company_name:    user.company_name   || '',
      user_type:       user.user_type,
      is_admin:        user.is_admin,
      has_access_wbii: user.has_access_wbii || false,
      permissions:     { ...DEFAULT_PERMISSIONS, ...(user.permissions || {}) },
    });
    setIsModalOpen(true);
  };

  // ─── Quick WBII toggle ────────────────────────────────────────────────────
  const handleToggleWbii = async (user) => {
    const newValue = !user.has_access_wbii;
    try {
      await axiosInstance.put(`/api/users/${user.id}/edit`, { ...user, has_access_wbii: newValue });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, has_access_wbii: newValue } : u));
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: newValue ? `WBII activé pour ${user.username}` : `WBII désactivé pour ${user.username}`,
        showConfirmButton: false, timer: 2500, timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not update WBII access.', icon: 'error' });
    }
  };

  // ─── Quick permission toggle ──────────────────────────────────────────────
  const handleQuickPermToggle = async (user, key) => {
    const current  = user.permissions || {};
    const newPerms = { ...DEFAULT_PERMISSIONS, ...current, [key]: !current[key] };
    try {
      await axiosInstance.patch(`/api/users/${user.id}/update-permissions`, { permissions: newPerms });
      const updatedUser = { ...user, permissions: newPerms };
      setUsers((prev) => prev.map((u) => u.id === user.id ? updatedUser : u));
      setPermTarget(updatedUser);
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Could not update permissions.', icon: 'error' });
    }
  };

  // ─── Reset form ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditing(false);
    setEditingId(null);
    setUserForm({
      username: '', email: '', password: '', phonenumber: '',
      company_name: '', user_type: '', is_admin: false,
      has_access_wbii: false, permissions: { ...DEFAULT_PERMISSIONS },
    });
    setIsModalOpen(false);
  };

  const countEnabled = (user) =>
    PERMISSIONS_CONFIG.filter((p) => (user.permissions || {})[p.key]).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">User Management</h2>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
      >
        + Create User
      </button>

      {/* ── Modal créer / modifier ──────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[500px] max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-5 text-gray-800">
              {editing ? 'Edit User' : 'Create User'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input type="text" name="username" placeholder="Username"
                  value={userForm.username} onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-2" required />
                <input type="email" name="email" placeholder="Email"
                  value={userForm.email} onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-2" required />
                <input type="password" name="password"
                  placeholder={editing ? 'New password (leave blank to keep)' : 'Password'}
                  value={userForm.password} onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required={!editing} />
                <input type="text" name="phonenumber" placeholder="Phone Number"
                  value={userForm.phonenumber} onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400" required />
                <input type="text" name="company_name" placeholder="Company Name"
                  value={userForm.company_name} onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-2" />
                <select name="user_type" value={userForm.user_type} onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 col-span-2" required>
                  <option value="">Select User Type</option>
                  <option value="farmer">Farmer</option>
                  <option value="forest">Forest</option>
                  <option value="weather">Weather</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* is_admin */}
              <label className="flex items-center mb-3 gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={userForm.is_admin}
                  onChange={(e) => setUserForm((p) => ({ ...p, is_admin: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Administrator</span>
              </label>

              {/* WBII */}
              <label className="flex items-center mb-4 gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer hover:bg-purple-100 transition select-none">
                <input type="checkbox" checked={userForm.has_access_wbii}
                  onChange={(e) => setUserForm((p) => ({ ...p, has_access_wbii: e.target.checked }))}
                  className="w-4 h-4 accent-purple-600" />
                <span className="text-sm font-semibold text-purple-800">WBII Module Access</span>
              </label>

              {/* ── Module Permissions ──────────────────────────────────────── */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Module Permissions</h4>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAllPermissions(true)}
                      className="text-xs text-green-600 hover:text-green-800 hover:underline font-medium">
                      Tout activer
                    </button>
                    <span className="text-gray-300">|</span>
                    <button type="button" onClick={() => setAllPermissions(false)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium">
                      Tout désactiver
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  {PERMISSIONS_CONFIG.map(({ key, label, Icon, description }) => (
                    <div key={key}
                      onClick={() => handlePermissionToggle(key)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer select-none ${
                        userForm.permissions[key] ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                          userForm.permissions[key] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon size={15} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{label}</p>
                          <p className="text-xs text-gray-400">{description}</p>
                        </div>
                      </div>
                      <Toggle checked={userForm.permissions[key]} onToggle={() => handlePermissionToggle(key)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={resetForm}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
                  {editing ? 'Annuler' : 'Fermer'}
                </button>
                <button type="submit"
                  className="bg-blue-500 text-white py-2 px-5 rounded-lg hover:bg-blue-600 transition text-sm font-semibold">
                  {editing ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Permissions Modal ─────────────────────────────────────────── */}
      <PermissionsModal
        user={permTarget}
        onClose={() => setPermTarget(null)}
        onToggle={handleQuickPermToggle}
      />

      {/* ── Liste des utilisateurs ──────────────────────────────────────────── */}
      <ul className="space-y-3 mt-6">
        {users.filter(Boolean).map((user) => {
          const enabled = countEnabled(user);
          return (
            <li key={user.id} className="border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start flex-wrap gap-3">

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <strong className="text-base font-bold text-blue-600">{user.username}</strong>
                    {user.is_admin && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">Admin</span>
                    )}
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full capitalize">{user.user_type}</span>
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.company_name && <p className="text-xs text-gray-400 italic mt-0.5">{user.company_name}</p>}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      user.has_access_wbii
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                      WBII
                    </span>
                    {PERMISSIONS_CONFIG.map(({ key, label, Icon }) =>
                      (user.permissions || {})[key] ? (
                        <span key={key} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          <Icon size={11} /> {label}
                        </span>
                      ) : null
                    )}
                    {enabled === 0 && !user.has_access_wbii && (
                      <span className="text-xs text-gray-400 italic">Aucun module activé</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => handleToggleWbii(user)}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition duration-200 ${
                      user.has_access_wbii
                        ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                        : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                    }`}>
                    {user.has_access_wbii ? 'WBII ON' : 'WBII OFF'}
                  </button>

                  <button onClick={() => setPermTarget(user)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition duration-200">
                    Permissions
                    {enabled > 0 && (
                      <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{enabled}</span>
                    )}
                  </button>

                  <button onClick={() => handleEditClick(user)}
                    className="bg-yellow-500 text-white py-1.5 px-3 rounded-lg hover:bg-yellow-600 transition text-xs font-semibold">
                    Edit
                  </button>

                  <button onClick={() => handleDelete(user.id)}
                    className="bg-red-500 text-white py-1.5 px-3 rounded-lg hover:bg-red-600 transition text-xs font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UserManagement;