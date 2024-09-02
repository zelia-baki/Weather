import React, { useState } from 'react';
import { IoClose, IoCheckmark } from 'react-icons/io5';

const ProduceCategoryModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        grade: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Submit the form data to the server
            // Example: await axiosInstance.post('/api/producecategory/create', formData);
            onClose(); // Close the modal after successful submission
        } catch (error) {
            console.error('Error creating produce category:', error);
        }
    };

    return (
        <div id="producecategoryModal" className={`fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center`}>
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Produce Category</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <IoClose size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-gray-700">Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded mt-1"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="grade" className="block text-gray-700">Grade:</label>
                            <input
                                type="number"
                                id="grade"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded mt-1"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2"
                        >
                            <IoClose size={20} />
                            <span>Cancel</span>
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2"
                        >
                            <IoCheckmark size={20} />
                            <span>Create Produce Category</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProduceCategoryModal;
