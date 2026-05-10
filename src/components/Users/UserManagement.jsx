import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    phonenumber: '',
    company_name: '',
    user_type: '',
    is_admin: false,
    has_access_wbii: false,
  });
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Fetch all users ────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (e) => {
    setUserForm((prev) => ({ ...prev, is_admin: e.target.checked }));
  };

  const handleWbiiChange = (e) => {
    setUserForm((prev) => ({ ...prev, has_access_wbii: e.target.checked }));
  };

  // ─── Submit (create / update) ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const response = await axiosInstance.put(
          `/api/users/${editingId}/edit`,
          userForm
        );
        setUsers(users.map((u) => (u.id === editingId ? response.data.user ?? { ...u, ...userForm } : u)));
        setEditing(false);
        setEditingId(null);
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
    } catch (error) {
      console.error('Error creating/updating user:', error);
      Swal.fire({ title: 'Error', text: 'Something went wrong. Please try again.', icon: 'error' });
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/users/${userId}/delete`);
        setUsers(users.filter((u) => u.id !== userId));
        Swal.fire({ title: 'Deleted!', text: 'User deleted successfully.', icon: 'success' });
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // ─── Edit ────────────────────────────────────────────────────────────────────
  const handleEditClick = (user) => {
    setEditing(true);
    setEditingId(user.id);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      phonenumber: user.phonenumber,
      company_name: user.company_name || '',
      user_type: user.user_type,
      is_admin: user.is_admin,
      has_access_wbii: user.has_access_wbii || false,
    });
    setIsModalOpen(true);
  };

  // ─── Quick WBII toggle directly from the list ───────────────────────────────
  const handleToggleWbii = async (user) => {
    const newValue = !user.has_access_wbii;
    try {
      await axiosInstance.put(`/api/users/${user.id}/edit`, {
        ...user,
        has_access_wbii: newValue,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, has_access_wbii: newValue } : u))
      );
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: newValue
          ? `✅ WBII access enabled for ${user.username}`
          : `🔒 WBII access disabled for ${user.username}`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Error toggling WBII access:', error);
      Swal.fire({ title: 'Error', text: 'Could not update WBII access.', icon: 'error' });
    }
  };

  // ─── Reset form ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setEditing(false);
    setEditingId(null);
    setUserForm({
      username: '',
      email: '',
      password: '',
      phonenumber: '',
      company_name: '',
      user_type: '',
      is_admin: false,
      has_access_wbii: false,
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        User Management
      </h2>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
      >
        Create User
      </button>

      {/* ── Modal create / edit ───────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {editing ? 'Edit User' : 'Create User'}
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div className="mb-4">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={userForm.username}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              {/* Email */}
              <div className="mb-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <input
                  type="password"
                  name="password"
                  placeholder={editing ? 'New password (leave blank to keep current)' : 'Password'}
                  value={userForm.password}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required={!editing}
                />
              </div>

              {/* Phone */}
              <div className="mb-4">
                <input
                  type="text"
                  name="phonenumber"
                  placeholder="Phone Number"
                  value={userForm.phonenumber}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              {/* Company */}
              <div className="mb-4">
                <input
                  type="text"
                  name="company_name"
                  placeholder="Company Name"
                  value={userForm.company_name}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* User type */}
              <div className="mb-4">
                <input
                  type="text"
                  name="user_type"
                  placeholder="User Type"
                  value={userForm.user_type}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              {/* is_admin */}
              <label className="flex items-center mb-3 gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={userForm.is_admin}
                  onChange={handleAdminChange}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Administrator</span>
              </label>

              {/* has_access_wbii */}
              <label className="flex items-center mb-5 gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition">
                <input
                  type="checkbox"
                  name="has_access_wbii"
                  checked={userForm.has_access_wbii}
                  onChange={handleWbiiChange}
                  className="w-4 h-4 accent-purple-600"
                />
                <span className="text-sm font-semibold text-purple-800">
                  🌦️ WBII Module Access
                </span>
              </label>

              {/* Buttons */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300"
                >
                  {editing ? 'Cancel Edit' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                >
                  {editing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── User list ─────────────────────────────────────────────────────────── */}
      <ul className="space-y-4 mt-6">
        {users && users.map((user) =>
          user ? (
            <li key={user.id} className="border border-gray-200 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center flex-wrap gap-3">

                {/* User info */}
                <div>
                  <strong className="text-lg font-semibold text-blue-600">
                    {user.username || 'Unknown'}
                  </strong>
                  <p className="text-sm text-gray-600">{user.email || 'No email provided'}</p>
                  {user.company_name && (
                    <p className="text-sm text-gray-500 italic">{user.company_name}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Role: <span className="font-medium text-gray-600">{user.user_type}</span>
                    {user.is_admin && (
                      <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                        Admin
                      </span>
                    )}
                  </p>

                  {/* WBII status badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                        user.has_access_wbii
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      🌦️ WBII: {user.has_access_wbii ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-wrap">

                  {/* Quick WBII toggle */}
                  <button
                    onClick={() => handleToggleWbii(user)}
                    title={user.has_access_wbii ? 'Disable WBII access' : 'Enable WBII access'}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition duration-200 ${
                      user.has_access_wbii
                        ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                        : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
                    }`}
                  >
                    {user.has_access_wbii ? '🔓 WBII ON' : '🔒 WBII OFF'}
                  </button>

                  <button
                    onClick={() => handleEditClick(user)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 transition duration-300 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ) : null
        )}
      </ul>
    </div>
  );
};

export default UserManagement;