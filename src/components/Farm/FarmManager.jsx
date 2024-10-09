import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Import your Axios instance
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2'; // Import SweetAlert

const FarmComponent = () => {
  const [farms, setFarms] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    subcounty: '',
    district_id: '',
    parishe: '',
    village: '',
    farmergroup_id: '',
    geolocation: '',
    phonenumber1: '',
    phonenumber2: '',
    gender: '',
    cin: '',
  });
  const [currentFarmId, setCurrentFarmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [farmerGroups, setFarmerGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFarms(currentPage);
    fetchDistricts();
    fetchFarmerGroups();
  }, [currentPage]);

  const fetchFarms = async (page) => {
    try {
      const response = await axiosInstance.get(`/api/farm/?page=${page}`);
      setFarms(response.data.farms);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('Error fetching farms:', error);
      setError('Error fetching farms.');
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await axiosInstance.get('/api/district/');
      setDistricts(response.data.districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setError('Error fetching districts.');
    }
  };

  const fetchFarmerGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/farmergroup/');
      setFarmerGroups(response.data);
    } catch (error) {
      console.error('Error fetching farmer groups:', error);
      setError('Error fetching farmer groups.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentFarmId) {
        // Use PUT or PATCH instead of POST
        await axiosInstance.post(`/api/farm/${currentFarmId}/update`, formData);
      } else {
        await axiosInstance.post('/api/farm/create', formData);
      }
      fetchFarms(currentPage);
      resetForm();
      setIsModalOpen(false); // Close the modal after submission
      Swal.fire('Success!', 'Farm has been saved.', 'success'); // Success message
    } catch (error) {
      console.error('Error saving farm:', error);
      Swal.fire('Error!', 'An error occurred while saving the farm.', 'error'); // Show error message
    }
  };


  const handleEdit = (farm) => {
    setFormData({
      name: farm.name,
      subcounty: farm.subcounty,
      parishe: farm.parishe,
      village: farm.village,
      district_id: farm.district_id,
      farmergroup_id: farm.farmergroup_id,
      geolocation: farm.geolocation,
      phonenumber: farm.phonenumber1,
      phonenumber2: farm.phonenumber2,
      gender: farm.gender,
      cin: farm.cin,
    });
    setCurrentFarmId(farm.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (farmId) => {
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
        await axiosInstance.post(`/api/farm/${farmId}/delete`);
        Swal.fire('Deleted!', 'Farm has been deleted.', 'success'); // Success message for deletion
        fetchFarms(currentPage);
      } catch (error) {
        console.error('Error deleting farm:', error);
        setError('An error occurred while deleting the farm.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subcounty: '',
      district_id: '',
      parishe: '',
      village: '',
      farmergroup_id: '',
      geolocation: '',
      phonenumber1: '',
      phonenumber2: '',
      gender: '',
      cin: '',
    });
    setCurrentFarmId(null);
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-6 text-center">Farm Management</h2>

      {error && <p className="text-red-500">{error}</p>}

      <div className="mb-6">
        <Link to="/mapviewall" state={{ owner_type: 'farmer' }} className="text-blue-600 hover:text-blue-800 underline">
          View All Farms
        </Link>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
      >
        Create Farm
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">{currentFarmId ? 'Update Farm' : 'Create Farm'}</h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 mb-6">
              <input
                type="text"
                name="name"
                placeholder="Farm Name"
                value={formData.name}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />

              <input
                type="text"
                name="subcounty"
                placeholder="Subcounty"
                value={formData.subcounty}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
              <input
                type="text"
                name="parishe"
                placeholder="Parish"
                value={formData.parishe}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />

              <input
                type="text"
                name="village"
                placeholder="Village"
                value={formData.village}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />

              <select
                name="district_id"
                value={formData.district_id}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>

              <select
                name="farmergroup_id"
                value={formData.farmergroup_id}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
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
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />

              <input
                type="text"
                name="phonenumber1"
                placeholder="Phone Number 1"
                value={formData.phonenumber1}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              />

              <input
                type="text"
                name="phonenumber2"
                placeholder="Phone Number 2"
                value={formData.phonenumber2}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {/* <input
                type="text"
                name="gender"
                placeholder="Gender"
                value={formData.gender}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              /> */}
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>


              <input
                type="text"
                name="cin"
                placeholder="National ID"
                value={formData.cin}
                onChange={handleChange}
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
              />

              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
                >
                  {currentFarmId ? 'Update Farm' : 'Create Farm'}
                </button>


                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ul className="space-y-4 mt-6">
        {farms.map((farm) => (
          <li key={farm.id} className="border border-gray-200 p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <strong className="text-lg font-semibold text-green-600">{farm.name}</strong>
                <p className="text-gray-600">{farm.subcounty}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(farm)} className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 transition duration-300">
                  Edit
                </button>
                <button onClick={() => handleDelete(farm.id)} className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-300">
                  Delete
                </button>
                <Link to="/mapview" state={{ owner_id: farm.id, owner_type: 'farmer', geolocation: farm.geolocation }} className="bg-blue-200 text-blue-800 py-1 px-3 rounded hover:bg-blue-300 transition duration-300">
                  View
                </Link>
                <Link to="/farmdatamanager" className="bg-green-200 text-green-800 py-1 px-3 rounded hover:bg-green-300 transition duration-300">
                  Add FD
                </Link>
                <Link to="/mapbox" state={{ owner_id: farm.id, owner_type: 'farmer', geolocation: farm.geolocation }} className="bg-purple-200 text-purple-800 py-1 px-3 rounded hover:bg-purple-300 transition duration-300">
                  Create Maps
                </Link>
                <Link to="/reportfarmer" state={{ farmId: farm.id }} className="bg-red-200 text-red-800 py-1 px-3 rounded hover:bg-red-300 transition duration-300">
                  View Report
                </Link>

              </div>
            </div>
          </li>
        ))}
      </ul>


      <div className="flex justify-between mt-4">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-gray-300 p-2 rounded disabled:opacity-50">
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-gray-300 p-2 rounded disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
};

export default FarmComponent;
