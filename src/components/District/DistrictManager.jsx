import React, { useEffect, useState } from 'react';
import axiosInstance from './axiosInstance'; // Import your Axios instance

const DistrictComponent = () => {
  const [districts, setDistricts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
  });
  const [currentDistrictId, setCurrentDistrictId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDistricts(currentPage);
  }, [currentPage]);

  const fetchDistricts = async (page) => {
    try {
      const response = await axiosInstance.get(`/api/district?page=${page}`);
      setDistricts(response.data.districts);
      setTotalPages(response.data.total_pages); // Set total pages from response
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentDistrictId) {
        await axiosInstance.put(`/api/district/${currentDistrictId}`, formData);
      } else {
        await axiosInstance.post('/api/district', formData);
      }
      fetchDistricts(currentPage);
      resetForm();
    } catch (error) {
      console.error('Error saving district:', error);
    }
  };

  const handleEdit = (district) => {
    setFormData({
      name: district.name,
      region: district.region,
    });
    setCurrentDistrictId(district.id);
  };

  const handleDelete = async (districtId) => {
    try {
      await axiosInstance.delete(`/api/district/${districtId}`);
      fetchDistricts(currentPage);
    } catch (error) {
      console.error('Error deleting district:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      region: '',
    });
    setCurrentDistrictId(null);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <h2>District Management</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="District Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="region"
          placeholder="Region"
          value={formData.region}
          onChange={handleChange}
          required
        />
        <button type="submit">{currentDistrictId ? 'Update District' : 'Create District'}</button>
        <button type="button" onClick={resetForm}>Cancel</button>
      </form>

      <h3>District List</h3>
      <ul>
        {districts.map((district) => (
          <li key={district.id}>
            {district.name} - {district.region}
            <button onClick={() => handleEdit(district)}>Edit</button>
            <button onClick={() => handleDelete(district.id)}>Delete</button>
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

export default DistrictComponent;
