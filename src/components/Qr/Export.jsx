import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axiosInstance from '../../axiosInstance'; // Assuming axiosInstance is imported from a utility file

const PointForm = () => { // Removed farmId prop since it’s not used in the provided code
  const navigate = useNavigate();
  const qrCodeContainerRef = useRef(null);

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

  const [farms, setFarms] = useState([]); // State to hold farms data
  const [qrCodes, setQrCodes] = useState([]); // State to hold generated QR codes

  const handleFarmIdChange = (e) => {
    const farm_id = e.target.value;

    // Update farm_id in form data
    setFormData(prevFormData => ({ ...prevFormData, farm_id }));

    // Fetch the corresponding farm properties
    if (farm_id) {
      axiosInstance.get(`/api/farm/${farm_id}/allprop`)
        .then(response => {
          if (response.data.status === 'success') {
            const farmProperties = response.data.data[0]; // Assuming you get a list of farm properties
            setFormData(farmProperties);
          }
        })
        .catch(error => {
          console.error('Error fetching farm properties:', error);
        });
    }
  };

  useEffect(() => {
    // Fetch farms data using axiosInstance
    const fetchFarms = async () => {
      try {
        const { data } = await axiosInstance.get('/api/farm/');
        setFarms(data.farms || []); // Ensure data.farms is an array
      } catch (error) {
        console.error('Error fetching farms:', error);
      }
    };

    fetchFarms();
  }, []);

  useEffect(() => {
    if (qrCodes.length > 0 && qrCodeContainerRef.current) {
      qrCodeContainerRef.current.innerHTML = ''; // Clear previous QR codes
      qrCodes.forEach((qrCodeData, index) => {
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
          data: qrCodeData
        });
        const qrCodeElement = document.createElement('div');
        qrCode.append(qrCodeElement);
        qrCodeContainerRef.current.appendChild(qrCodeElement);
      });
    }
  }, [qrCodes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const batchNumber = parseInt(formData.batch_number, 10);
    
    if (isNaN(batchNumber) || batchNumber <= 0) {
      alert('Invalid batch number. Please enter a positive integer.');
      return;
    }

    // Generate QR codes based on batch number
    const qrCodesData = Array.from({ length: batchNumber }, () => JSON.stringify(formData));
    setQrCodes(qrCodesData);
  };

  const downloadPdf = async () => {
    if (qrCodeContainerRef.current) {
      const canvasPromises = Array.from(qrCodeContainerRef.current.children).map(child =>
        html2canvas(child).then(canvas => canvas.toDataURL('image/png'))
      );

      const imgDataArray = await Promise.all(canvasPromises);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      imgDataArray.forEach((imgData, index) => {
        if (index > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 190); // Adjust dimensions as needed
      });

      pdf.save(`${formData.farm_id}_QRCode.pdf`);
    }
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
                {/* Farm ID Dropdown */}
                <div className="mb-4">
                  <label htmlFor="farm_id" className="block text-sm font-medium text-gray-700">
                    Farm ID:
                  </label>
                  <select
                    id="farm_id"
                    name="farm_id"
                    value={formData.farm_id || ''}
                    onChange={handleFarmIdChange} // Update handler to handle farm ID change
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Farm</option>
                    {farms.map(farm => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name} - {farm.subcounty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Other Form Fields */}
                {[
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
                {/* Batch Number */}
                <div className="mb-4">
                  <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700">
                    Batch Number:
                  </label>
                  <input
                    type="number"
                    id="batch_number"
                    name="batch_number"
                    value={formData.batch_number || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                
                {/* Remaining Fields */}
                {[
                  { label: 'Harvest Date', name: 'harvest_date', type: 'date' },
                  { label: 'Geolocation', name: 'geolocation', type: 'text' },
                  { label: 'Store Name', name: 'store_name', type: 'text' },
                  { label: 'Season', name: 'season', type: 'text' },
                  { label: 'Destination Country', name: 'destination_country', type: 'text' },
                  { label: 'Channel Partner', name: 'channel_partner', type: 'text' },
                  { label: 'End Customer Name', name: 'end_customer_name', type: 'text' }
                ].map(({ label, name, type }) => (
                  <div className="mb-4" key={name}>
                    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                      {label}:
                    </label>
                    <input
                      type={type}
                      id={name}
                      name={name}
                      value={formData[name] || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition ease-in-out duration-300"
              >
                Generate QR Codes
              </button>

              {qrCodes.length > 0 && (
                <div className="flex flex-col items-center mt-6">
                  <div ref={qrCodeContainerRef} className="mb-4"></div>
                  <button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition ease-in-out duration-300"
                    onClick={downloadPdf}
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PointForm;
