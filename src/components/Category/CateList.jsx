import React, { useState } from 'react';

const ProduceCategoryManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null); // State to track which dropdown is open

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const toggleDropdown = (id) => {
        setOpenDropdown(openDropdown === id ? null : id); // Toggle the dropdown
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700">Produce Category Management</h1>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
                        <h2 className="text-2xl font-bold mb-4 text-teal-700">Create Produce Category</h2>
                        <form action="/your-post-url" method="POST">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-gray-700">Name:</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="grade" className="block text-gray-700">Grade:</label>
                                    <input
                                        type="number"
                                        id="grade"
                                        name="grade"
                                        className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:border-teal-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Produce Category List */}
            <div className="bg-white rounded-lg shadow-lg">
                {/* <h2 className="text-2xl font-bold mb-4 text-teal-700 text-center">Produce Categories</h2> */}
                <table className="min-w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-teal-500 text-white">
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Grade</th>
                            <th className="px-4 py-2">Created By</th>
                            <th className="px-4 py-2">Modified By</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Replace with dynamic data */}
                        {[1, 2, 3].map((id) => (
                            <tr key={id} className="bg-gray-50 hover:bg-gray-100">
                                <td className="border px-4 py-2">{id}</td>
                                <td className="border px-4 py-2">Example Name {id}</td>
                                <td className="border px-4 py-2">Grade {id}</td>
                                <td className="border px-4 py-2">Creator</td>
                                <td className="border px-4 py-2">Modifier</td>
                                <td className="border px-4 py-2">
                                    <div className="relative">
                                        <button
                                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
                                            onClick={() => toggleDropdown(id)}
                                        >
                                            Actions
                                        </button>
                                        {/* Actions dropdown */}
                                        {openDropdown === id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                                                <button className="block px-4 py-2 text-teal-600 hover:bg-teal-100 w-full text-left">
                                                    Edit
                                                </button>
                                                <button className="block px-4 py-2 text-red-600 hover:bg-red-100 w-full text-left">
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProduceCategoryManager;
