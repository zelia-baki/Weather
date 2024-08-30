import React, { useState, useRef, useEffect } from 'react';
import QRCodeStyling from 'qr-code-styling';

const GenerateFertilizerQrCode = () => {
  const [formData, setFormData] = useState({
    field_name: '',
    field_id: '',
    fertilizer_type: '',
    application_date: '',
    application_rate: '',
    soil_moisture: '',
    soil_ph: '',
    export_name: '',
  });
  const [isExportChecked, setIsExportChecked] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const qrCodeRef = useRef(null);

  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    dotsOptions: {
      color: "#4CAF50",
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
    const { field_name, field_id, fertilizer_type, application_date, application_rate, soil_moisture, soil_ph, export_name } = formData;
    const qrCodeData = `Field Name: ${field_name}\nField ID: ${field_id}\nFertilizer Type: ${fertilizer_type}\nApplication Date: ${application_date}\nApplication Rate: ${application_rate}\nSoil Moisture: ${soil_moisture}\nSoil pH: ${soil_ph}\nExport Name: ${export_name}`;
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
          <h1 className="text-5xl font-extrabold mb-12 text-center text-green-700">
            Generate Digital Codes for Fertilizer Application
          </h1>
          <form
            onSubmit={handleSubmit}
            method="post"
            className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Field Name</label>
                  <input
                    type="text"
                    name="field_name"
                    placeholder="Field Name"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.field_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Field ID</label>
                  <input
                    type="text"
                    name="field_id"
                    placeholder="Field ID"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.field_id}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Fertilizer Type</label>
                  <input
                    type="text"
                    name="fertilizer_type"
                    placeholder="Fertilizer Type"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.fertilizer_type}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Application Date</label>
                  <input
                    type="date"
                    name="application_date"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.application_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Application Rate (kg/ha)</label>
                  <input
                    type="text"
                    name="application_rate"
                    placeholder="Application Rate (kg/ha)"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.application_rate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Soil Moisture (%)</label>
                  <input
                    type="text"
                    name="soil_moisture"
                    placeholder="Soil Moisture (%)"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.soil_moisture}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Soil pH</label>
                  <input
                    type="text"
                    name="soil_ph"
                    placeholder="Soil pH"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.soil_ph}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="exportCheckbox"
                    name="export"
                    className="form-checkbox h-5 w-5 text-green-600 focus:ring-green-400"
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
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                  value={formData.export_name}
                  onChange={handleChange}
                  disabled={!isExportChecked}
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white px-8 py-4 rounded-lg w-full text-lg font-bold transition-all transform hover:scale-105"
            >
              Generate Digital Codes for Fertilizer Application
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

export default GenerateFertilizerQrCode;
