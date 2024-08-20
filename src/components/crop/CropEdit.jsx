import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

const ModalEditCrop = ({ isOpen, onRequestClose, cropId }) => {
    const [cropName, setCropName] = useState('');
    const [weight, setWeight] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (cropId) {
            // Fetch crop data by ID
            fetch(`/api/crops/${cropId}`)
                .then(response => response.json())
                .then(data => {
                    setCropName(data.name);
                    setWeight(data.weight);
                    setCategoryId(data.category_id);
                });
        }
        // Fetch categories data
        fetch('/api/categories')
            .then(response => response.json())
            .then(data => setCategories(data));
    }, [cropId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle update logic
        console.log("Crop updated:", { cropName, weight, categoryId });
        onRequestClose(); // Close the modal after submission
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Edit Crop Modal"
            className="fixed inset-0 bg-white mx-auto my-10 max-w-md md:max-w-lg lg:max-w-xl rounded-lg shadow-lg"
            overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-50"
            style={{
                content: {
                    width: '90%', // Set a responsive width for the modal
                    maxWidth: '600px', // Set a maximum width
                    maxHeight: '80vh', // Set a maximum height
                    margin: 'auto', // Center the modal
                    overflowY: 'auto', // Allow vertical scrolling if content overflows
                    padding: '20px' // Add padding around the content
                }
            }}
        >
            <h2 className="text-2xl font-bold mb-6">Edit Crop</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={cropName}
                        onChange={(e) => setCropName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="weight" className="block text-gray-700 font-medium mb-2">Weight:</label>
                    <input
                        type="text"
                        id="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="category_id" className="block text-gray-700 font-medium mb-2">Category:</label>
                    <select
                        id="category_id"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                        required
                    >
                        <option value="" disabled>Select a category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        className="bg-teal-500 text-white font-bold py-2 px-4 rounded hover:bg-teal-600"
                    >
                        Update Crop
                    </button>
                    <button
                        type="button"
                        onClick={onRequestClose}
                        className="bg-gray-400 text-white font-bold py-2 px-4 rounded hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ModalEditCrop;
