import React, { useState } from 'react';

const FarmList = () => {
    const [selectedFarmId, setSelectedFarmId] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);

    const handleDropdownToggle = (farmId) => {
        setDropdownOpen(dropdownOpen === farmId ? null : farmId);
    };

    const handleAction = (action, farmId) => {
        // Implement action handling logic here
        console.log(`${action} action for farm ID: ${farmId}`);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700">Farm List</h1>
            <div className="bg-white rounded-lg shadow-lg">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-teal-500 text-white">
                            <th className="px-4 py-2">Farm ID</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">District</th>
                            <th className="px-4 py-2">Farmer Group</th>
                            <th className="px-4 py-2">Longitude</th>
                            <th className="px-4 py-2">Latitude</th>
                            <th className="px-4 py-2">Phone Number 1</th>
                            <th className="px-4 py-2">Phone Number 2</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Example static row */}
                        <tr className="bg-gray-50 hover:bg-gray-100">
                            <td className="border px-4 py-2">
                                <input type="text" value="1" className="w-full p-2 border border-gray-300 rounded bg-gray-100" disabled />
                            </td>
                            <td className="border px-4 py-2">
                                <input type="text" value="Farm Name" className="w-full p-2 border border-gray-300 rounded bg-green-50" />
                            </td>
                            <td className="border px-4 py-2">
                                <select className="w-full p-2 border border-gray-300 rounded bg-yellow-50">
                                    <option value="1">District 1</option>
                                    <option value="2">District 2</option>
                                </select>
                            </td>
                            <td className="border px-4 py-2">
                                <select className="w-full p-2 border border-gray-300 rounded bg-blue-50">
                                    <option value="1">Farmer Group 1</option>
                                    <option value="2">Farmer Group 2</option>
                                </select>
                            </td>
                            <td className="border px-4 py-2">
                                <input type="number" value="10.1234" className="w-full p-2 border border-gray-300 rounded bg-red-50" />
                            </td>
                            <td className="border px-4 py-2">
                                <input type="number" value="20.5678" className="w-full p-2 border border-gray-300 rounded bg-purple-50" />
                            </td>
                            <td className="border px-4 py-2">
                                <input type="text" value="123-456-7890" className="w-full p-2 border border-gray-300 rounded bg-pink-50" />
                            </td>
                            <td className="border px-4 py-2">
                                <input type="text" value="098-765-4321" className="w-full p-2 border border-gray-300 rounded bg-orange-50" />
                            </td>
                            <td className="border px-4 py-2">
                                <div className="relative">
                                    <button
                                        onClick={() => handleDropdownToggle(1)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
                                    >
                                        Actions
                                    </button>
                                    {dropdownOpen === 1 && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg">
                                            <button
                                                onClick={() => handleAction('Update', 1)}
                                                className="block px-4 py-2 text-teal-600 hover:bg-teal-100 w-full text-left"
                                            >
                                                Update
                                            </button>
                                            <button
                                                onClick={() => handleAction('Delete', 1)}
                                                className="block px-4 py-2 text-red-600 hover:bg-red-100 w-full text-left"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => handleAction('View', 1)}
                                                className="block px-4 py-2 text-blue-600 hover:bg-blue-100 w-full text-left"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleAction('Add FD', 1)}
                                                className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                            >
                                                Add FD
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                        {/* Add more rows as needed */}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="flex justify-center mt-8">
                    {/* Pagination logic goes here */}
                </div>
            </div>
        </div>
    );
};

export default FarmList;
