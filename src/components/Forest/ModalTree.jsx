import React from 'react';
import ReactDOM from 'react-dom';

const ModalTree = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-3xl font-bold text-center text-green-700 mb-6">Create Tree</h2>
        <form
          action="/tree/handle_create_tree"
          method="post"
          className="flex flex-wrap space-y-4"
          encType="multipart/form-data"
        >
          <div className="w-full flex">
            {/* Left Side */}
            <div className="w-1/2 pr-4">
              <div className="mb-4">
                <label htmlFor="tree_name" className="block text-lg font-semibold text-gray-600 mb-2">Tree Name:</label>
                <input
                  type="text"
                  name="tree_name"
                  id="tree_name"
                  placeholder="Enter tree name"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="species" className="block text-lg font-semibold text-gray-600 mb-2">Species:</label>
                <input
                  type="text"
                  name="species"
                  id="species"
                  placeholder="Enter species"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="forest_id" className="block text-lg font-semibold text-gray-600 mb-2">Forest ID:</label>
                <input
                  type="text"
                  name="forest_id"
                  id="forest_id"
                  placeholder="Enter forest ID"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="point_id" className="block text-lg font-semibold text-gray-600 mb-2">Point ID:</label>
                <input
                  type="text"
                  name="point_id"
                  id="point_id"
                  placeholder="Enter point ID"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="date_planted" className="block text-lg font-semibold text-gray-600 mb-2">Date Planted:</label>
                <input
                  type="date"
                  name="date_planted"
                  id="date_planted"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="w-1/2 pl-4">
              <div className="mb-4">
                <label htmlFor="cutting_date" className="block text-lg font-semibold text-gray-600 mb-2">Cutting Date:</label>
                <input
                  type="date"
                  name="cutting_date"
                  id="cutting_date"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="height" className="block text-lg font-semibold text-gray-600 mb-2">Height (m):</label>
                <input
                  type="number"
                  name="height"
                  id="height"
                  placeholder="Enter height in meters"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="diameter" className="block text-lg font-semibold text-gray-600 mb-2">Diameter (cm):</label>
                <input
                  type="number"
                  name="diameter"
                  id="diameter"
                  placeholder="Enter diameter in cm"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="image" className="block text-lg font-semibold text-gray-600 mb-2">Tree Image:</label>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/*"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="bg-green-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-green-700 hover:shadow-xl transition duration-300"
            >
              Create Tree
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalTree;
