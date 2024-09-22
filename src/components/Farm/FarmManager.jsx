import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Import your Axios instance
import { Link } from 'react-router-dom';

const FarmComponent = () => {
  const [farms, setFarms] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subcounty: '',
    district_id: '',
    farmergroup_id: '',
    geolocation: '',
    phonenumber1: '',
    phonenumber2: '',
  });
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [farmerGroups, setFarmerGroups] = useState([]);

  useEffect(() => {
    fetchFarms(currentPage);
    fetchDistricts();
    fetchFarmerGroups();
  }, [currentPage]);

  const fetchFarms = async (page) => {
    try {
      const response = await axiosInstance.get(`/api/farm/?page=${page}`);
      setFarms(response.data.farms);
      setTotalPages(response.data.total_pages); // Set total pages from response
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axiosInstance.get('/api/district/');
      setDistricts(response.data.districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchFarmerGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/farmergroup/');
      setFarmerGroups(response.data);
    } catch (error) {
      console.error('Error fetching farmer groups:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentFarmId) {
        await axiosInstance.post(`/api/farm/${currentFarmId}/update`, formData);
      } else {
        await axiosInstance.post('/api/farm/create', formData);
      }
      fetchFarms(currentPage);
      resetForm();
    } catch (error) {
      console.error('Error saving farm:', error);
    }
  };

  const handleEdit = (farm) => {
    setFormData({
      name: farm.name,
      subcounty: farm.subcounty,
      district_id: farm.district_id,
      farmergroup_id: farm.farmergroup_id,
      geolocation: farm.geolocation,
      phonenumber1: farm.phonenumber1,
      phonenumber2: farm.phonenumber2,
    });
    setCurrentFarmId(farm.id);
  };

  const handleDelete = async (farmId) => {
    try {
      await axiosInstance.post(`/api/farm/${farmId}/delete`);
      fetchFarms(currentPage);
    } catch (error) {
      console.error('Error deleting farm:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subcounty: '',
      district_id: '',
      farmergroup_id: '',
      geolocation: '',
      phonenumber1: '',
      phonenumber2: '',
    });
    setCurrentFarmId(null);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <h2>Farm Management</h2>
      <Link
        to="/mapviewall"
        state={{ owner_type: "farmer" }}
      >
        View All Farms
      </Link>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Farm Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="subcounty"
          placeholder="Subcounty"
          value={formData.subcounty}
          onChange={handleChange}
          required
        />
        
        {/* Dropdown for Districts */}
        <select
          name="district_id"
          value={formData.district_id}
          onChange={handleChange}
          required
        >
          <option value="">Select District</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>

        {/* Dropdown for Farmer Groups */}
        <select
          name="farmergroup_id"
          value={formData.farmergroup_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Farmer Group</option>
          {farmerGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="geolocation"
          placeholder="Geolocation (lat,long)"
          value={formData.geolocation}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phonenumber1"
          placeholder="Phone Number 1"
          value={formData.phonenumber1}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phonenumber2"
          placeholder="Phone Number 2"
          value={formData.phonenumber2}
          onChange={handleChange}
        />
        <button type="submit">{currentFarmId ? 'Update Farm' : 'Create Farm'}</button>
        <button type="button" onClick={resetForm}>Cancel</button>
      </form>

      <h3>Farm List</h3>
      <ul>
        {farms.map((farm) => (
          <li key={farm.id}>
            {farm.name} - {farm.subcounty}
            <button onClick={() => handleEdit(farm)}>Edit</button>
            <button onClick={() => handleDelete(farm.id)}>Delete</button>
            <Link
              to={{
                pathname: "/mapview",
              }}
              state={{
                owner_id: farm.id,
                owner_type: "farmer",
                geolocation: farm.geolocation
              }}
            >
              View
            </Link>
            <Link to="/farmdata">Add FD</Link>
            <Link
              to={{
                pathname: "/mapbox",
              }}
              state={{
                owner_id: farm.id,
                owner_type: "farmer",
                geolocation: farm.geolocation
              }}
            >
              Create Maps
            </Link>
            <Link
              to={{
                pathname: "/reportfarmer",
              }}
              state={{ farmId: farm.id }}
            >
              View Report
            </Link>
          </li>
        ))}
      </ul>

      {/* Pagination Controls */}
      <div>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span> Page {currentPage} of {totalPages} </span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default FarmComponent;
