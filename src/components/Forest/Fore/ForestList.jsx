import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ForestList = () => {
  const [forests, setForests] = useState([]);

  useEffect(() => {
    // Fetch forest data from your API or backend
    const fetchForests = async () => {
      const response = await fetch('/api/forests'); // Adjust the URL as needed
      const data = await response.json();
      setForests(data);
    };

    fetchForests();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Forests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Forest Name</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Tree Type</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forests.map(forest => (
              <tr key={forest.id} className="bg-white border-b hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{forest.name}</td>
                <td className="border border-gray-300 px-4 py-2">{forest.tree_type}</td>
                <td className="border border-gray-300 px-4 py-2 space-x-2">
                  <Link to={`/forest/update/${forest.id}`} className="bg-blue-500 text-white px-2 py-1 rounded">Update</Link>
                  <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDeleteForest(forest.id)}>Delete</button>
                  <Link to={`/map/forest/${forest.id}`} className="bg-green-500 text-white px-2 py-1 rounded">View</Link>
                  <Link to={`/map/forest/${forest.id}/report`} className="bg-green-500 text-white px-2 py-1 rounded">Report</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForestList;
