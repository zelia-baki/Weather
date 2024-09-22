import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { Link } from 'react-router-dom';


const FarmList = () => {
    const [farms, setFarms] = useState([]);
    const [districts, setDistricts] = useState({});
    const [farmerGroups, setFarmerGroups] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dropdownOpen, setDropdownOpen] = useState(null);

    useEffect(() => {
        fetchFarms(currentPage);
        fetchDistricts();
        fetchFarmerGroups();
    }, [currentPage]);

    const fetchFarms = async (page) => {
        try {
            const response = await axiosInstance.get(`/api/farm/?page=${page}`);
            setFarms(response.data.farms);
            setTotalPages(response.data.total_pages);  // Set total pages from response
        } catch (error) {
            console.error('Error fetching farms:', error);
        }
    };

    const fetchDistricts = async () => {
        try {
            const response = await axiosInstance.get('/api/district/');
            const districtsMap = response.data.districts.reduce((acc, district) => {
                acc[district.id] = district.name;
                return acc;
            }, {});
            setDistricts(districtsMap);
        } catch (error) {
            console.error('Error fetching districts:', error);
        }
    };

    const fetchFarmerGroups = async () => {
        try {
            const response = await axiosInstance.get('/api/farmergroup/');
            const farmerGroupsMap = response.data.reduce((acc, group) => {
                acc[group.id] = group.name;
                return acc;
            }, {});
            setFarmerGroups(farmerGroupsMap);
        } catch (error) {
            console.error('Error fetching farmer groups:', error);
        }
    };

    const handleDropdownToggle = (farmId) => {
        setDropdownOpen(dropdownOpen === farmId ? null : farmId);
    };

    const handleAction = async (action, farmId) => {
        console.log(`${action} action for farm ID: ${farmId}`);
    
        if (action === 'Delete') {
            const userConfirmed = window.confirm('Are you sure you want to delete this farm? This action cannot be undone.');
            
            if (userConfirmed) {
                try {
                    const response = await axiosInstance.post(`/api/farm/${farmId}/delete`);
                    if (response.data.success) {
                        // Remove the deleted farm from the state
                        setFarms(farms.filter(farm => farm.id !== farmId));
                        console.log('Farm deleted successfully');
                    } else {
                        console.error('Failed to delete farm');
                    }
                } catch (error) {
                    console.error('Error deleting farm:', error);
                }
            } else {
                console.log('User canceled the deletion');
            }
        }
        // Implement further action handling for other actions (e.g., Update, View) here
    };
    

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
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
                            <th className="px-4 py-2">Geolocations</th>
                            <th className="px-4 py-2">Phone Number 1</th>
                            <th className="px-4 py-2">Phone Number 2</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {farms.length > 0 ? (
                            farms.map((farm) => (
                                <tr key={farm.id} className="bg-gray-50 hover:bg-gray-100">
                                    <td className="border px-4 py-2">{farm.id}</td>
                                    <td className="border px-4 py-2">{farm.name}</td>
                                    <td className="border px-4 py-2">{districts[farm.district_id]}</td>
                                    <td className="border px-4 py-2">{farmerGroups[farm.farmergroup_id]}</td>
                                    <td className="border px-4 py-2">{farm.geolocation}</td>
                                    <td className="border px-4 py-2">{farm.phonenumber1}</td>
                                    <td className="border px-4 py-2">{farm.phonenumber2}</td>
                                    <td className="border px-4 py-2">
                                        <div className="relative">
                                            <button
                                                onClick={() => handleDropdownToggle(farm.id)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
                                            >
                                                Actions
                                            </button>
                                            {dropdownOpen === farm.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                                                    <button
                                                        onClick={() => handleAction('Update', farm.id)}
                                                        className="block px-4 py-2 text-teal-600 hover:bg-teal-100 w-full text-left"
                                                    >
                                                        Update
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('Delete', farm.id)}
                                                        className="block px-4 py-2 text-red-600 hover:bg-red-100 w-full text-left"
                                                    >
                                                        Delete
                                                    </button>
                                                    <Link
                                                        to={{
                                                            pathname: "/mapview",  // Adjust the path to match your route setup
                                                        }}
                                                        state={{owner_id: farm.id,
                                                            owner_type: "farmer",
                                                            geolocation: farm.geolocation
                                                        }}
                                                        className="block px-4 py-2 text-blue-600 hover:bg-blue-100 w-full text-left"
                                                    >
                                                       View
                                                    </Link>
                                                    <Link
                                                        to="/farmdata"
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                        Add FD
                                                    </Link>
                                                    <Link
                                                        to={{
                                                            pathname: "/mapbox",  // Adjust the path to match your route setup
                                                        }}
                                                        state={{owner_id: farm.id,
                                                            owner_type: "farmer",
                                                            geolocation: farm.geolocation
                                                        }}
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                       Create Maps
                                                    </Link>
                                                    <Link
                                                        to={{
                                                            pathname: "/reportfarmer",  // Adjust the path to match your route setup
                                                        }}
                                                        state={{farmId: farm.id,
                                                        }}
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                     view report
                                                    </Link>

                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="border px-4 py-2 text-center">No farms available</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-l disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-r disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FarmList;
