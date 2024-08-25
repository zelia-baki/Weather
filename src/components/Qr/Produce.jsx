import React, { useState } from 'react';

const GenerateQrCodeAndReceipt = () => {
  const [isExportChecked, setIsExportChecked] = useState(false);

  const handleExportCheckboxChange = (e) => {
    setIsExportChecked(e.target.checked);
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
          Generate Digital Codes and E-Receipt for Farmer
        </h1>
        <form
          action="/qr/generate_farmer_qr"
          method="post"
          className="max-w-lg mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
        >
          <input
            type="text"
            name="farm_id"
            placeholder="Farm ID"
            className="border-2 p-4 mb-6 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="weight"
            placeholder="Weight (kgs)"
            className="border-2 p-4 mb-6 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="price_per_kg"
            placeholder="Price per kg (Ugshs)"
            className="border-2 p-4 mb-6 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="total_value"
            placeholder="Total Value (Ugshs)"
            className="border-2 p-4 mb-6 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="store_id"
            placeholder="Store ID"
            className="border-2 p-4 mb-6 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="warehouse"
            placeholder="Warehouse"
            className="border-2 p-4 mb-6 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
            required
          />
          <div className="mb-6 flex items-center">
            <label className="inline-flex items-center text-lg text-gray-800">
              <input
                type="checkbox"
                id="exportCheckbox"
                name="export"
                className="form-checkbox h-5 w-5 text-teal-600 focus:ring-teal-400"
                checked={isExportChecked}
                onChange={handleExportCheckboxChange}
              />
              <span className="ml-3">Export</span>
            </label>
          </div>
          <div className="mb-6">
            <input
              type="text"
              id="exportName"
              name="export_name"
              placeholder="Observation "
              className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
              disabled={!isExportChecked}
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white px-8 py-4 rounded-lg w-full text-lg font-bold transition-all transform hover:scale-105"
          >
            Generate Digital Codes and E-Receipt
          </button>
        </form>
      </div>
    </div>
  );
};

export default GenerateQrCodeAndReceipt;
