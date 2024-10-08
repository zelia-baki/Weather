import React, { useState, useRef, useEffect } from 'react';
import QRCodeStyling from 'qr-code-styling';
import axiosInstance from '../../axiosInstance'; // Assurez-vous que le chemin est correct

const GenerateFertilizerQrCode = () => {
  const [formData, setFormData] = useState({
    farm_name: '',
    field_id: '',
    district_name: '',
    crop_name: '',
    fertilizer_type: '',
    application_date: '',
    application_rate: '',
    soil_moisture: '',
    soil_ph: '',
    export_name: '',
    batch_number: '', // Added batch_number here
  });
  const [isExportChecked, setIsExportChecked] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [districts, setDistricts] = useState([]);
  const [farms, setFarms] = useState([]);

  const qrCodeRef = useRef(null);

  // Initialize QRCodeStyling with default options
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
    const fetchDistrict = async () => {
      try {
        const { data } = await axiosInstance.get('/api/district/');
        setDistricts(data.districts || []);
      } catch (error) {
        console.error('Error fetching district:', error);
      }
    };

    fetchDistrict();
  }, []);

  useEffect(() => {
    if (qrCodeRef.current) {
      qrCode.append(qrCodeRef.current);
    }
    qrCode.update({ data: qrCodeUrl });
  }, [qrCodeUrl]);

  const handleFarmIdChange = async (e) => {
    const farm_id = e.target.value;
    setFormData(prevFormData => ({ ...prevFormData, farm_id }));

    if (farm_id) {
      axiosInstance.get(`/api/farm/${farm_id}/allprop`)
        .then(response => {
          if (response.data.status === 'success') {
            const farmProperties = response.data.data[0];
            console.log(farmProperties);
            setFormData(farmProperties);
            console.log('formData', formData);
          }
        }).catch(error => {
          console.error('Error fetching farm properties:', error);
        });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const { field_name, field_id, fertilizer_type, application_date, application_rate, soil_moisture, soil_ph, export_name } = formData;
    const qrCodeData = `Field Name: ${field_name}\nField ID: ${field_id}\nFertilizer Type: ${fertilizer_type}\nApplication Date: ${application_date}\nApplication Rate: ${application_rate}\nSoil Moisture: ${soil_moisture}\nSoil pH: ${soil_ph}\nExport Name: ${export_name}`;
    setQrCodeUrl(qrCodeData);
  };

  const handleExportCheckboxChange = (event) => {
    setIsExportChecked(event.target.checked);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleDownloadClick = () => {
    qrCode.download({ extension: 'png' });
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="flex">
        <div className="container mx-auto">
          <h1 className="text-5xl font-extrabold mb-12 text-center text-green-700">
            Generate Digital Codes for Fertilizer Application
          </h1>
          <form
            onSubmit={handleSubmit}
            method="post"
            className="bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
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

                {/* Farmer Phone Number */}
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2" htmlFor="farmer_phone_number">Farmer Phone Number</label>
                  <input
                    type="text"
                    id="farmer_phone_number"
                    name="farmer_phone_number"
                    placeholder="Farmer Phone Number"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.farmer_phone_number}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Batch Number */}
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2" htmlFor="batch_number">Batch Number</label>
                  <input
                    type="text"
                    id="batch_number"
                    name="batch_number"
                    placeholder="Batch Number"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.batch_number}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
              <label htmlFor="District"  className="text-lg text-gray-800 mb-2">District </label>
              <select
                id="district_name"
                name="district_name"
                value={formData.district_name || ''}
                onChange={handleChange}
                required
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
                {/* <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">AgroInput Category</label>
                  <select
                    name="agroinput_category"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.agroinput_category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select a Category</option>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Pesticides">Pesticides</option>
                  </select>
                </div> */}

                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Payment Type</label>
                  <select
                    name="payment_type"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.payment_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select a Payment</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit</option>
                    <option value="mobilemoney">Mobile Money</option>
                    <option value="visa">Visa</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Store Name</label>
                  <select
                    name="store_name"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.store_name}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select a Store Name</option>
                    <option value="store1">Store 1</option>
                    <option value="store2">Store 2</option>
                  </select>
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
                  <label className="text-lg text-gray-800 mb-2">Application Rate (kg/Acre)</label>
                  <input
                    type="text"
                    name="application_rate"
                    placeholder="Application Rate (kg/Acre)"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.application_rate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/*  */}
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">AgroInput Type</label>
                  <select
                    name="agroInputCategory"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4"
                    value={formData.agroInputCategory}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select AgroInput Category</option>
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Pesticides">Pesticides</option>
                  </select>

                  {formData.agroInputCategory === "Fertilizers" && (
                    <select
                      name="agroInputType"
                      className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4"
                      value={formData.agroInputType}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Fertilizer Type</option>
                      <optgroup label="Organic">
                        <option value="Organic1">Organic 1</option>
                        <option value="Organic2">Organic 2</option>
                      </optgroup>
                      <optgroup label="Chemical">
                        <option value="Chemical1">Chemical 1</option>
                        <option value="Chemical2">Chemical 2</option>
                      </optgroup>
                    </select>
                  )}

                  {formData.agroInputCategory === "Pesticides" && (
                    <select
                      name="agroInputType"
                      className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400 mb-4"
                      value={formData.agroInputType}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Pesticide Type</option>
                      <option value="Pesticide1">Pesticide 1</option>
                      <option value="Pesticide2">Pesticide 2</option>
                    </select>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">AgroInput Weight (Kgs)</label>
                  <input
                    type="text"
                    name="agroinput_weight"
                    placeholder="AgroInput Weight (Kgs)"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.agroinput_weight}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/*  */}
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Price / Kg (Ugshs)</label>
                  <input
                    type="text"
                    name="price_per_kg"
                    placeholder="Price / Kg (Ugshs)"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.price_per_kg}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Total Price (Ugshs)</label>
                  <input
                    type="text"
                    name="total_price"
                    placeholder="Total Price (Ugshs)"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.total_price}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/*  */}
                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Store ID</label>
                  <input
                    type="text"
                    name="store_id"
                    placeholder="Store ID"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.store_id}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-lg text-gray-800 mb-2">Transaction Date</label>
                  <input
                    type="date"
                    name="transaction_date"
                    className="border-2 p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-400"
                    value={formData.transaction_date}
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
              Generate Digital Codes for Agro Input
            </button>
          </form>
        </div>
        {/* Div droite */}
        <div className="lg:w-1/2 flex flex-col justify-center items-center">
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
