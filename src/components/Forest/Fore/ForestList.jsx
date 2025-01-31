import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../../axiosInstance';
import { Link } from 'react-router-dom';

const ForestList = () => {
    const [forests, setForests] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [editingForestId, setEditingForestId] = useState(null);
    const [editedForest, setEditedForest] = useState({});

    useEffect(() => {
        fetchForests(currentPage);
    }, [currentPage]);

    const fetchForests = async (page) => {
        try {
            const response = await axiosInstance.get(`/api/forest/?page=${page}`);
            setForests(response.data.forests);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch forests. Please try again.',
            });
        }
    };

    const handleDropdownToggle = (forestId) => {
        setDropdownOpen(dropdownOpen === forestId ? null : forestId);
    };

    const handleEditClick = (forest) => {
        setEditingForestId(forest.id);
        setEditedForest({ ...forest });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedForest((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async () => {
        try {
            const response = await axiosInstance.post(`/api/forest/${editingForestId}/update`, {
                name: editedForest.name,
                tree_type: editedForest.tree_type,
            });

            if (response.data.success) {
                setForests((prevForests) =>
                    prevForests.map((forest) =>
                        forest.id === editingForestId ? editedForest : forest
                    )
                );
                setEditingForestId(null);

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Forest updated successfully.',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update the forest.',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while updating the forest.',
            });
        }
    };

    const handleAction = async (action, forestId) => {
        if (action === 'Delete') {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
            });

            if (result.isConfirmed) {
                try {
                    const response = await axiosInstance.post(`/api/forest/${forestId}/delete`);
                    if (response.data.success) {
                        setForests(forests.filter((forest) => forest.id !== forestId));
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'The forest has been deleted.',
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Failed to delete the forest.',
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'An error occurred while deleting the forest.',
                    });
                }
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
                                    <td className="border px-4 py-2">
                                        {editingForestId === forest.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={editedForest.name}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            forest.name
                                        )}
                                    </td>
                                    <td className="border px-4 py-2">
                                        {editingForestId === forest.id ? (
                                            <input
                                                type="text"
                                                name="tree_type"
                                                value={editedForest.tree_type}
                                                onChange={handleInputChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            forest.tree_type
                                        )}
                                    </td>
                                    <td className="border px-4 py-2">
                                        <div className="relative">
                                            {editingForestId === forest.id ? (
                                                <button
                                                    onClick={handleSaveClick}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
                                                >
                                                    Validate
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditClick(forest)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded mr-2"
                                                >
                                                    Update
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDropdownToggle(forest.id)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
                                            >
                                                Actions
                                            </button>
                                            {dropdownOpen === forest.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                                                    <button
                                                        onClick={() => handleAction('Delete', forest.id)}
                                                        className="block px-4 py-2 text-red-600 hover:bg-red-100 w-full text-left"
                                                    >
                                                        Delete
                                                    </button>
                                                    <Link
                                                        to={{ pathname: "/mapview" }}
                                                        state={{ owner_id: forest.id, owner_type: "forest" }}
                                                        className="block px-4 py-2 text-blue-600 hover:bg-blue-100 w-full text-left"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        to={{ pathname: "/mapbox" }}
                                                        state={{ owner_id: forest.id, owner_type: "forest" }}
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                        Create Maps
                                                    </Link>
                                                    <Link
                                                        to={{ pathname: "/reportforest" }}
                                                        state={{ forestId: forest.id }}
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                        View Report
                                                    </Link>
                                                    <Link
                                                        to={{
                                                            pathname: "/reportcarbonforest",  // Adjust the path to match your route setup
                                                        }}
                                                        state={{
                                                            forestId: forest.id,
                                                        }}
                                                        className="block px-4 py-2 text-green-600 hover:bg-green-100 w-full text-left"
                                                    >
                                                        Carbon report
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
