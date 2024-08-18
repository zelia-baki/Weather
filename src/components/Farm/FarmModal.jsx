import React from 'react';
import { IoClose, IoCheckmark } from 'react-icons/io5';

const FarmModal = ({ isOpen, onClose }) => {
    return (
        <div id="farmModal" className={`fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center`}>
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-4 md:mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-indigo-700">Create Farm</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <IoClose size={24} />
                    </button>
                </div>
                <form action="/farm/create_farm" method="POST" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="farm_id" className="block text-gray-700 text-sm font-semibold mb-2">Farm ID:</label>
                            <input type="text" id="farm_id" name="farm_id" required value="next_farm_id" className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Farm Name:</label>
                            <input type="text" id="name" name="name" required className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="subcounty" className="block text-gray-700 text-sm font-semibold mb-2">Subcounty:</label>
                            <input type="text" id="subcounty" name="subcounty" required className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="district_id" className="block text-gray-700 text-sm font-semibold mb-2">District:</label>
                            <select id="district_id" name="district_id" className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">None</option>
                                {/* Replace with dynamic district options */}
                                <option value="1">District 1</option>
                                <option value="2">District 2</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="farmergroup_id" className="block text-gray-700 text-sm font-semibold mb-2">Farmer Group:</label>
                            <select id="farmergroup_id" name="farmergroup_id" required className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">None</option>
                                {/* Replace with dynamic farmer group options */}
                                <option value="1">Farmer Group 1</option>
                                <option value="2">Farmer Group 2</option>
                            </select>
                        </div>
                        <div className="relative">
                            <label htmlFor="longitude" className="block text-gray-700 text-sm font-semibold mb-2">Longitude:</label>
                            <input type="text" id="longitude" name="longitude" required className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="latitude" className="block text-gray-700 text-sm font-semibold mb-2">Latitude:</label>
                            <input type="text" id="latitude" name="latitude" required className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="phonenumber1" className="block text-gray-700 text-sm font-semibold mb-2">Phone Number 1:</label>
                            <input type="text" id="phonenumber1" name="phonenumber1" className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="phonenumber2" className="block text-gray-700 text-sm font-semibold mb-2">Phone Number 2:</label>
                        <input type="text" id="phonenumber2" name="phonenumber2" className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>

                    <div className="flex items-center justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow-md flex items-center space-x-2 transition duration-150 ease-in-out">
                            <IoClose size={20} />
                            <span>Cancel</span>
                        </button>
                        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded shadow-md flex items-center space-x-2 transition duration-150 ease-in-out">
                            <IoCheckmark size={20} />
                            <span>Create Farm</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FarmModal;
