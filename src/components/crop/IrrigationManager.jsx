import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Adjust the path as needed

const IrrigationManager = () => {
  const [irrigations, setIrrigations] = useState([]);
  const [formData, setFormData] = useState({ crop_id: '', farm_id: '', irrigation_date: '', water_applied: '', method: '' });
  const [editingId, setEditingId] = useState(null);
  const [cropsList, setCropsList] = useState([]); // State for storing crops

  useEffect(() => {
    fetchIrrigations();
    fetchCrops(); // Fetch crops when component loads
    fetchCropsList();
  }, []);

  // Fetch irrigation data
  const fetchIrrigations = async () => {
    try {
      const response = await axiosInstance.get('/api/irrigation/');
      setIrrigations(response.data.irrigation);
    } catch (error) {
      console.error('Error fetching irrigation records:', error);
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

  // Fetch crops for the dropdown
  const fetchCrops = async () => {
    try {
      const response = await axiosInstance.get('/api/crops/'); // Adjust endpoint as needed
      setCropsList(response.data.crops); // Assuming response.data.crops contains the list of crops
    } catch (error) {
      console.error('Error fetching crops:', error);
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
        await axiosInstance.put(`/api/irrigation/${editingId}/edit`, formData);
      } else {
        await axiosInstance.post('/api/irrigation/create', formData);
      }
      setFormData({ crop_id: '', farm_id: '', irrigation_date: '', water_applied: '', method: '' });
      setEditingId(null);
      fetchIrrigations(); // Refresh the irrigation list
    } catch (error) {
      console.error('Error saving irrigation record:', error);
    }
  };

  const handleEdit = (irrigation) => {
    setFormData({
      crop_id: irrigation.crop_id,
      farm_id: irrigation.farm_id,
      irrigation_date: irrigation.irrigation_date,
      water_applied: irrigation.water_applied,
      method: irrigation.method,
    });
    setEditingId(irrigation.id);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/irrigation/${id}/delete`);
      fetchIrrigations(); // Refresh the irrigation list
    } catch (error) {
      console.error('Error deleting irrigation record:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Irrigation Manager</h2>
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
          name="farm_id"
          value={formData.farm_id}
          onChange={handleChange}
          placeholder="Farm ID"
          className="border p-2 rounded mr-2"
          required
        />
        <input
          type="date"
          name="irrigation_date"
          value={formData.irrigation_date}
          onChange={handleChange}
          className="border p-2 rounded mr-2"
          required
        />
        <input
          type="number"
          name="water_applied"
          value={formData.water_applied}
          onChange={handleChange}
          placeholder="Water Applied (L)"
          className="border p-2 rounded mr-2"
          required
        />
        <input
          type="text"
          name="method"
          value={formData.method}
          onChange={handleChange}
          placeholder="Irrigation Method"
          className="border p-2 rounded mr-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? 'Update Irrigation' : 'Add Irrigation'}
        </button>
      </form>

      <ul>
        {irrigations.map((irrigation) => (
          <li key={irrigation.id} className="flex justify-between items-center border-b py-2">
            <span>Crop ID: {irrigation.crop_id} | Farm ID: {irrigation.farm_id} | Water Applied: {irrigation.water_applied}L</span>
            <div>
              <button onClick={() => handleEdit(irrigation)} className="text-yellow-500 hover:text-yellow-700 mr-2">
                Edit
              </button>
              <button onClick={() => handleDelete(irrigation.id)} className="text-red-500 hover:text-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IrrigationManager;
