import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { Link } from 'react-router-dom';
import DistrictView from './DistrictView';

const DistrictList = () => {
    const [districts, setDistricts] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(null); // State to handle the dropdown

    useEffect(() => {
        fetchDistricts();
    }, []);

    const fetchDistricts = async () => {
        try {
            const response = await axiosInstance.get('/api/district/');
            setDistricts(response.data.districts);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const handleDelete = async (districtId) => {
        try {
            await axiosInstance.delete(`/api/district/${districtId}/`);
            setDistricts(districts.filter(district => district.id !== districtId));
        } catch (error) {
            console.error('Error deleting district:', error);
        }
    };

    const toggleDropdown = (id) => {
        setDropdownOpen(dropdownOpen === id ? null : id);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700">Districts</h1>
            <ul className="mt-4 bg-white rounded-lg shadow-lg">
                {districts.map((district) => (
                    <li
                        key={district.id}
                        className="border-b border-gray-200 py-2 px-4 flex justify-between items-center"
                    >
                        <span>{district.name} - {district.region}</span>
                        <div className="relative">
                            <button
                                onClick={() => toggleDropdown(district.id)}
                                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                            >
                                Actions
                            </button>
                            {dropdownOpen === district.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <ul>
                                        <li>
                                            <Link
                                                to={`/districts/${district.id}/view`}
                                                className="block px-4 py-2 text-blue-500 hover:bg-gray-100"
                                            >
                                                View
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to={`/districts/${district.id}/edit`}
                                                className="block px-4 py-2 text-green-500 hover:bg-gray-100"
                                            >
                                                Edit
                                            </Link>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleDelete(district.id)}
                                                className="block px-4 py-2 text-red-500 hover:bg-gray-100 w-full text-left"
                                            >
                                                Delete
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DistrictList;
