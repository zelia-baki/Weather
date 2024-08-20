import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DistrictForm = ({ district }) => {
    const [name, setName] = useState(district ? district.name : '');
    const [region, setRegion] = useState(district ? district.region : '');
    const navigate = useNavigate();



    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">
                {district ? 'Edit' : 'Create'} District
            </h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700">Name:</label>
                    <input
                        type="text"
                        name="name"
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
                        name="region"
                        id="region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-indigo-500"
                        placeholder="Enter region name"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {district ? 'Update' : 'Create'}
                </button>
            </form>
            <Link to="/districts" className="mt-4 inline-block text-sm text-gray-600 hover:text-gray-800">
                Back to List
            </Link>
        </div>
    );
};

export default DistrictForm;
