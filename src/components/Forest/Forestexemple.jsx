import React from "react";

const ForestAndPointManagement = () => {
    return (
        <div className="container mx-auto px-4 py-8 bg-white shadow-lg rounded-lg">
            <h1 className="text-4xl font-extrabold mb-8 text-center text-green-700">
                Forest and Point Management
            </h1>

            <div className="flex justify-center mb-8 space-x-4">
                <a href="/map/get_all_forests_geojson" className="text-lg font-semibold text-white bg-green-600 hover:bg-green-700 px-6 py-3 rounded-md shadow transition duration-300">
                    View All Forests on Map
                </a>
                <a href="/points/create" className="text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md shadow transition duration-300">
                    Create Point
                </a>
                <a href="/tree/create" className="text-lg font-semibold text-white bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-md shadow transition duration-300">
                    Create Tree
                </a>
            </div>

            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                Forests
            </h2>

            <form
                action="/forest/handle_create_forest"
                method="post"
                className="mb-6 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0"
                encType="multipart/form-data"
            >
                <input
                    type="text"
                    name="name"
                    placeholder="Forest Name"
                    className="border rounded-md px-4 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <input
                    type="text"
                    name="tree_type"
                    placeholder="Tree Type"
                    className="border rounded-md px-4 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="border rounded-md px-4 py-3 flex-grow text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <button
                    type="submit"
                    className="bg-green-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition duration-300"
                >
                    Create Forest
                </button>
            </form>

            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 px-6 py-3 text-left text-gray-700 font-medium">
                                Forest Name
                            </th>
                            <th className="border border-gray-300 px-6 py-3 text-left text-gray-700 font-medium">
                                Tree Type
                            </th>
                            <th className="border border-gray-300 px-6 py-3 text-left text-gray-700 font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Render the rows dynamically here */}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-10">
                <a href="#" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mx-1 transition duration-300">
                    &laquo; Prev
                </a>
                <a href="#" className="px-4 py-2 bg-green-600 text-white rounded-md mx-1 shadow transition duration-300 hover:bg-green-700">
                    1
                </a>
                <a href="#" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mx-1 transition duration-300">
                    Next &raquo;
                </a>
            </div>
        </div>
    );
};

export default ForestAndPointManagement;
