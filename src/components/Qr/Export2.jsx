import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axiosInstance from '../../axiosInstance';

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
    crop: '',
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
  const [crop_id, setCrop] = useState([]);
  const [cat_id, setCat] = useState([]);
  const [categorys, setCategory] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [farmerGroups, setFarmerGroups] = useState([]);
  const [cropGrades, setcropGrades] = useState([]);
  const [crops, setcrops] = useState([]);
  const [qrCodes, setQrCodes] = useState([]); // Stocke les données pour générer les QR codes
  const [countries, setCountries] = useState([]);
  const storeNames = ['Store A', 'Store B', 'Store C'];
  const seasons = ['Season 1', 'Season 2', 'Season 3', 'Season 4'];

  const cropsData = [
    { id: 1, name: 'Cocoa', category: 1 },
    { id: 2, name: 'Coffee Robusta', category: 2 },
    { id: 3, name: 'Coffee Arabica', category: 3 },
    { id: 4, name: 'Oil Palm', category: 4 },
    { id: 5, name: 'Soya Bean', category: 5 },
    { id: 6, name: 'Rubber', category: 6 },
    { id: 7, name: 'Hass Avocado', category: 4 },
    { id: 8, name: 'snickerdoodle', category: 1 },
    { id: 9, name: 'test1', category: 2 },
    { id: 10, name: 'test', category: 4 },
    { id: 11, name: 'Cafe', category: 1 },
    { id: 12, name: 'Cafe Robusta', category: 2 },
  ];

  const handleFarmIdChange = (e) => {
    const farm_id = e.target.value;
    setFormData(prevFormData => ({ ...prevFormData, farm_id }));

    if (farm_id) {
      axiosInstance.get(`/api/farm/${farm_id}`)
        .then(response => {
          if (response.data.status === 'success') {
            const farmProperties = response.data.data;
            setFormData(prevData => ({
              ...prevData,
              ...farmProperties, // Spread les propriétés de la ferme dans formData
              district_name: farmProperties.subcounty // Définit district_name à subcounty
            }));
          }
        })
        .catch(error => {
          console.error('Error fetching farm properties:', error);
        });
    }
  };

  useEffect(() => {
    const fetchCropGrades = async () => {
      if (crop_id) {
        console.log('Fetching grades for crop_id:', crop_id); // Ajoute ce log pour vérifier crop_id
        try {
          const result = await axiosInstance.get(`/api/grade/getbycrop/${crop_id}`);
          console.log(result.data);
          setcropGrades(result.data.grades);
        } catch (error) {
          console.error('Error fetching crop grades:', error);
        }
      }
    };

    fetchCropGrades();
  }, [crop_id]);



  useEffect(() => {
    const fetchCrops = async () => {
      if (cat_id) { // Vérifie que cat_id n'est pas vide
        try {
          const response = await axiosInstance.get(`/api/crop/getbycat/${cat_id}`);
          if (response.data.status === 'success') {
            setcrops(response.data.crops); // Mettre à jour l'état crops avec les données récupérées
          } else {
            console.error('No crops found for this category');
            setcrops([]); // Vide la liste si aucune culture n'est trouvée
          }
        } catch (error) {
          console.error('Error fetching crops:', error);
        }
      }
    };

    fetchCrops();
  }, [cat_id]);
  


  const handleCropChange = (selectedCropId) => {
    console.log("selectedCropId:", selectedCropId); // Get the selected value from the dropdown
    setCrop(selectedCropId); // Set the crop_id state
  };

  const handleCatChange = (selectedCatId) => {
    // Handle the category change logic here
    console.log("selectedCatId:", selectedCatId);
    setCat(selectedCatId); // Set the category state
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
    const fetchFarmerGroups = async () => {
      try {
        const response = await axiosInstance.get('/api/farmergroup/');
        setFarmerGroups(response.data);
      } catch (error) {
        console.error('Error fetching farmer groups:', error);
      }
    };

    fetchFarmerGroups();
  }, []);


  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axiosInstance.get('/api/pays/');
        setCountries(response.data.pays || []);
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };

    fetchCountries();
  }, []);


  useEffect(() => {
    const fetchCat = async () => {
      try {
        const response = await axiosInstance.get('/api/producecategory/');
        setCategory(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCat();
  }, []);

  useEffect(() => {
    if (qrCodes.length > 0 && qrCodeContainerRef.current) {
      qrCodeContainerRef.current.innerHTML = '';

      // Afficher uniquement le premier QR code dans le HTML
      const qrCodeData = qrCodes[0]; // Affiche le premier QR code uniquement
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
    }
  }, [qrCodes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    if (name === 'crop_category') {
      const selectedCatId = e.target.value;
      setCat(selectedCatId); // Mets à jour cat_id


      console.log(name, selectedCatId);
      handleCatChange(selectedCatId);

    }
    if (name === 'crop') {
      const selectedCropId = e.target.value;

      setCrop(selectedCropId); // Mets à jour crop_id


      console.log(name, selectedCropId);
      handleCropChange(selectedCropId);

    }


  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const batchNumber = parseInt(formData.batch_number, 10);

    if (isNaN(batchNumber) || batchNumber <= 0) {
      alert('Invalid batch number. Please enter a positive integer.');
      return;
    }

    const qrCodesData = Array.from({ length: batchNumber }, () => (`
    Farm : nkusu.com/api/${formData.channel_partner}\n
    destination : ${formData.destination_country}\n
    CP : ${formData.channel_partner}\n
    ECN : ${formData.end_customer_name}\n
    StoreName : ${formData.store_name}\n
    Crop Category : ${formData.crop_category}\n
    Crop : ${formData.crop}\n
    Grade : ${formData.crop_grade}\n
    Coffee Type : ${formData.coffeeType}\n
    HsCode : ${formData.hscode}\n
    Date : ${formData.harvest_date}\n
    Transaction Date : ${formData.timestamp}\n
        
        `));
    setQrCodes(qrCodesData);
  };

  const downloadPdf = async () => {
    const batchNumber = parseInt(formData.batch_number, 10);

    if (isNaN(batchNumber) || batchNumber <= 0) {
      alert('Invalid batch number. Please enter a positive integer.');
      return;
    }

    if (qrCodeContainerRef.current) {
      const canvasPromises = [];

      // Créer et capturer chaque QR code avant de le mettre dans le PDF
      for (let i = 0; i < batchNumber; i++) {
        const qrCodeData = qrCodes[i]; // Récupère chaque QR code
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
          data: `${qrCodeData} \n "batchNumber" : ${i}`,
        });

        const qrCodeElement = document.createElement('div');
        qrCode.append(qrCodeElement);
        document.body.appendChild(qrCodeElement);

        const canvasPromise = new Promise((resolve) => {
          setTimeout(() => {
            html2canvas(qrCodeElement, {
              scale: 2,  // Augmente la résolution
              useCORS: true, // Pour éviter les problèmes liés aux images externes
            }).then((canvas) => {
              document.body.removeChild(qrCodeElement);
              resolve({
                imgData: canvas.toDataURL('image/png'),
                width: canvas.width,
                height: canvas.height,
              });
            });
          }, 100); // Pause de 100ms
        });

        canvasPromises.push(canvasPromise);
      }

      const imgDataArray = await Promise.all(canvasPromises);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      // Ajouter les QR codes capturés dans le PDF
      imgDataArray.forEach((data, index) => {
        if (index > 0) pdf.addPage();
        pdf.addImage(data.imgData, 'PNG', 10, 10, data.width, data.height);
      });

      pdf.save(`${formData.farm_id}_QRCode.pdf`);
    }
  };




  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Digital Export Stamps</h1>
      <div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="farm_id" className="block text-sm font-medium text-gray-700">Farm ID:</label>
              <select
                id="farm_id"
                name="farm_id"
                value={formData.farm_id || ''}
                onChange={handleFarmIdChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Farm</option>
                {farms.map(farm => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name} - {farm.subcounty}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="farmergroup_id" className="block text-sm font-medium text-gray-700">Farmer Group:</label>
              <select
                id="farmergroup_id"
                name="farmergroup_id"
                value={formData.farmergroup_id || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Farmer Group</option>
                {farmerGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="District" className="block text-sm font-medium text-gray-700">District :</label>
              <select
                id="district_name"
                name="district_name"
                value={formData.district_name || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/*""""""""""""""""""""""""""""""""""eto ny resaka crop"""""""


             {
              label: 'Crop Category', name: 'crop_category', type: 'select', options: ['Coffee', 'Cocoa', 'Palm Oil', 'Soybean']
            }, {
              label: 'Crop Grade', name: 'crop_grade', type: 'select', options: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
            }, {
              label: 'Crop Quality', name: 'crop_quality', type: 'select', options: ['Quality A', 'Quality B', 'Quality C']
            }


            """"""""""""*/}
            <div>
              <label htmlFor="crop_category" className="block text-sm font-medium text-gray-700">Crop Category:</label>
              <select
                id="crop_category"
                name="crop_category"
                value={formData.crop_category || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Category</option>
                {categorys.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="crop" className="block text-sm font-medium text-gray-700">Crop:</label>
              <select
                id="crop"
                name="crop"
                value={formData.crop || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Crop</option>
                {cropsData.map(crop => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="crop_grade" className="block text-sm font-medium text-gray-700">Crop Grade:</label>
              <select
                id="crop_grade"
                name="crop_grade"
                value={formData.crop_grade || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Crop Grade</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
              </select>
            </div>

          </div>

          {[{
            label: 'Batch Number', name: 'batch_number', type: 'number'
          }, {
            label: 'Produce Weight (Kgs)', name: 'produce_weight', type: 'text'
          }]
            .map(({ label, name, type, options }) => (
              <div key={name} className="grid grid-cols-1">
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}:</label>
                {type === 'select' ? (
                  <select
                    id={name}
                    name={name}
                    value={formData[name] || ''}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">{`Select ${label}`}</option>
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
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                )}
              </div>
            ))
          }
          {/* ------------------------------------------------------------------------------------------------------------------------------- */}
          <div className="space-y-6"> {/* Remplace grid par space-y pour espacement vertical */}
            <label htmlFor='coffeetype' className="block text-sm font-medium text-gray-700">Coffee Type</label>
            <select
              id="coffeeType"
              name="coffeeType"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.coffeeType}
              onChange={handleChange}
              required
            >
              <option value="" >Select Coffee Type</option>
              <option value="Robusta">Robusta</option>
              <option value="Arabica">Arabica</option>
              <option value="Other">Other</option>

            </select>

            <label htmlFor='hscode' className="block text-sm font-medium text-gray-700">HS Code</label>
            <select
              id='hscode'
              name="hscode"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.hscode}
              onChange={handleChange}
              required
            >
              <option value="" >Select HS Code</option>
              {formData.coffeeType === "Robusta" && (
                <>
                  <option value="0901.11">0901.11 -- Not decaffeinated</option>
                  <option value="0901.21">0901.21 -- Not decaffeinated, roasted</option>
                </>
              )}
              {formData.coffeeType === "Arabica" && (
                <>
                  <option value="0901.12">0901.12 -- Decaffeinated</option>
                  <option value="0901.22">0901.22 -- Decaffeinated, roasted</option>
                </>
              )}
               {formData.coffeeType === "Other" && (
                <>
                  <option value="0901.90">0901.90 -- Other 1</option>
                  <option value="0901.90">0901.90 -- Other 2</option>
                </>
              )}
            </select>
          </div>


          {/* ---------------------------------------------------------------------------------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="store_name" className="block text-sm font-medium text-gray-700">Store Name:</label>
              <select
                id="store_name"
                name="store_name"
                value={formData.store_name || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Store</option>
                {storeNames.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="season" className="block text-sm font-medium text-gray-700">Season:</label>
              <select
                id="season"
                name="season"
                value={formData.season || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Season</option>
                {seasons.map(season => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="geolocation" className="block text-sm font-medium text-gray-700">Geolocation:</label>
            <input
              type="text"
              id="geolocation"
              name="geolocation"
              value={formData.geolocation || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="country_of_origin" className="block text-sm font-medium text-gray-700">Country of Origin:</label>
              <select
                id="country_of_origin"
                name="country_of_origin"
                value={formData.country_of_origin || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.id} value={country.nom_en_gb}>{country.nom_en_gb}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="destination_country" className="block text-sm font-medium text-gray-700">Destination Country:</label>
              <select
                id="destination_country"
                name="destination_country"
                value={formData.destination_country || ''}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Destination Country</option>
                {countries.map(country => (
                  <option key={country.id} value={country.nom_en_gb}>{country.nom_en_gb}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="channel_partner" className="block text-sm font-medium text-gray-700">Channel Partner:</label>
            <input
              type="text"
              id="channel_partner"
              name="channel_partner"
              value={formData.channel_partner || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="end_customer_name" className="block text-sm font-medium text-gray-700">End Customer Name:</label>
            <input
              type="text"
              id="end_customer_name"
              name="end_customer_name"
              value={formData.end_customer_name || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700">Timestamp (Transaction Date):</label>
            <input
              type="datetime-local"
              id="timestamp"
              name="timestamp"
              value={formData.timestamp || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Generate QR Codes
          </button>
        </form>

        <div ref={qrCodeContainerRef} className="mt-6">
          {/* Placeholder for QR codes */}
        </div>
      </div>
      {qrCodes.length > 0 && (
        <div>
          <button onClick={downloadPdf}>Download PDF</button>
        </div>
      )}
    </div>
  );

};

export default PointForm;
