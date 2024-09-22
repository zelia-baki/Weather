import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';

const FarmerGroupManager = () => {
  const [farmerGroups, setFarmerGroups] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); // État pour gérer l'ouverture du modal

  // Fetch all farmer groups
  const fetchFarmerGroups = async () => {
    try {
      const response = await axiosInstance.get('/api/farmergroup/');
      setFarmerGroups(response.data);
    } catch (error) {
      console.error('Error fetching farmer groups:', error);
    }
  };

  // Handle form submission for creating a new farmer group
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/farmergroup/create', {
        name,
        description,
      });
      setFarmerGroups([...farmerGroups, response.data.farmer_group]);
      setName('');
      setDescription('');
      setIsModalOpen(false); // Fermer le modal après la création
      
      // SweetAlert for successful creation
      Swal.fire({
        title: 'Success!',
        text: 'Farmer group created successfully!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error creating farmer group:', error);
    }
  };

  // Handle updating an existing farmer group
  const handleUpdate = async (fgId) => {
    try {
      const response = await axiosInstance.put(`/api/farmergroup/${fgId}`, {
        name: editName,
        description: editDescription,
      });
      setFarmerGroups(farmerGroups.map(fg => fg.id === fgId ? response.data.farmer_group : fg));
      setEditingId(null); // Exit edit mode

      // SweetAlert for successful update
      Swal.fire({
        title: 'Success!',
        text: 'Farmer group updated successfully!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error updating farmer group:', error);
    }
  };

  // Handle deleting a farmer group
  const handleDelete = async (fgId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/farmergroup/${fgId}`);
        setFarmerGroups(farmerGroups.filter(fg => fg.id !== fgId));

        // SweetAlert for successful deletion
        Swal.fire({
          title: 'Deleted!',
          text: 'Farmer group deleted successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } catch (error) {
        console.error('Error deleting farmer group:', error);
      }
    }
  };

  // Handle edit button click
  const handleEditClick = (fg) => {
    setEditingId(fg.id);
    setEditName(fg.name);
    setEditDescription(fg.description);
  };

  useEffect(() => {
    fetchFarmerGroups();
  }, []);

  return (
    <div className="container mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Farmer Groups</h2>

      {/* Button to open the modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
      >
        Create Farmer Group
      </button>

      {/* Modal for creating Farmer Group */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Create Farmer Group</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="submit"
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List of Farmer Groups */}
      <ul className="space-y-4 mt-6">
        {farmerGroups.map((fg) => (
          <li key={fg.id} className="border border-gray-200 p-4 rounded-lg shadow-sm">
            {editingId === fg.id ? (
              // Edit mode
              <div className="space-y-4">
                <div className="mb-4">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleUpdate(fg.id)}
                    className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Display mode
              <div className="flex justify-between items-center">
                <div>
                  <strong className="text-lg font-semibold text-green-600">{fg.name}</strong>
                  <p>{fg.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(fg)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 transition duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(fg.id)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition duration-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FarmerGroupManager;
