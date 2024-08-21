import React, { useState } from 'react';
import DistrictList from './DistrictList';

const CreateDistrictModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [region, setRegion] = useState('');

    if (!isOpen) return null;

    return (
        <>
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
            
            {/* Modal content */}
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Create District</h2>
                    <form>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-gray-700">Name:</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                placeholder="Enter district name"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="region" className="block text-gray-700">Region:</label>
                            <input
                                type="text"
                                id="region"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                                placeholder="Enter region name"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

const CreateDistrict = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div className="p-4">
            <button
                onClick={handleOpenModal}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                Create District
            </button>

            <CreateDistrictModal isOpen={isModalOpen} onClose={handleCloseModal} />
            <DistrictList />
        </div>
    );
};

export default CreateDistrict;
