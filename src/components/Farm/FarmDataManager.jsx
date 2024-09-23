import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';

const FarmDataManager = () => {
  const [farmData, setFarmData] = useState([]);
  const [farmsList, setFarmsList] = useState([]);
  const [formData, setFormData] = useState({
    farm_id: '',
    crop_id: '',
    land_type: '',
    tilled_land_size: '',
    planting_date: '',
    season: '',
    quality: '',
    quantity: '',
    harvest_date: '',
    expected_yield: '',
    actual_yield: '',
    channel_partner: '',
    destination_country: '',
    customer_name: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchFarmData();
    fetchFarmsList();
  }, []);

  const fetchFarmData = async () => {
    try {
      const response = await axiosInstance.get('/api/farmdata/');
      setFarmData(response.data.farmdata_list);
    } catch (error) {
      console.error("Error fetching farm data:", error);
    }
  };

  const fetchFarmsList = async () => {
    try {
      const response = await axiosInstance.get('/api/farm/');
      setFarmsList(response.data.farms);
    } catch (error) {
      console.error("Error fetching farms list:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFarmSelect = (e) => {
    setFormData({ ...formData, farm_id: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axiosInstance.put(`/api/farmdata/${editId}/edit`, formData);
      } else {
        await axiosInstance.post('/api/farmdata/create', formData);
      }
      fetchFarmData();
      setFormData({
        farm_id: '',
        crop_id: '',
        land_type: '',
        tilled_land_size: '',
        planting_date: '',
        season: '',
        quality: '',
        quantity: '',
        harvest_date: '',
        expected_yield: '',
        actual_yield: '',
        channel_partner: '',
        destination_country: '',
        customer_name: '',
      });
      setEditId(null);
    } catch (error) {
      console.error("Error submitting farm data:", error);
    }
  };

  const handleEdit = (data) => {
    setFormData(data);
    setEditId(data.id);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/farmdata/${id}/delete`);
      fetchFarmData();
    } catch (error) {
      console.error("Error deleting farm data:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Farm Data Manager</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="farm_id" className="block mb-2 text-sm font-medium">Farm ID:</label>
          <select name="farm_id" value={formData.farm_id} onChange={handleFarmSelect} required className="w-full p-2 border rounded-md shadow-sm">
            <option value="">Select a Farm</option>
            {farmsList.map((farm) => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
        </div>

        {/* Other input fields with styling */}
        {['crop_id', 'land_type', 'tilled_land_size', 'season', 'quality', 'quantity', 'channel_partner', 'destination_country', 'customer_name'].map(field => (
          <div key={field}>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={field.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
              required
              className="w-full p-2 border rounded-md shadow-sm"
            />
          </div>
        ))}

        <div className="flex space-x-4">
          <input
            type="date"
            name="planting_date"
            value={formData.planting_date}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md shadow-sm"
          />
          <input
            type="date"
            name="harvest_date"
            value={formData.harvest_date}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md shadow-sm"
          />
        </div>

        <div className="flex space-x-4">
          <input
            type="number"
            name="expected_yield"
            value={formData.expected_yield}
            onChange={handleChange}
            placeholder="Expected Yield"
            required
            className="w-full p-2 border rounded-md shadow-sm"
          />
          <input
            type="number"
            name="actual_yield"
            value={formData.actual_yield}
            onChange={handleChange}
            placeholder="Actual Yield"
            required
            className="w-full p-2 border rounded-md shadow-sm"
          />
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
          {editId ? 'Update Farm Data' : 'Create Farm Data'}
        </button>
      </form>

      <h2 className="text-xl font-semibold mt-6">Farm Data List</h2>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2">Farm ID</th>
              <th className="px-4 py-2">Crop ID</th>
              <th className="px-4 py-2">Land Type</th>
              <th className="px-4 py-2">Tilled Land Size</th>
              <th className="px-4 py-2">Planting Date</th>
              <th className="px-4 py-2">Harvest Date</th>
              <th className="px-4 py-2">Quality</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Expected Yield</th>
              <th className="px-4 py-2">Actual Yield</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {farmData.map((data) => (
              <tr key={data.id} className="border-t">
                <td className="px-4 py-2">{data.farm_id}</td>
                <td className="px-4 py-2">{data.crop_id}</td>
                <td className="px-4 py-2">{data.land_type}</td>
                <td className="px-4 py-2">{data.tilled_land_size}</td>
                <td className="px-4 py-2">{new Date(data.planting_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{new Date(data.harvest_date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{data.quality}</td>
                <td className="px-4 py-2">{data.quantity}</td>
                <td className="px-4 py-2">{data.expected_yield}</td>
                <td className="px-4 py-2">{data.actual_yield}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleEdit(data)} className="text-blue-500 hover:underline mr-2">Edit</button>
                  <button onClick={() => handleDelete(data.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FarmDataManager;