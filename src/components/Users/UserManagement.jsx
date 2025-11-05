import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    phonenumber: '',
    company_name: '',
    user_type: '',
    is_admin: false,
  });
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleAdminChange = (e) => {
    setUserForm((prevForm) => ({
      ...prevForm,
      is_admin: e.target.checked,
    }));
  };

  // Handle form submission for creating/updating a user
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        // Update user
        const response = await axiosInstance.put(`/api/users/${editingId}/edit`, userForm);
        setUsers(users.map((user) => (user.id === editingId ? response.data.user : user)));
        setEditing(false);
        setEditingId(null);
      } else {
        // Create new user
        await axiosInstance.post('/api/users/create', userForm);
      }

      setUserForm({
        username: '',
        email: '',
        password: '',
        phonenumber: '',
        company_name: '',
        user_type: '',
        is_admin: false,
      });
      setIsModalOpen(false);

      Swal.fire({
        title: 'Success!',
        text: editing ? 'User updated successfully!' : 'User created successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating/updating user:', error);
    }
  };

  // Handle deleting a user
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
        setUsers(users.filter((user) => user.id !== userId));

        Swal.fire({
          title: 'Deleted!',
          text: 'User deleted successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
        });
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // Handle edit button click
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
    });
    setIsModalOpen(true);
  };

  // Reset form when canceling edit
  const resetForm = () => {
    setEditing(false);
    setUserForm({
      username: '',
      email: '',
      password: '',
      phonenumber: '',
      company_name: '',
      user_type: '',
      is_admin: false,
    });
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">User Management</h2>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
      >
        Create User
      </button>

      {/* Modal for creating/updating User */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit}>
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
              <div className="mb-4">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={userForm.password}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required={!editing}
                />
              </div>
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
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={userForm.is_admin}
                  onChange={handleAdminChange}
                  className="mr-2"
                />
                Admin
              </label>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300"
                >
                  {editing ? 'Cancel Edit' : 'Cancel Create'}
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

      {/* List of Users */}
      <ul className="space-y-4 mt-6">
        {users && users.map((user) => (
          user ? (
            <li key={user.id} className="border border-gray-200 p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-lg font-semibold text-blue-600">{user.username || 'Unknown'}</strong>
                  <p className="text-sm text-gray-600">{user.email || 'No email provided'}</p>
                  {user.company_name && (
                    <p className="text-sm text-gray-500 italic">{user.company_name}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 transition duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ) : null
        ))}
      </ul>
    </div>
  );
};

export default UserManager;