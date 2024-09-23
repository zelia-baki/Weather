import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    id: null,
    username: '',
    email: '',
    password: '',
    phonenumber: '',
    user_type: '',
    is_admin: false
  });
  const [editing, setEditing] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/api/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users', error);
    }
  };

  // Handle form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });
  };

  // Handle checkbox for admin
  const handleAdminChange = (e) => {
    setUserForm({ ...userForm, is_admin: e.target.checked });
  };

  // Create or update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        // Update existing user
        await axiosInstance.put(`/api/users/${userForm.id}/edit`, userForm);
        alert('User updated successfully');
      } else {
        // Create new user
        await axiosInstance.post('/api/users/create', userForm);
        alert('User created successfully');
      }
      fetchUsers();
      resetForm();
    } catch (error) {
      console.error('Error saving user', error);
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/users/${id}/delete`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user', error);
    }
  };

  // Edit user
  const handleEdit = (user) => {
    setUserForm({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '',
      phonenumber: user.phonenumber,
      user_type: user.user_type,
      is_admin: user.is_admin
    });
    setEditing(true);
  };

  // Reset form
  const resetForm = () => {
    setUserForm({
      id: null,
      username: '',
      email: '',
      password: '',
      phonenumber: '',
      user_type: '',
      is_admin: false
    });
    setEditing(false);
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h1>User Management</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={userForm.username}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={userForm.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={userForm.password}
          onChange={handleInputChange}
          required={!editing} // Only required when creating a new user
        />
        <input
          type="text"
          name="phonenumber"
          placeholder="Phone Number"
          value={userForm.phonenumber}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="user_type"
          placeholder="User Type"
          value={userForm.user_type}
          onChange={handleInputChange}
          required
        />
        <label>
          Admin:
          <input
            type="checkbox"
            name="is_admin"
            checked={userForm.is_admin}
            onChange={handleAdminChange}
          />
        </label>
        <button type="submit">{editing ? 'Update User' : 'Create User'}</button>
        {editing && <button onClick={resetForm}>Cancel Edit</button>}
      </form>

      <h2>Users List</h2>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>User Type</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.phonenumber}</td>
              <td>{user.user_type}</td>
              <td>{user.is_admin ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleEdit(user)}>Edit</button>
                <button onClick={() => handleDelete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
