import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../axiosInstance'; // Ensure the path is correct for your project structure
import { Link } from 'react-router-dom';

const ForestList = () => {
    const [forests, setForests] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dropdownOpen, setDropdownOpen] = useState(null);

    useEffect(() => {
        fetchForests(currentPage);
    }, [currentPage]);

    const fetchForests = async (page) => {
        try {
            const response = await axiosInstance.get(`/api/forest/?page=${page}`);
            setForests(response.data.forests);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Error fetching forests:', error);
        }
    };

    const handleDropdownToggle = (forestId) => {
        setDropdownOpen(dropdownOpen === forestId ? null : forestId);
    };

    const handleAction = async (action, forestId) => {
        console.log(`${action} action for forest ID: ${forestId}`);
    
        if (action === 'Delete') {
            const userConfirmed = window.confirm('Are you sure you want to delete this forest? This action cannot be undone.');
            
            if (userConfirmed) {
                try {
                    const response = await axiosInstance.post(`/api/forest/${forestId}/delete`);
                    if (response.data.success) {
                        setForests(forests.filter(forest => forest.id !== forestId));
                        console.log('Forest deleted successfully');
                    } else {
                        console.error('Failed to delete forest');
                    }
                } catch (error) {
                    console.error('Error deleting forest:', error);
                }
            } else {
                console.log('User canceled the deletion');
            }
        }
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700">Forest List</h1>
            <div className="bg-white rounded-lg shadow-lg">
                <table className="w-full table-auto border-collapse">
                    <thead>
                        <tr className="bg-teal-500 text-white">
                            <th className="px-4 py-2">Forest ID</th>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Tree Type</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forests.length > 0 ? (
                            forests.map((forest) => (
                                <tr key={forest.id} className="bg-gray-50 hover:bg-gray-100">
                                    <td className="border px-4 py-2">{forest.id}</td>
                                    <td className="border px-4 py-2">{forest.name}</td>
                                    <td className="border px-4 py-2">{forest.tree_type}</td>
                                    <td className="border px-4 py-2">
                                        <div className="relative">
                                            <button
                                                onClick={() => handleDropdownToggle(forest.id)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
                                            >
                                                Actions
                                            </button>
                                            {dropdownOpen === forest.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                                                    <button
                                                        onClick={() => handleAction('Update', forest.id)}
                                                        className="block px-4 py-2 text-teal-600 hover:bg-teal-100 w-full text-left"
                                                    >
                                                        Update
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction('Delete', forest.id)}
                                                        className="block px-4 py-2 text-red-600 hover:bg-red-100 w-full text-left"
                                                    >
                                                        Delete
                                                    </button>
                                                    <Link
                                                        to={{
                                                            pathname: "/mapview",
                                                        }}
                                                        state={{ owner_id: forest.id, owner_type: "forest" }}
                                                        className="block px-4 py-2 text-blue-600 hover:bg-blue-100 w-full text-left"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        to={{
                                                            pathname: "/mapbox",
                                                        }}
                                                        state={{ owner_id: forest.id }}
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                        Create Maps
                                                    </Link>
                                                    <Link
                                                        to={{
                                                            pathname: "/reportforest",
                                                        }}
                                                        state={{ forestId: forest.id }}
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
                                <td colSpan="4" className="border px-4 py-2 text-center">No forests available</td>
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

export default ForestList;
