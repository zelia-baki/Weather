import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PointForm = ({ point, qrImage, farmId }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    country: 'Uganda',
    farm_id: 'Lwetutte Brian',
    group_id: 'HFZ Kabumba',
    geolocation: '0.545614,32.579339',
    land_boundaries: 'http://164.92.211.54:5000/boundaries/Wakiso/WAK0002',
    district: 'Wakiso',
    crop: 'Hass Avocado',
    grade: '4',
    tilled_land_size: '2.0 ACRES',
    season: '2',
    quality: '1',
    produce_weight: '2 KG',
    harvest_date: '2024-08-29',
    timestamp: '2024-08-30T20:03:00',
    district_region: 'Central',
    batch_number: '1',
    channel_partner: 'Sasakawa',
    destination_country: 'Italy',
    customer_name: 'AgroPlus',
    serial_number: '33ce46a983069a23a5df2ba578c5b379'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log('Form submitted:', formData);
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
              {Object.entries(formData).map(([key, value]) => (
                <div className="mb-4" key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}:
                  </label>
                  <input
                    type={key.includes('date') ? 'date' : key.includes('timestamp') ? 'datetime-local' : 'text'}
                    id={key}
                    name={key}
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
              ))}
            </div>

            <div className="text-center mt-6">
              <button type="submit" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300">
                Submit
              </button>
            </div>
          </form>
        </div>

        {qrImage && (
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-green-800 mb-2">{qrImage}</p>
            <img src={qrImage} alt="QR Code" className="mx-auto rounded-lg shadow-lg" />
            <a href={`your-qr-download-url/${farmId}`} download="QR_code" className="text-blue-500 hover:underline">Download QR Code</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointForm;
