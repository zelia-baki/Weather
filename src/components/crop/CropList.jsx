import React, { useState } from 'react';
import ModalEditCrop from './CropEdit';

const CropList = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const handleEditClick = (cropId) => {
    setSelectedCropId(cropId);
    setModalIsOpen(true);
    setDropdownOpen(null); // Close dropdown on action
  };

  const handleDropdownToggle = (cropId) => {
    setDropdownOpen(dropdownOpen === cropId ? null : cropId);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedCropId(null);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-teal-700">Crop Management</h1>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-teal-600">Crop List</h2>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-teal-200 text-teal-900">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Weight</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Exemple de ligne statique */}
            <tr className="bg-white hover:bg-teal-50">
              <td className="border px-6 py-3">Example Crop</td>
              <td className="border px-6 py-3">100 kg</td>
              <td className="border px-6 py-3">Category 1</td>
              <td className="border px-6 py-3 flex space-x-2">
                <div className="relative">
                  <button
                    onClick={() => handleDropdownToggle(1)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-teal-900 font-bold py-1 px-3 rounded"
                  >
                    Actions
                  </button>
                  {dropdownOpen === 1 && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md z-10">
                      <button
                        onClick={() => handleEditClick(1)}
                        className="block px-4 py-2 text-teal-700 hover:bg-teal-100 w-full text-left"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => console.log('Delete action for crop ID:', 1)}
                        className="block px-4 py-2 text-red-700 hover:bg-red-100 w-full text-left"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
            {/* Ajoutez d'autres lignes ici selon vos besoins */}
          </tbody>
        </table>
      </div>

      {/* Modal for editing crop */}
      {selectedCropId && (
        <ModalEditCrop
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          cropId={selectedCropId}
        />
      )}
    </div>
  );
};

export default CropList;
