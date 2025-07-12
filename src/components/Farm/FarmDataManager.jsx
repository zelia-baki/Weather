import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const FarmDataManager = () => {
  const location = useLocation();
  const farmId = location.state?.farmId || "WAK0001";
  const [farmData, setFarmData] = useState([]);
  const [farmsList, setFarmsList] = useState([]);
  const [cropsList, setCropsList] = useState([]);
  const [countriesList, setCountriesList] = useState([]);
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
    number_of_tree: '',
    channel_partner: '',
    destination_country: '',
    customer_name: '',
    hs_code: '',
  });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (farmId) {
      setFormData(prev => ({ ...prev, farm_id: farmId }));
      fetchFarmData(farmId);
    }
    fetchFarmsList();
    fetchCropsList();
    fetchCountryList();
  }, [farmId]);

  const fetchCountryList = async () => {
    try {
      const response = await axiosInstance.get('/api/pays/');
      setCountriesList(response.data.pays);
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  };

  const fetchFarmData = async (farmIdParam) => {
    try {
      const response = await axiosInstance.get(`/api/farmdata/?farm_id=${farmIdParam}`);
      setFarmData(response.data.farmdata_list);
    } catch (error) {
      console.error("Error fetching farm data:", error);
    }
  };

  const fetchFarmsList = async () => {
    try {
      const response = await axiosInstance.get('/api/farm/all');
      setFarmsList(response.data.farms);
    } catch (error) {
      console.error("Error fetching farms list:", error);
    }
  };

  const fetchCropsList = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCropsList(response.data.crops);
    } catch (error) {
      console.error("Error fetching crops list:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFarmSelect = (e) => {
    setFormData({ ...formData, farm_id: e.target.value });
  };

  const handleCropSelect = (e) => {
    setFormData({ ...formData, crop_id: e.target.value });
  };

  const handleCountrySelect = (e) => {
    setFormData({ ...formData, destination_country: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axiosInstance.put(`/api/farmdata/${editId}/edit`, formData);
        Swal.fire('Success', 'Farm Data updated successfully!', 'success');
      } else {
        await axiosInstance.post('/api/farmdata/create', formData);
        Swal.fire('Success', 'Farm Data created successfully!', 'success');
      }
      fetchFarmData(farmId);
      setFormData({
        farm_id: farmId,
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
        number_of_tree: '',
        hs_code: '',
      });
      setEditId(null);
    } catch (error) {
      console.error("Error submitting farm data:", error);
      Swal.fire('Error', 'Failed to submit farm data.', 'error');
    }
  };


  const handleEdit = (data) => {
    setFormData(data);
    setEditId(data.id);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won’t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/farmdata/${id}/delete`);
        Swal.fire('Deleted!', 'Farm data has been deleted.', 'success');
        fetchFarmData(farmId);
      } catch (error) {
        console.error('Error deleting farm:', error);
        Swal.fire('Error', 'Failed to delete farm data.', 'error');
      }
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Farm Data Manager</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!farmId && (
          <div>
            <label htmlFor="farm_id" className="block mb-2 text-sm font-medium">Farm ID:</label>
            <select
              name="farm_id"
              value={formData.farm_id}
              onChange={handleFarmSelect}
              required
              className="w-full p-2 border rounded-md shadow-sm"
            >
              <option value="">Select a Farm</option>
              {farmsList.map((farm) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </div>
        )}

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

        {['land_type', 'season', 'quality', 'quantity', 'channel_partner', 'customer_name'].map(field => (
          <div key={field}>
            <input
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={field.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
              className="w-full p-2 border rounded-md shadow-sm"
            />
          </div>
        ))}

        <div>
          <label htmlFor="destination_country">Destination Country:</label>
          <select
            name="destination_country"
            value={formData.destination_country}
            onChange={handleCountrySelect}
            className="w-full p-2 border rounded-md shadow-sm"
          >
            <option value="">Select Country</option>
            {countriesList.map((country) => (
              <option key={country.nom_en_gb} value={country.nom_en_gb}>
                {country.nom_en_gb} / {country.nom_fr_fr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4">
          <input
            type="text"
            name="tilled_land_size"
            value={formData.tilled_land_size}
            placeholder="Tilled Land Size"
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm"
          />
          <input
            type="number"
            name="number_of_tree"
            value={formData.number_of_tree}
            placeholder="Number of Trees"
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm"
          />
        </div>

        <div className="flex space-x-4">
          <input
            type="date"
            name="planting_date"
            value={formData.planting_date}
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm"
          />
          <input
            type="date"
            name="harvest_date"
            value={formData.harvest_date}
            onChange={handleChange}
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
            className="w-full p-2 border rounded-md shadow-sm"
          />
          <input
            type="number"
            name="actual_yield"
            value={formData.actual_yield}
            onChange={handleChange}
            placeholder="Actual Yield"
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
                <td className="px-4 py-2">{data.planting_date ? new Date(data.planting_date).toLocaleDateString() : ''}</td>
                <td className="px-4 py-2">{data.harvest_date ? new Date(data.harvest_date).toLocaleDateString() : ''}</td>
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
