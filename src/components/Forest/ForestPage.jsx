import React, { useState } from 'react';
import Modal from './Modal'; // Assuming Modal is in the same directory

const ForestPage = () => {
  const [isForestModalOpen, setIsForestModalOpen] = useState(false);

  const openForestModal = () => setIsForestModalOpen(true);
  const closeForestModal = () => setIsForestModalOpen(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Forest Management</h1>
      <div className="flex justify-center mb-6">
        <button
          onClick={openForestModal}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-blue-700 transition duration-300"
        >
          Create Forest
        </button>
      </div>

      <Modal isOpen={isForestModalOpen} onClose={closeForestModal}>
        <form
          action="/forest/handle_create_forest"
          method="post"
          className="mb-6 flex flex-col space-y-4"
          encType="multipart/form-data"
        >
          <input
            type="text"
            name="name"
            placeholder="Forest Name"
            className="border rounded-md px-4 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            name="tree_type"
            placeholder="Tree Type"
            className="border rounded-md px-4 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            className="border rounded-md px-4 py-3 flex-grow text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            className="bg-green-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition duration-300"
          >
            Create Forest
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ForestPage;
