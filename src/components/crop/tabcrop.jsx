import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrashAlt, FaInfoCircle } from 'react-icons/fa';
import { MdOutlineClose } from 'react-icons/md';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const sampleCrops = [
  { id: 1, name: 'Corn', weight: '50kg', category_id: 'Grain' },
  { id: 2, name: 'Wheat', weight: '40kg', category_id: 'Grain' },
  // Add more crop data if needed
];

const CropManagement = () => {
  const [crops, setCrops] = useState(sampleCrops);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create' or 'edit'
  const [dropdownOpen, setDropdownOpen] = useState(null); // Crop ID for dropdown open state

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (type, crop) => {
    setModalType(type);
    setSelectedCrop(crop);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCrop(null);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    // Implement form submission logic here
  };

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  const showDetails = (crop) => {
    MySwal.fire({
      title: 'Crop Details',
      html: `
        <p><strong>Name:</strong> ${crop.name}</p>
        <p><strong>Weight:</strong> ${crop.weight}</p>
        <p><strong>Category:</strong> ${crop.category_id}</p>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
      confirmButtonColor: '#3085d6',
    });
  };

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-green-50 via-yellow-50 to-blue-50 min-h-screen font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center text-green-700">Crop Management</h1>
      <div className="flex justify-between mb-8">
        <button
          onClick={() => openModal('create')}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md flex items-center transition"
        >
          <FaPlus className="w-5 h-5 mr-2" />
          Create Crop
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-green-800">Crop List</h2>
        <table className="w-full table-auto border border-gray-300 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-green-100 text-green-700">
              <th className="py-2 px-3 text-left">Name</th>
              <th className="py-2 px-3 text-left">Weight</th>
              <th className="py-2 px-3 text-left">Category</th>
              <th className="py-2 px-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crops.map((crop) => (
              <tr key={crop.id} className="bg-white hover:bg-gray-100">
                <td className="border-t py-2 px-3 text-left">{crop.name}</td>
                <td className="border-t py-2 px-3 text-left">{crop.weight}</td>
                <td className="border-t py-2 px-3 text-left">{crop.category_id}</td>
                <td className="border-t py-2 px-3 text-left flex items-center space-x-2">
                  <button
                    onClick={() => showDetails(crop)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-lg flex items-center transition"
                  >
                    <FaInfoCircle className="w-5 h-5 mr-1" />
                    Details
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(crop.id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-3 rounded-lg flex items-center transition"
                    >
                      <MdOutlineClose className="w-5 h-5 mr-1" />
                      Actions
                    </button>
                    {dropdownOpen === crop.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-lg shadow-lg"
                      >
                        <button
                          onClick={() => openModal('edit', crop)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-200 w-full text-left rounded-t-lg flex items-center"
                        >
                          <FaEdit className="w-5 h-5 mr-2 text-green-600" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // Implement delete logic here
                          }}
                          className="block px-4 py-2 text-red-600 hover:bg-red-100 w-full text-left rounded-b-lg flex items-center"
                        >
                          <FaTrashAlt className="w-5 h-5 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">
              {modalType === 'create' ? 'Create Crop' : modalType === 'edit' ? 'Edit Crop' : 'Crop Details'}
            </h2>
            {modalType === 'details' ? (
              <div>
                <p><strong>Name:</strong> {selectedCrop?.name}</p>
                <p><strong>Weight:</strong> {selectedCrop?.weight}</p>
                <p><strong>Category:</strong> {selectedCrop?.category_id}</p>
                <button
                  onClick={closeModal}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg mt-4 flex items-center justify-center transition"
                >
                  <MdOutlineClose className="w-5 h-5 mr-2" />
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <label className="block mb-4">
                  <span className="text-gray-700">Name</span>
                  <input
                    type="text"
                    className="form-input mt-1 block w-full border rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    defaultValue={selectedCrop?.name || ''}
                  />
                </label>
                <label className="block mb-4">
                  <span className="text-gray-700">Weight</span>
                  <input
                    type="text"
                    className="form-input mt-1 block w-full border rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    defaultValue={selectedCrop?.weight || ''}
                  />
                </label>
                <label className="block mb-4">
                  <span className="text-gray-700">Category</span>
                  <input
                    type="text"
                    className="form-input mt-1 block w-full border rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                    defaultValue={selectedCrop?.category_id || ''}
                  />
                </label>
                <div className="flex justify-end space-x-2">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
                  >
                    <FaPlus className="w-5 h-5 mr-2" />
                    {modalType === 'create' ? 'Create' : 'Save'}
                  </button>n
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center"
                  >
                    <MdOutlineClose className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CropManagement;
