import React from 'react';
import PropTypes from 'prop-types';

const CropModal = ({ isOpen, crop, categories = [], onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
                <h1 className="text-2xl font-bold mb-4">{crop ? 'Edit' : 'Create'} Crop</h1>
                <form className="bg-white p-6 rounded-lg shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-gray-700">Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="w-full p-2 border border-gray-300 rounded mt-1"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="weight" className="block text-gray-700">Weight:</label>
                            <input
                                type="number"
                                step="0.01"
                                id="weight"
                                name="weight"
                                className="w-full p-2 border border-gray-300 rounded mt-1"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="category_id" className="block text-gray-700">Category:</label>
                            <select
                                id="category_id"
                                name="category_id"
                                className="w-full p-2 border border-gray-300 rounded mt-1"
                                required
                            >
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            {crop ? 'Update' : 'Create'}
                        </button>
                    </div>
                    <a
                        href="/createcategory"
                        className="text-blue-500 hover:underline block mt-4"
                    >
                        Create Category
                    </a>
                </form>
            </div>
        </div>
    );
};

CropModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    crop: PropTypes.object,
    categories: PropTypes.array,
    onClose: PropTypes.func.isRequired,
};

export default CropModal;
