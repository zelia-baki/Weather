import React, { useState } from 'react';
import ModalPoint from './ModalPoint'; // Assuming Modal is in the same directory
// import PointList from './PointList';

const PointManagement = () => {
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);

  const openPointModal = () => setIsPointModalOpen(true);
  const closePointModal = () => setIsPointModalOpen(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Point Management</h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={openPointModal}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-blue-700 transition duration-300"
        >
          Create Point
        </button>
        {/* <div className="mt-8 w-full bg-white p-6 rounded-lg shadow-md">
          <PointList />
        </div> */}

      </div>

      <ModalPoint isOpen={isPointModalOpen} onClose={closePointModal}>
        <form
          action="/point/handle_create_point"
          method="post"
          className="space-y-4"
          encType="multipart/form-data"
        >
          <input
            type="text"
            name="longitude"
            placeholder="Longitude"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            name="latitude"
            placeholder="Latitude"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            name="owner_type"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select Owner Type</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <input
            type="text"
            name="forest"
            placeholder="Forest"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            name="farmer"
            placeholder="Farmer"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            name="district"
            placeholder="District"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            className="border rounded-md px-4 py-3 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-blue-700 transition duration-300"
          >
            Create Point
          </button>
        </form>
      </ModalPoint>
    </div>
  );
};

export default PointManagement;
