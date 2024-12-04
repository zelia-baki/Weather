import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling'; // Assurez-vous que vous avez installé et importé QRCodeStyling
import axiosInstance from '../../axiosInstance'; // Assuming axiosInstance is imported from a utility file

const GenerateQrCodeAndReceipt = () => {
  const [formData, setFormData] = useState({
    farm_id: '',
    phone_number: '',
    district_id: '',
    agroInputCategory: '',
    country_of_origin: '',
    agroInputType: '',
    season: '',
    produce_weight: '',
    price_per_kg: '',
    total_value: '',
    payment_type: '',
    store_id: '',
    store_name: '',
    transaction_date: '',
    batch_number: '', // Add batch_number here

  });

  const [farms, setFarms] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [countries, setCountries] = useState([]);
  const storeNames = ['Store A', 'Store B', 'Store C']; // Example options for Store Name

  const qrCodeContainerRef = useRef(null); // Référence pour le conteneur des QR codes

  const handleFarmIdChange = async (e) => {
    const farm_id = e.target.value;
    setFormData(prevFormData => ({ ...prevFormData, farm_id }));

    if (farm_id) {
      try {
        const response = await axiosInstance.get(`/api/farm/${farm_id}/allprop`);
        if (response.data.status === 'success') {
          const farmProperties = response.data.data[0];
          setFormData(prevData => ({
            ...prevData,
            phone_number: farmProperties.phone_number || '',
            district: farmProperties.district || ''
            // Mettez à jour les autres champs si nécessaire
          }));
        }
      } catch (error) {
        console.error('Error fetching farm properties:', error);
      }
    }
  };

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const { data } = await axiosInstance.get('/api/farm/');
        setFarms(data.farms || []);
      } catch (error) {
        console.error('Error fetching farms:', error);
      }
    };
    fetchDistricts();
    fetchFarms();
  }, []);

  // useEffect(() => {
  //   const fetchCountries = async () => {
  //     try {
  //       const response = await axios.get('/api/countries');  // Call the API endpoint
  //       setCountries(response.data);  // Update the state with the list of countries
  //     } catch (error) {
  //       console.error('Error fetching countries:', error);
  //     }
  //   };

  //   fetchCountries();  // Call fetchCountries on component mount
  // }, []);

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



  const fetchDistricts = async () => {
    try {
      const response = await axiosInstance.get('/api/district/');
      setDistricts(response.data.districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setError('Error fetching districts.');
    }
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 const handleChangeCountrie = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/qrcode/generate_qr', formData);
      if (response.data.status === 'success') {
        setQrCodes(response.data.qrCodes);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r  via-white-50 to-white-50 min-h-screen flex justify-center items-center p-10">
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
                  value={formData.farm_id}
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
                <label className="text-lg text-gray-800 mb-2" htmlFor="batch_number">
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batch_number"
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  placeholder="Batch Number"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="district_id">
                  District
                </label>
                <select
                  name="district_id"
                  value={formData.district_id}
                  onChange={handleChange}
                  className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div className="mb-6">
                  <label htmlFor="country_of_origin" className="text-lg text-gray-800 mb-2 block">
                    Country :
                  </label>
                  <select
                    id="country_of_origin"
                    name="country_of_origin"
                    value={formData.country_of_origin}
                    onChange={handleChangeCountrie}
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
                </div> */}

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
                <label className="text-lg text-gray-800 mb-2" htmlFor="produce_weight">
                  Produce Weight (kg)
                </label>
                <input
                  type="number"
                  name="produce_weight"
                  id="produce_weight"
                  value={formData.produce_weight}
                  onChange={handleInputChange}
                  placeholder="Produce Weight"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="price_per_kg">
                  Price Per Kg (UGX)
                </label>
                <input
                  type="number"
                  name="price_per_kg"
                  id="price_per_kg"
                  value={formData.price_per_kg}
                  onChange={handleInputChange}
                  placeholder="Price Per Kg"
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="total_value">
                  Total Value (UGX)
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
                <label className="text-lg text-gray-800 mb-2" htmlFor="payment_type">
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
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="store_id">
                  Store ID
                </label>
                <select
                  name="store_id"
                  id="store_id"
                  value={formData.store_id}
                  onChange={handleInputChange}
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                >
                  <option value="">Select Store ID</option>
                  {storeNames.map((store, index) => (
                    <option key={index} value={index + 1}>
                      {store}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="store_name">
                  Store Name
                </label>
                <select
                  name="store_name"
                  id="store_name"
                  value={formData.store_name}
                  onChange={handleInputChange}
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                >
                  <option value="">Select Store Name</option>
                  {storeNames.map((store, index) => (
                    <option key={index} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="text-lg text-gray-800 mb-2" htmlFor="transaction_date">
                  Transaction Date
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  id="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  className="border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-teal-600 text-white p-4 rounded-lg shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-400"
              >
                Generate QR Code and Receipt
              </button>
            </div>
          </div>
        </form>
        <div ref={qrCodeContainerRef} className="mt-12">
          {/* Les QR codes générés seront affichés ici */}
        </div>
      </div>
    </div>
  );
};

export default GenerateQrCodeAndReceipt;