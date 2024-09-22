import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';

const FarmerGroupManager = () => {
  const [farmerGroups, setFarmerGroups] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

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
    } catch (error) {
      console.error('Error updating farmer group:', error);
    }
  };

  // Handle deleting a farmer group
  const handleDelete = async (fgId) => {
    try {
      await axiosInstance.delete(`/api/farmergroup/${fgId}`);
      setFarmerGroups(farmerGroups.filter(fg => fg.id !== fgId));
    } catch (error) {
      console.error('Error deleting farmer group:', error);
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
    <div>
      <h2>Farmer Groups</h2>

      {/* Create Farmer Group Form */}
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Create Farmer Group</button>
      </form>

      {/* List of Farmer Groups */}
      <ul>
        {farmerGroups.map((fg) => (
          <li key={fg.id}>
            {editingId === fg.id ? (
              // Edit mode
              <div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <button onClick={() => handleUpdate(fg.id)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              // Display mode
              <div>
                <strong>{fg.name}</strong>: {fg.description}
                <button onClick={() => handleEditClick(fg)}>Edit</button>
                <button onClick={() => handleDelete(fg.id)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FarmerGroupManager;
