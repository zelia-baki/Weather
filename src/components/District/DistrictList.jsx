import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DistrictList = () => {
    const [districts, setDistricts] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(null);

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

    const handleView = async (districtId) => {
        try {
            // Show loading message
            MySwal.fire({
                title: 'Loading...',
                text: 'Fetching district details',
                allowOutsideClick: false,
                didOpen: () => {
                    MySwal.showLoading();
                }
            });

            const { data } = await axiosInstance.get(`/api/district/${districtId}`);
            console.log('District data:', data); // Log data to verify

            MySwal.fire({
                title: 'District Details',
                html: `<div>
                    <p><span class="font-bold">Name:</span> ${data.name}</p>
                    <p><span class="font-bold">Region:</span> ${data.region}</p>
                    <!-- Add more details as needed -->
                </div>`,
                showCancelButton: true,
                cancelButtonText: 'Close',
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error fetching district details:', error);
            MySwal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Failed to fetch district details. Please try again later.',
            });
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
                                            <button
                                                onClick={() => handleView(district.id)}
                                                className="block px-4 py-2 text-blue-500 hover:bg-gray-100 w-full text-left"
                                            >
                                                View
                                            </button>
                                        </li>
                                        <li>
                                            <a
                                                href={`/districts/${district.id}/edit`}
                                                className="block px-4 py-2 text-green-500 hover:bg-gray-100"
                                            >
                                                Edit
                                            </a>
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
