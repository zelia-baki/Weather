import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DistrictEdit = ({ id, onSave, onClose }) => {
  const [district, setDistrict] = useState(null);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');

  useEffect(() => {
    const fetchDistrict = async () => {
      try {
        const response = await axiosInstance.get(`/api/district/${id}`);
        setDistrict(response.data);
        setName(response.data.name || '');
        setRegion(response.data.region || '');
      } catch (error) {
        console.error('Error fetching district:', error);
      }
    };

    fetchDistrict();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedDistrict = { name, region };
    try {
      await onSave(updatedDistrict);
      Swal.close(); // Close the popup on success
    } catch (error) {
      console.error('Error saving district:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to save district. Please try again later.',
      });
    }
  };

  if (!district) return <p>Loading...</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Edit District</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 font-semibold">Name:</label>
          <input
            type="text"
            name="name"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            placeholder="Enter district name"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="region" className="block text-gray-700 font-semibold">Region:</label>
          <input
            type="text"
            name="region"
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
            placeholder="Enter region name"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Update
        </button>
      </form>
    </div>
  );
};

export default DistrictEdit;
