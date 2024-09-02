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
          className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex">
            {/* Left Side */}
            <div className="w-1/2 pr-4">
              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="farm_id">
                  Farm ID
                </label>
                <input
                  type="text"
                  name="farm_id"
                  id="farm_id"
                  placeholder="Farm ID"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="phone_number">
                  Farmer Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  placeholder="Phone Number"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="district">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  id="district"
                  placeholder="District"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-lg text-gray-800 mb-2">Produce Category and Grade</label>
                <select
                  name="agroInputCategory"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4"
                  required
                >
                  <option value="">Select Produce Categorie</option>
                  <option value="coffee">Coffee</option>
                  <option value="cocoa">Cocoa</option>
                  <option value="maize">Maize</option>
                  <option value="soybean">Soybean</option>
                </select>

                <select
                  name="agroInputType"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4"
                  required
                >
                  <option value="">Select Produce Grade</option>
                  <option value="grade1">Grade 1</option>
                  <option value="grade2">Grade 2</option>
                  <option value="grade3">Grade 3</option>
                  <option value="grade4">Grade 4</option>
                </select>
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="season">
                  Season
                </label>
                <select
                  name="season"
                  id="season"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                  required
                >
                  <option value="">Select a season</option>
                  <option value="season1">Season 1</option>
                  <option value="season2">Season 2</option>
                  <option value="season3">Season 3</option>
                  <option value="season4">Season 4</option>
                </select>
              </div>
            </div>

            {/* Right Side */}
            <div className="w-1/2 pl-4">
              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="produce_weight">
                  Produce Weight (kgs)
                </label>
                <input
                  type="text"
                  name="produce_weight"
                  id="produce_weight"
                  placeholder="Produce Weight (kgs)"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="price_per_kg">
                  Price / kg (Ugshs)
                </label>
                <input
                  type="text"
                  name="price_per_kg"
                  id="price_per_kg"
                  placeholder="Price per kg (Ugshs)"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="total_value">
                  Total Price (Ugshs)
                </label>
                <input
                  type="text"
                  name="total_value"
                  id="total_value"
                  placeholder="Total Value (Ugshs)"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="payment_type">
                  Payment Type
                </label>
                <select
                  name="payment_type"
                  id="payment_type"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                  required
                >
                  <option value="" disabled>Select a payment type</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                  <option value="mobilemoney">Mobile Money</option>
                  <option value="visa">Visa</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="store_id">
                  Store ID
                </label>
                <input
                  type="text"
                  name="store_id"
                  id="store_id"
                  placeholder="Store ID"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                  required
                />
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="store_name">
                  Store Name
                </label>
                <select
                  name="store_name"
                  id="store_name"
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                  required
                >
                  <option value="" disabled>Select a Store Name</option>
                  <option value="store1">Store 1</option>
                  <option value="store2">Store 2</option>
                </select>
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="transaction_date">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  id="transaction_date"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-8">
          <button
              type="submit"
              className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white px-8 py-4 rounded-lg w-full text-lg font-bold transition-all transform hover:scale-105"
            >
              Generate QR Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateQrCodeAndReceipt;
