import React, { useState } from 'react';
import axiosInstance from '../../../axiosInstance'; // Adjust the path as needed
import Modal from './Modal';
import ForestList from './ForestList';
import { Link } from 'react-router-dom';

const ForestPage = () => {
  const [isForestModalOpen, setIsForestModalOpen] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);

  const openForestModal = () => setIsForestModalOpen(true);
  const closeForestModal = () => setIsForestModalOpen(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
      const response = await axiosInstance.post('/api/forest/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        console.log('Forest created successfully', response.data.forest_id);
        setUpdateFlag(!updateFlag); // Toggle the flag to trigger re-fetch of forests
        closeForestModal(); // Close the modal after successful creation
      } else {
        console.error('Failed to create forest');
      }
    } catch (error) {
      console.error('Error creating forest:', error);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-teal-800">Forest Management</h1>
      <div className="flex flex-col items-center mb-8">
        <button
          onClick={openForestModal}
          className="bg-teal-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-teal-700 transition duration-300"
        >
          Create Forest
        </button>
        <Link
                to="/mapviewall"
                state={{
                    owner_type: "forest",
                }}
                className="inline-block m-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                View All Forest
            </Link>
        
        <div className="mt-8 w-full bg-white p-6 rounded-lg shadow-md">
          <ForestList key={updateFlag} /> {/* Re-fetch forests when updateFlag changes */}
        </div>
      </div>

      <Modal isOpen={isForestModalOpen} onClose={closeForestModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-teal-800">Create New Forest</h2>
          <input
            type="text"
            name="name"
            placeholder="Forest Name"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="tree_type"
            placeholder="Tree Type"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            className="border rounded-md px-4 py-3 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            type="submit"
            className="bg-teal-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-teal-700 transition duration-300"
          >
            Create Forest
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ForestPage;
