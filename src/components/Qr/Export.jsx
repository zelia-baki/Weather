import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PointForm = ({ farmId }) => {
  const navigate = useNavigate();
  const qrCodeRef = useRef(null);

  const [formData, setFormData] = useState({
    farm_id: '',
    farmergroup_name: '',
    district_name: '',
    country_of_origin: '',
    crop_category: '',
    crop_grade: '',
    crop_quality: '',
    produce_weight: '',
    batch_number: '',
    harvest_date: '',
    timestamp: '',
    geolocation: '',
    store_name: '',
    season: '',
    destination_country: '',
    channel_partner: '',
    end_customer_name: '',
  });

  const [generateQRCode, setGenerateQRCode] = useState(false);

  useEffect(() => {
    // Fetch farm properties using the API
    fetch(`http://127.0.0.1:5000/api/farm/${farmId}/allprop`)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setFormData(data.data[0]); // Assuming there's only one farm returned
        } else {
          console.error('No data found for the provided farm ID');
        }
      })
      .catch(error => console.error('Error fetching farm properties:', error));
  }, [farmId]);

  useEffect(() => {
    if (generateQRCode && qrCodeRef.current) {
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
        },
        data: JSON.stringify(formData)
      });

      qrCode.append(qrCodeRef.current);
      setGenerateQRCode(false); // Reset the QR code generation flag
    }
  }, [generateQRCode, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGenerateQRCode(true); // Trigger QR code generation
  };

  const downloadPdf = async () => {
    const canvas = await html2canvas(qrCodeRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [300, 300]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 300, 300);
    pdf.save(`${formData.farm_id}_QRCode.pdf`);
  };

  return (
    <div className="bg-gradient-to-r from-green-200 via-blue-200 to-purple-300 min-h-screen py-8">
      <div className="container mx-auto py-8 bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold text-gray-800">Agriyields Digital Codes Generator</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition ease-in-out duration-300"
            onClick={() => navigate('/home')}
          >
            Home
          </button>
        </div>
        <h1 className="text-4xl font-extrabold mb-4 text-center text-gray-900">Digital Export Stamps</h1>
        <div id="form-container" className="max-w-4xl mx-auto bg-gray-50 p-6 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side */}
              <div className="space-y-4">
                {[
                  { label: 'Farm ID', name: 'farm_id', type: 'text' },
                  { label: 'Farmer Group Name', name: 'farmergroup_name', type: 'text' },
                  { label: 'District', name: 'district_name', type: 'text' },
                  { label: 'Country of Origin', name: 'country_of_origin', type: 'text' },
                  {
                    label: 'Crop Category',
                    name: 'crop_category',
                    type: 'select',
                    options: ['Coffee', 'Cocoa', 'Palm Oil', 'Soybean']
                  },
                  {
                    label: 'Crop Grade',
                    name: 'crop_grade',
                    type: 'select',
                    options: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
                  },
                  {
                    label: 'Crop Quality',
                    name: 'crop_quality',
                    type: 'select',
                    options: ['Quality A', 'Quality B', 'Quality C']
                  },
                  { label: 'Produce Weight (Kgs)', name: 'produce_weight', type: 'text' },
               
                  { label: 'Timestamp (Transaction Date)', name: 'timestamp', type: 'datetime-local' }
                ].map(({ label, name, type, options }) => (
                  <div className="mb-4" key={name}>
                    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                      {label}:
                    </label>
                    {type === 'select' ? (
                      <select
                        id={name}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select {label}</option>
                        {options.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={type}
                        id={name}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Right Side */}
              <div className="space-y-4">
                {[
                  { label: 'Geolocation', name: 'geolocation', type: 'text' },
                  { label: 'Store Name', name: 'store_name', type: 'select', options: ['Store 1', 'Store 2', 'Store 3'] },
                  { label: 'Season', name: 'season', type: 'select', options: ['Season 1', 'Season 2', 'Season 3'] },
                  { label: 'Batch Number', name: 'batch_number', type: 'text' },
                  { label: 'Harvest Date', name: 'harvest_date', type: 'date' },
                  { label: 'Destination Country', name: 'destination_country', type: 'text' },
                  { label: 'Channel Partner', name: 'channel_partner', type: 'text' },
                  { label: 'End Customer Name', name: 'end_customer_name', type: 'text' }
                ].map(({ label, name, type, options }) => (
                  <div className="mb-4" key={name}>
                    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                      {label}:
                    </label>
                    {type === 'select' ? (
                      <select
                        id={name}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select {label}</option>
                        {options.map(option => (
                          <option key={option} value={option.toLowerCase()}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={type}
                        id={name}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition ease-in-out duration-300"
              >
                Generate QR Code
              </button>
            </div>
          </form>
        </div>

        {generateQRCode && (
          <div className="mt-8 flex flex-col items-center">
            <div id="qr-code" ref={qrCodeRef} className="mb-4"></div>
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition ease-in-out duration-300"
              onClick={downloadPdf}
            >
              Download QR Code as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointForm;
