import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCodeStyling from 'qr-code-styling'; // Assurez-vous que vous avez installé et importé QRCodeStyling

const GenerateQrCodeAndReceipt = () => {
  const [formData, setFormData] = useState({
    farm_id: '',
    phone_number: '',
    district: '',
    agroInputCategory: '',
    agroInputType: '',
    season: '',
    produce_weight: '',
    price_per_kg: '',
    total_value: '',
    payment_type: '',
    store_id: '',
    store_name: '',
    transaction_date: ''
  });

  const [farms, setFarms] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const storeNames = ['Store A', 'Store B', 'Store C']; // Example options for Store Name

  const qrCodeContainerRef = useRef(null); // Référence pour le conteneur des QR codes

  const handleFarmIdChange = async (e) => {
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
    const fetchFarms = async () => {
      try {
        const { data } = await axios.get('/api/farm/');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ajoutez ici votre logique pour générer les QR codes et les reçus
    // Par exemple, vous pouvez envoyer les données au serveur avec axios
    axios.post('/api/qr/generate', formData)
      .then(response => {
        if (response.data.status === 'success') {
          // Traitez la réponse, mettez à jour qrCodes avec les données générées
          setQrCodes(response.data.qrCodes);
        }
      })
      .catch(error => {
        console.error('Error generating QR codes:', error);
      });
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
          Generate Digital Codes and E-Receipt for Farmer
        </h1>
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex">
            {/* Left Side */}
            <div className="w-1/2 pr-4">
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

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="phone_number">
                  Farmer Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
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
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="District"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="flex flex-col mb-6">
                <label className="text-lg text-gray-800 mb-2">Produce Category and Grade</label>
                <select
                  name="agroInputCategory"
                  value={formData.agroInputCategory}
                  onChange={handleInputChange}
                  className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4"
                  required
                >
                  <option value="">Select Produce Category</option>
                  <option value="coffee">Coffee</option>
                  <option value="cocoa">Cocoa</option>
                  <option value="maize">Maize</option>
                  <option value="soybean">Soybean</option>
                </select>

                <select
                  name="agroInputType"
                  value={formData.agroInputType}
                  onChange={handleInputChange}
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
                  value={formData.season}
                  onChange={handleInputChange}
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
                  Weight of Produce (kg)
                </label>
                <input
                  type="number"
                  name="produce_weight"
                  id="produce_weight"
                  value={formData.produce_weight}
                  onChange={handleInputChange}
                  placeholder="Weight of Produce"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="price_per_kg">
                  Price per kg
                </label>
                <input
                  type="number"
                  name="price_per_kg"
                  id="price_per_kg"
                  value={formData.price_per_kg}
                  onChange={handleInputChange}
                  placeholder="Price per kg"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="total_value">
                  Total Value
                </label>
                <input
                  type="number"
                  name="total_value"
                  id="total_value"
                  value={formData.total_value}
                  onChange={handleInputChange}
                  placeholder="Total Value"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="payment_type">
                  Payment Type
                </label>
                <select
                  name="payment_type"
                  id="payment_type"
                  value={formData.payment_type}
                  onChange={handleInputChange}
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                >
                  <option value="">Select Payment Type</option>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
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
                  value={formData.store_id}
                  onChange={handleInputChange}
                  placeholder="Store ID"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                />
              </div>

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

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2 block" htmlFor="transaction_date">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  id="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700"
          >
            Generate Receipt and QR Code
          </button>
        </form>

        {qrCodes.length > 0 && (
          <div
            ref={qrCodeContainerRef}
            className="mt-10 grid grid-cols-2 gap-6"
          >
            {/* QR Code containers will be appended here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateQrCodeAndReceipt;
