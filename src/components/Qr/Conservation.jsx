import React, { useState, useRef, useEffect } from 'react';
import QRCodeStyling from 'qr-code-styling';

const GenerateTreeCuttingQrCode = () => {
  const [formData, setFormData] = useState({
    forest_name: '',
    forest_id: '',
    tree_type: '',
    date_cutting: '',
    gps_coordinates: '',
    height: '',
    diameter: '',
    export_name: '',
  });
  const [isExportChecked, setIsExportChecked] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const qrCodeRef = useRef(null);

  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    dotsOptions: {
      color: "#4267b2",
      type: "rounded"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 20
    }
  });

  useEffect(() => {
    if (qrCodeRef.current) {
      qrCode.append(qrCodeRef.current);
    }
    qrCode.update({ data: qrCodeUrl });
  }, [qrCodeUrl]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const { forest_name, forest_id, tree_type, date_cutting, gps_coordinates, height, diameter, export_name } = formData;
    const qrCodeData = `Forest Name: ${forest_name}\nForest ID: ${forest_id}\nTree Type: ${tree_type}\nDate of Cutting: ${date_cutting}\nGPS Coordinates: ${gps_coordinates}\nHeight: ${height}\nDiameter: ${diameter}\nExport Name: ${export_name}`;
    setQrCodeUrl(qrCodeData);
  };

  const handleExportCheckboxChange = (event) => {
    setIsExportChecked(event.target.checked);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleDownloadClick = () => {
    qrCode.download({ extension: 'png' }); // Adjust extension as needed
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="flex gap-10">
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
                    value={formData.forest_name}
                    onChange={handleChange}
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
                    value={formData.forest_id}
                    onChange={handleChange}
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
                    value={formData.tree_type}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Date of Cutting</label>
                  <input
                    type="date"
                    name="date_cutting"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    value={formData.date_cutting}
                    onChange={handleChange}
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
                    value={formData.gps_coordinates}
                    onChange={handleChange}
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
                    value={formData.height}
                    onChange={handleChange}
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
                    value={formData.diameter}
                    onChange={handleChange}
                    required
                  />
                </div>
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
        <div className="flex flex-col justify-center items-center">
          <div ref={qrCodeRef} className="mb-4">
            {/* QR Code will be rendered here */}
          </div>
          <button
            onClick={handleDownloadClick}
            className="bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-bold transition-all transform hover:scale-105"
          >
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateTreeCuttingQrCode;
