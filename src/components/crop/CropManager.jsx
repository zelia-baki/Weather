import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Adjust the path as needed

const CropManager = () => {
  const [crops, setCrops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', weight: '', category_id: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCrops();
    fetchCategories();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCrops(response.data.crops);
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/api/crop/${editingId}/edit`, formData);
      } else {
        await axiosInstance.post('/api/crop/create', formData);
      }
      setFormData({ name: '', weight: '', category_id: '' });
      setEditingId(null);
      fetchCrops(); // Refresh the crop list
    } catch (error) {
      console.error('Error saving crop:', error);
    }
  };

  const handleEdit = (crop) => {
    setFormData({ name: crop.name, weight: crop.weight, category_id: crop.category_id });
    setEditingId(crop.id);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/crop/${id}/delete`);
      fetchCrops(); // Refresh the crop list
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Crop Manager</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Crop Name"
          className="border p-2 rounded mr-2"
          required
        />
        <input
          type="number"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
          placeholder="Weight"
          className="border p-2 rounded mr-2"
          required
        />
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="border p-2 rounded mr-2"
          required
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? 'Update Crop' : 'Add Crop'}
        </button>
      </form>

      <ul>
        {crops.map((crop) => (
          <li key={crop.id} className="flex justify-between items-center border-b py-2">
            <span>{crop.name} (Weight: {crop.weight})</span>
            <div>
              <button onClick={() => handleEdit(crop)} className="text-yellow-500 hover:text-yellow-700 mr-2">
                Edit
              </button>
              <button onClick={() => handleDelete(crop.id)} className="text-red-500 hover:text-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CropManager;
