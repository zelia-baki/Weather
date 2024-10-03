import React from 'react';
import { Link } from 'react-router-dom';

const FarmDataManager = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-extrabold text-teal-700">Create / Edit Farm Data</h1>
                    {/* <Link to="/" className="text-gray-500 hover:text-gray-700 text-2xl">
                        &times;
                    </Link> */}
                </div>
                <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="farm_id" className="block text-gray-700">Farm:</label>
                            <select
                                name="farm_id"
                                id="farm_id"
                                className="border rounded p-2 w-full"
                                required
                            >
                                <option value="">Select Farm</option>
                                {/* Options should be populated dynamically */}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="crop_id" className="block text-gray-700">Crop:</label>
                            <select
                                name="crop_id"
                                id="crop_id"
                                className="border rounded p-2 w-full"
                                required
                            >
                                <option value="">Select Crop</option>
                                {/* Options should be populated dynamically */}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="land_type" className="block text-gray-700">Land Type:</label>
                            <input
                                type="text"
                                name="land_type"
                                id="land_type"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="tilled_land_size" className="block text-gray-700">Tilled Land Size:</label>
                            <input
                                type="number"
                                name="tilled_land_size"
                                id="tilled_land_size"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="planting_date" className="block text-gray-700">Planting Date:</label>
                            <input
                                type="date"
                                name="planting_date"
                                id="planting_date"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="season" className="block text-gray-700">Season:</label>
                            <input
                                type="number"
                                name="season"
                                id="season"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="quality" className="block text-gray-700">Quality:</label>
                            <input
                                type="text"
                                name="quality"
                                id="quality"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-gray-700">Quantity:</label>
                            <input
                                type="number"
                                name="quantity"
                                id="quantity"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="harvest_date" className="block text-gray-700">Harvest Date:</label>
                            <input
                                type="date"
                                name="harvest_date"
                                id="harvest_date"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="expected_yield" className="block text-gray-700">Expected Yield:</label>
                            <input
                                type="number"
                                name="expected_yield"
                                id="expected_yield"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="actual_yield" className="block text-gray-700">Actual Yield:</label>
                            <input
                                type="number"
                                name="actual_yield"
                                id="actual_yield"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="timestamp" className="block text-gray-700">Timestamp:</label>
                            <input
                                type="datetime-local"
                                name="timestamp"
                                id="timestamp"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        {/* <div>
                            <label htmlFor="channel_partner" className="block text-gray-700">Channel Partner:</label>
                            <input
                                type="text"
                                name="channel_partner"
                                id="channel_partner"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="destination_country" className="block text-gray-700">Destination Country:</label>
                            <input
                                type="text"
                                name="destination_country"
                                id="destination_country"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="customer_name" className="block text-gray-700">Customer Name:</label>
                            <input
                                type="text"
                                name="customer_name"
                                id="customer_name"
                                className="border rounded p-2 w-full"
                                required
                            />
                        </div> */}
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <Link
                            to="/farmmanager"
                            className="bg-gray-500 text-white py-2 px-4 rounded inline-flex items-center"
                        >
                            <span>Cancel</span>
                        </Link>
                        <button
                            type="submit"
                            className="bg-teal-500 text-white py-2 px-4 rounded"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FarmDataManager;
