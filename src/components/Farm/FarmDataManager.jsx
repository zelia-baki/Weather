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
    fetchFarmsList(); // Fetch farms for the dropdown
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
    <div>
      <h1>Farm Data Manager</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="farm_id">Farm ID:</label>
        <select name="farm_id" value={formData.farm_id} onChange={handleFarmSelect} required>
          <option value="">Select a Farm</option>
          {farmsList.map((farm) => (
            <option key={farm.id} value={farm.id}>{farm.name}</option>
          ))}
        </select>

        {/* Add other input fields here... */}
        <input type="text" name="crop_id" value={formData.crop_id} onChange={handleChange} placeholder="Crop ID" required />
        <input type="text" name="land_type" value={formData.land_type} onChange={handleChange} placeholder="Land Type" required />
        <input type="number" name="tilled_land_size" value={formData.tilled_land_size} onChange={handleChange} placeholder="Tilled Land Size" required />
        <input type="date" name="planting_date" value={formData.planting_date} onChange={handleChange} required />
        <input type="text" name="season" value={formData.season} onChange={handleChange} placeholder="Season" required />
        <input type="text" name="quality" value={formData.quality} onChange={handleChange} placeholder="Quality" required />
        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" required />
        <input type="date" name="harvest_date" value={formData.harvest_date} onChange={handleChange} required />
        <input type="number" name="expected_yield" value={formData.expected_yield} onChange={handleChange} placeholder="Expected Yield" required />
        <input type="number" name="actual_yield" value={formData.actual_yield} onChange={handleChange} placeholder="Actual Yield" required />
        <input type="text" name="channel_partner" value={formData.channel_partner} onChange={handleChange} placeholder="Channel Partner" required />
        <input type="text" name="destination_country" value={formData.destination_country} onChange={handleChange} placeholder="Destination Country" required />
        <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} placeholder="Customer Name" required />
        <button type="submit">{editId ? 'Update Farm Data' : 'Create Farm Data'}</button>
      </form>

      <h2>Farm Data List</h2>
      <ul>
        {farmData.map((data) => (
          <li key={data.id}>
            {JSON.stringify(data)} 
            <button onClick={() => handleEdit(data)}>Edit</button>
            <button onClick={() => handleDelete(data.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FarmDataManager;
