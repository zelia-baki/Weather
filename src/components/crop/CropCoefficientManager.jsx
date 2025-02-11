import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Adjust the path as needed

const CropCoefficientManager = () => {
  const [coefficients, setCoefficients] = useState([]);
  const [formData, setFormData] = useState({ crop_id: '', stage: '', kc_value: '' });
  const [editingId, setEditingId] = useState(null);
  const [cropsList, setCropsList] = useState([]); // State for storing crops


  useEffect(() => {
    fetchCoefficients();
    fetchCrops(); // Fetch crops when component loads
    fetchCropsList();
  }, []);

  const fetchCoefficients = async () => {
    try {
      const response = await axiosInstance.get('/api/kc/');
      setCoefficients(response.data.coefficients);
    } catch (error) {
      console.error('Error fetching crop coefficients:', error);
    }
  };
  const fetchCrops = async () => {
    try {
      const response = await axiosInstance.get('/api/crops/'); // Adjust endpoint as needed
      setCropsList(response.data.crops); // Assuming response.data.crops contains the list of crops
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };
  const fetchCropsList = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCropsList(response.data.crops); // Set crops list
    } catch (error) {
      console.error("Error fetching crops list:", error);
    }
  };
  
  const handleCropSelect = (e) => {
    setFormData({ ...formData, crop_id: e.target.value }); // Handle crop selection
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/api/kc/${editingId}/edit`, formData);
      } else {
        await axiosInstance.post('/api/kc/create', formData);
      }
      setFormData({ crop_id: '', stage: '', kc_value: '' });
      setEditingId(null);
      fetchCoefficients(); // Refresh the coefficients list
    } catch (error) {
      console.error('Error saving crop coefficient:', error);
    }
  };

  const handleEdit = (coefficient) => {
    setFormData({
      crop_id: coefficient.crop_id,
      stage: coefficient.stage,
      kc_value: coefficient.kc_value,
    });
    setEditingId(coefficient.id);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/kc/${id}/delete`);
      fetchCoefficients(); // Refresh the coefficients list
    } catch (error) {
      console.error('Error deleting crop coefficient:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Crop Coefficient Manager</h2>
      <form onSubmit={handleSubmit} className="mb-4">
      <div>
          <label htmlFor="crop_id" className="block mb-2 text-sm font-medium">Crop ID:</label>
          <select
            name="crop_id"
            value={formData.crop_id}
            onChange={handleCropSelect}
            required
            className="w-full p-2 border rounded-md shadow-sm"
          >
            <option value="">Select a Crop</option>
            {cropsList.map((crop) => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          name="stage"
          value={formData.stage}
          onChange={handleChange}
          placeholder="Stage"
          className="border p-2 rounded mr-2"
          required
        />
        <input
          type="number"
          name="kc_value"
          value={formData.kc_value}
          onChange={handleChange}
          placeholder="Kc Value"
          className="border p-2 rounded mr-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? 'Update Coefficient' : 'Add Coefficient'}
        </button>
      </form>

      <ul>
        {coefficients.map((coefficient) => (
          <li key={coefficient.id} className="flex justify-between items-center border-b py-2">
            <span>Crop ID: {coefficient.crop_id} | Stage: {coefficient.stage} | Kc Value: {coefficient.kc_value}</span>
            <div>
              <button onClick={() => handleEdit(coefficient)} className="text-yellow-500 hover:text-yellow-700 mr-2">
                Edit
              </button>
              <button onClick={() => handleDelete(coefficient.id)} className="text-red-500 hover:text-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CropCoefficientManager;
