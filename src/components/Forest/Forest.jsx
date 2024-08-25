import React, { useState } from 'react';
import ModalPoint from './Point/ModalPoint';
import Modal from './Fore/Modal'; 
import ModalTree from './Tree/ModalTree'; 

const ForestAndPointManagement = () => {
  const [isForestModalOpen, setIsForestModalOpen] = useState(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [isPointModalOpen, setIsPointModalOpen] = useState(false); // State for Point Modal

  const openForestModal = () => setIsForestModalOpen(true);
  const closeForestModal = () => setIsForestModalOpen(false);

  const openTreeModal = () => setIsTreeModalOpen(true);
  const closeTreeModal = () => setIsTreeModalOpen(false);

  const openPointModal = () => setIsPointModalOpen(true); // Function to open Point Modal
  const closePointModal = () => setIsPointModalOpen(false); // Function to close Point Modal

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Forest and Point Management</h1>
      <div className="flex justify-center mb-6 space-x-4">
        <button
          onClick={openForestModal}
          className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-blue-700 transition duration-300"
        >
          Create Forest
        </button>
        <button
          onClick={openTreeModal}
          className="bg-green-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition duration-300"
        >
          Create Tree
        </button>
        <button
        onClick={openPointModal}
        className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md shadow-md hover:bg-blue-700"
      >
        Create Point
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

      <ModalTree isOpen={isTreeModalOpen} onClose={closeTreeModal} />

      <ModalPoint isOpen={isPointModalOpen} onClose={closePointModal} /> {/* Render the ModalPoint */}
    </div>
  );
};

export default ForestAndPointManagement;
