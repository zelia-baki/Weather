import React, { useState } from 'react';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phonenumber: '',
    user_type: 'farmer',
    id_start: '',
    is_admin: false,
    password: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logique d'envoi de données au backend
    console.log(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Create User</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className="block text-gray-700">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="phonenumber" className="block text-gray-700">Phone number:</label>
            <input
              type="text"
              id="phonenumber"
              name="phonenumber"
              value={formData.phonenumber}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="user_type" className="block text-gray-700">User Type:</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              required
            >
              <option value="farmer">Farmer</option>
              <option value="forest">Forest</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="id_start" className="block text-gray-700">ID Start:</label>
            <input
              type="text"
              id="id_start"
              name="id_start"
              value={formData.id_start}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              required
            />
          </div>
          <div className="col-span-2 flex items-center">
            <input
              type="checkbox"
              id="is_admin"
              name="is_admin"
              checked={formData.is_admin}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="is_admin" className="text-gray-700">Admin</label>
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 p-2 border border-gray-300 rounded w-full"
              required
            />
          </div>
          <div className="col-span-2 flex justify-end mt-4">
            <button
              type="reset"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
