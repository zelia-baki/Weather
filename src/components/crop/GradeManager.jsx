import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Adjust the path as needed

const GradeManager = () => {
  const [grades, setGrades] = useState([]);
  const [formData, setFormData] = useState({ crop_id: '', grade_value: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [cropsList, setCropsList] = useState([]); // State for storing crops


  useEffect(() => {
    fetchGrades();
    fetchCropsList();
    fetchCrops(); // Fetch crops when component loads


  }, []);

  const fetchGrades = async () => {
    try {
      const response = await axiosInstance.get('/api/grade/');
      setGrades(response.data.grades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };
  const fetchCropsList = async () => {
    try {
      const response = await axiosInstance.get('/api/crop/');
      setCropsList(response.data.crops); // Set crops list
    } catch (error) {
      console.error("Error fetching crops list:", error);
    }
  };
  const fetchCrops = async () => {
    try {
      const response = await axiosInstance.get('/api/crops/'); // Adjust endpoint as needed
      setCropsList(response.data.crops); // Assuming response.data.crops contains the list of crops
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };
  const handleCropSelect = (e) => {
    setFormData({ ...formData, crop_id: e.target.value }); // Handle crop selection
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/api/grade/${editingId}/edit`, formData);
      } else {
        await axiosInstance.post('/api/grade/create', formData);
      }
      setFormData({ crop_id: '', grade_value: '', description: '' });
      setEditingId(null);
      fetchGrades(); // Refresh the grades list
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const handleEdit = (grade) => {
    setFormData({
      crop_id: grade.crop_id,
      grade_value: grade.grade_value,
      description: grade.description,
    });
    setEditingId(grade.id);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/grade/${id}/delete`);
      fetchGrades(); // Refresh the grades list
    } catch (error) {
      console.error('Error deleting grade:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Grade Manager</h2>
      <form onSubmit={handleSubmit} className="mb-4">
      <div>
          <label htmlFor="crop_id" className="block mb-2 text-sm font-medium">Crop ID:</label>
          <select
            name="crop_id"
            value={formData.crop_id}
            onChange={handleCropSelect}
            required
            className="w-full p-2 border rounded-md shadow-sm"
          >
            <option value="">Select a Crop</option>
            {cropsList.map((crop) => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          name="grade_value"
          value={formData.grade_value}
          onChange={handleChange}
          placeholder="Grade Value"
          className="border p-2 rounded mr-2"
          required
        />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
          className="border p-2 rounded mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingId ? 'Update Grade' : 'Add Grade'}
        </button>
      </form>

      <ul>
        {grades.map((grade) => (
          <li key={grade.id} className="flex justify-between items-center border-b py-2">
            <span>Crop ID: {grade.crop_id} | Grade Value: {grade.grade_value} | Description: {grade.description}</span>
            <div>
              <button onClick={() => handleEdit(grade)} className="text-yellow-500 hover:text-yellow-700 mr-2">
                Edit
              </button>
              <button onClick={() => handleDelete(grade.id)} className="text-red-500 hover:text-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GradeManager;
