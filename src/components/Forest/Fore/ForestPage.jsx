import React, { useState } from 'react';
import Modal from './Modal'; // Assuming Modal is in the same directory
import ForestList from './ForestList'; // Import ForestList

const ForestPage = () => {
  const [isForestModalOpen, setIsForestModalOpen] = useState(false);

  const openForestModal = () => setIsForestModalOpen(true);
  const closeForestModal = () => setIsForestModalOpen(false);

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
        
        {/* Display the ForestList directly below the button */}
        <div className="mt-8 w-full bg-white p-6 rounded-lg shadow-md">
          <ForestList />
        </div>
      </div>

      <Modal isOpen={isForestModalOpen} onClose={closeForestModal}>
        <form
          action="/forest/handle_create_forest"
          method="post"
          className="space-y-4"
          encType="multipart/form-data"
        >
          <h2 className="text-2xl font-bold mb-4 text-teal-800">Create New Forest</h2>
          <input
            type="text"
            name="name"
            placeholder="Forest Name"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <input
            type="text"
            name="tree_type"
            placeholder="Tree Type"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
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
