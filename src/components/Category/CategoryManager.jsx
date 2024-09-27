import React, { useEffect, useState } from 'react';
import axiosInstance from './axiosInstance'; // Import the axios instance

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/producecategory/');
      setCategories(response.data.categories);
      setLoading(false);
    } catch (error) {
      setError('Failed to load categories');
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const response = await axiosInstance.post('/api/producecategory/create', {
        name: newCategory,
        created_by: 'admin', // Change this to dynamic user if available
      });
      alert(response.data.msg);
      setNewCategory(''); // Reset input
      fetchCategories(); // Reload categories
    } catch (error) {
      alert('Failed to create category');
    }
  };

  const handleEditCategory = async (id) => {
    try {
      const response = await axiosInstance.put(`/api/producecategory/${id}/edit`, {
        name: editCategory.name,
        modified_by: 'admin', // Change this to dynamic user if available
      });
      alert(response.data.msg);
      setEditCategory(null); // Reset edit mode
      fetchCategories(); // Reload categories
    } catch (error) {
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await axiosInstance.delete(`/api/producecategory/${id}/delete`);
        alert(response.data.msg);
        fetchCategories(); // Reload categories after deletion
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  return (
    <div>
      <h1>Category Manager</h1>

      {/* Display existing categories */}
      <div>
        {loading ? (
          <p>Loading categories...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <ul>
            {categories.map((category) => (
              <li key={category.id}>
                {editCategory && editCategory.id === category.id ? (
                  <div>
                    <input
                      type="text"
                      value={editCategory.name}
                      onChange={(e) =>
                        setEditCategory({ ...editCategory, name: e.target.value })
                      }
                    />
                    <button onClick={() => handleEditCategory(category.id)}>Save</button>
                    <button onClick={() => setEditCategory(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    {category.name} (Created on {new Date(category.date_created).toLocaleDateString()})
                    <button onClick={() => setEditCategory(category)}>Edit</button>
                    <button onClick={() => handleDeleteCategory(category.id)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create a new category */}
      <div>
        <h2>Create New Category</h2>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
        />
        <button onClick={handleCreateCategory}>Create Category</button>
      </div>
    </div>
  );
};

export default CategoryManager;
