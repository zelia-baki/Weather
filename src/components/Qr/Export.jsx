import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axiosInstance from '../../axiosInstance'; // Assuming axiosInstance is imported from a utility file

const PointForm = () => {
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

  const [farms, setFarms] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);

  const [countries, setCountries] = useState([]);
  const storeNames = ['Store A', 'Store B', 'Store C']; // Example options for Store Name
  const seasons = ['Season 1', 'Season 2', 'Season 3', 'Season 4']; // Example options for Season

  const handleFarmIdChange = (e) => {
    const farm_id = e.target.value;
    setFormData(prevFormData => ({ ...prevFormData, farm_id }));

    if (farm_id) {
      axiosInstance.get(`/api/farm/${farm_id}/allprop`)
        .then(response => {
          if (response.data.status === 'success') {
            const farmProperties = response.data.data[0];
            setFormData(farmProperties);
          }
        })
        .catch(error => {
          console.error('Error fetching farm properties:', error);
        });
    }
  };
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('/api/countries');  // Call the API endpoint
        setCountries(response.data);  // Update the state with the list of countries
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();  // Call fetchCountries on component mount
  }, []);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const { data } = await axiosInstance.get('/api/farm/');
        setFarms(data.farms || []);
      } catch (error) {
        console.error('Error fetching farms:', error);
      }
    };

    fetchFarms();
  }, []);

  useEffect(() => {
    if (qrCodes.length > 0 && qrCodeContainerRef.current) {
      qrCodeContainerRef.current.innerHTML = '';
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
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 190);
      });

      pdf.save(`${formData.farm_id}_QRCode.pdf`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
          Digital Export Stamps
        </h1>
        <div id="form-container" className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl">
          <form onSubmit={handleSubmit}>

            <div className="flex">
              {/* Left Side */}
              <div className="w-1/2 pr-4">
                {/* Farm ID Dropdown */}
                <div className="mb-6">
                  <label className="text-lg text-gray-800 mb-2 block" htmlFor="farm_id">
                    Farm ID:
                  </label>
                  <select
                    id="farm_id"
                    name="farm_id"
                    value={formData.farm_id || ''}
                    onChange={handleFarmIdChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
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
                  { label: 'Batch Number', name: 'batch_number', type: 'number' }, // Add this line
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
                  // { label: 'Harvest Date', name: 'harvest_date', type: 'date' }
                ].map(({ label, name, type, options }) => (
                  <div className="mb-4" key={name}>
                    <label htmlFor={name} className="text-lg text-gray-800 mb-2 block">
                      {label}:
                    </label>
                    {type === 'select' ? (
                      <select
                        id={name}
                        name={name}
                        value={formData[name] || ''}
                        onChange={handleChange}
                        className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
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
                        className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                        required
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Right Side */}
              <div className="w-1/2 pl-4">
                {/* Store Name Dropdown */}
                <div className="mb-6">
                  <label htmlFor="store_name" className="text-lg text-gray-800 mb-2 block">
                    Store Name:
                  </label>
                  <select
                    id="store_name"
                    name="store_name"
                    value={formData.store_name || ''}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  >
                    <option value="">Select Store</option>
                    {storeNames.map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                </div>

                {/* Season Dropdown */}
                <div className="mb-6">
                  <label htmlFor="season" className="text-lg text-gray-800 mb-2 block">
                    Season:
                  </label>
                  <select
                    id="season"
                    name="season"
                    value={formData.season || ''}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  >
                    <option value="">Select Season</option>
                    {seasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                {/* Geolocation */}
                <div className="mb-6">
                  <label htmlFor="geolocation" className="text-lg text-gray-800 mb-2 block">
                    Geolocation:
                  </label>
                  <input
                    type="text"
                    id="geolocation"
                    name="geolocation"
                    value={formData.geolocation || ''}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="country_of_origin" className="text-lg text-gray-800 mb-2 block">
                    Country of Origin:
                  </label>
                  <select
                    id="country_of_origin"
                    name="country_of_origin"
                    value={formData.country_of_origin}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination Country */}
                <div className="mb-6">
                  <label htmlFor="destination_country" className="text-lg text-gray-800 mb-2 block">
                    Destination Country:
                  </label>
                  <select
                    id="destination_country"
                    name="destination_country"
                    value={formData.destination_country}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  >
                    <option value="">Select Destination Country</option>
                    {countries.map(country => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channel Partner */}
                <div className="mb-6">
                  <label htmlFor="channel_partner" className="text-lg text-gray-800 mb-2 block">
                    Channel Partner:
                  </label>
                  <input
                    type="text"
                    id="channel_partner"
                    name="channel_partner"
                    value={formData.channel_partner || ''}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  />
                </div>

                {/* End Customer Name */}
                <div className="mb-6">
                  <label htmlFor="end_customer_name" className="text-lg text-gray-800 mb-2 block">
                    End Customer Name:
                  </label>
                  <input
                    type="text"
                    id="end_customer_name"
                    name="end_customer_name"
                    value={formData.end_customer_name || ''}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  />
                </div>

                {/* Timestamp (Transaction Date) */}
                <div className="mb-6">
                  <label htmlFor="timestamp" className="text-lg text-gray-800 mb-2 block">
                    Timestamp (Transaction Date):
                  </label>
                  <input
                    type="datetime-local"
                    id="timestamp"
                    name="timestamp"
                    value={formData.timestamp || ''}
                    onChange={handleChange}
                    className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                Generate QR Codes
              </button>
            </div>
          </form>
        </div>

        {qrCodes.length > 0 && (
          <div id="qr-code-container" className="mt-12" ref={qrCodeContainerRef}>
            <button
              onClick={downloadPdf}
              className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              Download PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointForm;
