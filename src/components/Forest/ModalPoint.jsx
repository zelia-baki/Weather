// src/components/Forest/ModalPoint.jsx
import React from 'react';
import ReactDOM from 'react-dom';

const ModalPoint = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Create Point</h2>
        <form
          action="/point/handle_create_point"
          method="post"
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div className="flex flex-wrap -mx-2">
            <div className="w-1/2 px-2">
              <div className="mb-4">
                <label htmlFor="longitude" className="block text-lg font-semibold text-gray-600 mb-2">Longitude:</label>
                <input
                  type="text"
                  name="longitude"
                  id="longitude"
                  placeholder="Enter longitude"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="latitude" className="block text-lg font-semibold text-gray-600 mb-2">Latitude:</label>
                <input
                  type="text"
                  name="latitude"
                  id="latitude"
                  placeholder="Enter latitude"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="owner_type" className="block text-lg font-semibold text-gray-600 mb-2">Owner Type:</label>
                <select
                  name="owner_type"
                  id="owner_type"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                >
                  <option value="">Select owner type</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="forest" className="block text-lg font-semibold text-gray-600 mb-2">Forest:</label>
                <input
                  type="text"
                  name="forest"
                  id="forest"
                  placeholder="Enter forest name"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                />
              </div>
            </div>
            <div className="w-1/2 px-2">
              <div className="mb-4">
                <label htmlFor="farmer" className="block text-lg font-semibold text-gray-600 mb-2">Farmer:</label>
                <input
                  type="text"
                  name="farmer"
                  id="farmer"
                  placeholder="Enter farmer name"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="district" className="block text-lg font-semibold text-gray-600 mb-2">District:</label>
                <input
                  type="text"
                  name="district"
                  id="district"
                  placeholder="Enter district name"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="image" className="block text-lg font-semibold text-gray-600 mb-2">Image:</label>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/*"
                  className="border border-gray-300 rounded-md px-4 py-2 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700"
            >
              Create Point
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalPoint;
