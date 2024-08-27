import React, { useState } from 'react';

const GenerateTreeCuttingQrCode = () => {
  const [isExportChecked, setIsExportChecked] = useState(false);

  const handleExportCheckboxChange = (e) => {
    setIsExportChecked(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        await axiosInstance.post('/api/generate_tree_qr', formData);
        onClose(); // Close the modal after successful submission
    } catch (error) {
        console.error('Error creating farm:', error);
    }
};

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
          Generate Digital Codes for Tree Cutting
        </h1>
        <form
          onSubmit={handleSubmit}
          method="post"
          className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">Forest Name</label>
                <input
                  type="text"
                  name="forest_name"
                  placeholder="Forest Name"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">Forest ID</label>
                <input
                  type="text"
                  name="forest_id"
                  placeholder="Forest ID"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">Tree Type</label>
                <input
                  type="text"
                  name="tree_type"
                  placeholder="Tree Type"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">Date of Cutting</label>
                <input
                  type="date"
                  name="date_cutting"
                  placeholder="Date of Cutting"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">GPS Coordinates</label>
                <input
                  type="text"
                  name="gps_coordinates"
                  placeholder="GPS Coordinates"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">Height (m)</label>
                <input
                  type="text"
                  name="height"
                  placeholder="Height (m)"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-lg text-gray-800 mb-2">Diameter (cm)</label>
                <input
                  type="text"
                  name="diameter"
                  placeholder="Diameter (cm)"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="exportCheckbox"
                  name="export"
                  className="form-checkbox h-5 w-5 text-teal-600 focus:ring-teal-400"
                  checked={isExportChecked}
                  onChange={handleExportCheckboxChange}
                />
                <label htmlFor="exportCheckbox" className="ml-3 text-lg text-gray-800">Export</label>
              </div>
              <input
                type="text"
                id="exportName"
                name="export_name"
                placeholder="Export Name"
                className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                disabled={!isExportChecked}
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white px-8 py-4 rounded-lg w-full text-lg font-bold transition-all transform hover:scale-105"
          >
            Generate Digital Codes for Tree Cutting
          </button>
        </form>
      </div>
    </div>
  );
};

export default GenerateTreeCuttingQrCode;
