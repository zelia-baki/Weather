import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PointsList = () => {
  const [points, setPoints] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasPrev: false,
    hasNext: false
  });

  useEffect(() => {
    // Fetch points data and pagination info
    const fetchPoints = async () => {
      try {
        const response = await axios.get(`/api/points?page=${pagination.currentPage}`);
        setPoints(response.data.points);
        setPagination({
          currentPage: response.data.page,
          totalPages: response.data.totalPages,
          hasPrev: response.data.hasPrev,
          hasNext: response.data.hasNext
        });
      } catch (error) {
        console.error('Error fetching points data:', error);
      }
    };

    fetchPoints();
  }, [pagination.currentPage]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Points</h1>
      <div className="flex justify-center mb-6">
        <Link to="/points/create" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Create Point
        </Link>
        <Link to="/points/upload" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create Point from CSV
        </Link>
      </div>

      <ul className="space-y-4">
        {points.map(point => (
          <li key={point.id} className="border p-4 rounded shadow-md bg-white hover:bg-gray-100">
            <div className="flex justify-between items-center">
              <span>{point.longitude} - {point.latitude}</span>
              <div className="space-x-2">
                <Link to={`/points/${point.id}`} className="text-blue-500 hover:underline">View</Link>
                <Link to={`/points/edit/${point.id}`} className="text-blue-500 hover:underline">Edit</Link>
                <button 
                  onClick={() => handleDelete(point.id)} 
                  className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        {pagination.hasPrev && (
          <button 
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mx-1">
            &laquo; Prev
          </button>
        )}
        {Array.from({ length: pagination.totalPages }, (_, index) => (
          <button
            key={index}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: index + 1 }))}
            className={`px-4 py-2 rounded mx-1 ${pagination.currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}>
            {index + 1}
          </button>
        ))}
        {pagination.hasNext && (
          <button 
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 mx-1">
            Next &raquo;
          </button>
        )}
      </div>
    </div>
  );
};

const handleDelete = async (id) => {
  try {
    await axios.delete(`/api/points/${id}`);
    // Refresh the list after deletion
    window.location.reload();
  } catch (error) {
    console.error('Error deleting point:', error);
  }
};

export default PointsList;
