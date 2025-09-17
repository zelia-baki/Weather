import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../axiosInstance';

// Composants
import StepIndicator from '../Component/StepIndicator';
import FormNavigation from '../Component/FormNavigation';
import FormStep from '../Component/FormStep';
import ReceiptPreview from '../Component/ReceiptPreview';

// Configuration
import { createExportFormSteps, exportStepNames } from '../Component/exportStepsConfig';

const PointForm = () => {

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    farm_id: '',
    farmergroup_id: '',
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
    coffeeType: '',
    hscode: '',
    store_id: ''
  });

  // États pour les données de l'API
  const [farms, setFarms] = useState([]);
  const [farmBlocks, setFarmBlocks] = useState([{ id: "", props: {} }]); // Ajout farmBlocks
  const [categorys, setCategory] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [farmerGroups, setFarmerGroups] = useState([]);
  const [crops, setCrops] = useState([]);
  const [countries, setCountries] = useState([]);
  const [stores, setStores] = useState([]);

  // États pour les logiques conditionnelles
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [cropGrades, setCropGrades] = useState([]);

  // États pour QR et PDF
  const [qrData, setQrData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  // Configuration des étapes
  const formSteps = createExportFormSteps(
    farmBlocks,
    farmerGroups,
    districts,
    categorys,
    filteredCrops,
    cropGrades,
    stores,
    countries,
    formData.coffeeType
  );

  // -------- Fetch des données initiales --------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          farmsRes,
          districtsRes,
          farmerGroupsRes,
          cropsRes,
          countriesRes,
          categorysRes,
          storesRes
        ] = await Promise.all([
          axiosInstance.get('/api/farm/'),
          axiosInstance.get('/api/district/'),
          axiosInstance.get('/api/farmergroup/'),
          axiosInstance.get('/api/crop/'),
          axiosInstance.get('/api/pays/'),
          axiosInstance.get('/api/producecategory/'),
          axiosInstance.get('/api/store/')
        ]);

        setFarms(farmsRes.data.farms || []);
        setDistricts(districtsRes.data.districts || []);
        setFarmerGroups(farmerGroupsRes.data || []);
        setCrops(cropsRes.data.crops || []);
        setCountries(countriesRes.data.pays || []);
        setCategory(categorysRes.data.categories || []);
        setStores(storesRes.data.stores || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // -------- Gestion des changements de formulaire --------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Logiques conditionnelles
    if (name === 'crop_category') {
      handleCategoryChange(value);
    } else if (name === 'crop') {
      handleCropChange(value);
    } else if (name === 'coffeeType') {
      setFormData(prev => ({ ...prev, hscode: '' }));
    }
  };

  const handleCategoryChange = (selectedCatId) => {
    setSelectedCategoryId(selectedCatId);
    const filtered = crops.filter(crop => crop.category_id.toString() === selectedCatId);
    setFilteredCrops(filtered);
    setFormData(prev => ({
      ...prev,
      crop_category: selectedCatId,
      crop: '',
      crop_grade: ''
    }));
    setCropGrades([]);
    setSelectedCropId('');
  };

  const handleCropChange = (selectedCropId) => {
    setSelectedCropId(selectedCropId);
    setFormData(prev => ({
      ...prev,
      crop: selectedCropId,
      crop_grade: ''
    }));
    fetchCropGrades(selectedCropId);
  };

  const fetchCropGrades = async (cropId) => {
    if (cropId) {
      try {
        const response = await axiosInstance.get(`/api/grade/getbycrop/${cropId}`);
        setCropGrades(response.data.grades || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching grades:", err);
        setError(err.response?.data?.message || "An error occurred while fetching grades.");
        setCropGrades([]);
      }
    } else {
      setCropGrades([]);
    }
  };

  const handleFarmIdChange = async (e) => {
    // Cette fonction est maintenant remplacée par handleFarmChange
    console.warn("handleFarmIdChange deprecated, use handleFarmChange instead");
  };

  // -------- Gestion des blocs ferme --------
  const handleFarmChange = async (e, index) => {
    const farm_id = e.target.value;

    setFormData((prev) => ({
      ...prev,
      [`farm_${index}_id`]: farm_id,
    }));

    setFarmBlocks((prev) =>
      prev.map((f, i) => (i === index ? { ...f, id: farm_id } : f))
    );

    if (farm_id) {
      try {
        // Utiliser la même API que l'ancienne version export
        const response = await axiosInstance.get(`/api/farm/${farm_id}`);
        if (response.data.status === 'success') {
          const farmProperties = response.data.data;
          
          setFarmBlocks((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, id: farm_id, props: farmProperties } : f
            )
          );
          
          // Auto-complétion des champs comme dans l'export original
          setFormData((prev) => ({
            ...prev,
            [`farm_${index}_phone`]: farmProperties.phone_number || "",
            [`farm_${index}_district`]: farmProperties.subcounty || farmProperties.district_id || "",
            // Ajouter d'autres champs si nécessaire
            ...farmProperties
          }));
        }
      } catch (err) {
        console.error("Error fetching farm properties:", err);
      }
    }
  };

  const addFarmBlock = () => {
    setFarmBlocks((prev) => [...prev, { id: "", props: {} }]);
  };

  const removeFarmBlock = (index) => {
    if (farmBlocks.length > 1) {
      setFarmBlocks((prev) => prev.filter((_, i) => i !== index));
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData[`farm_${index}_id`];
        delete newData[`farm_${index}_phone`];
        delete newData[`farm_${index}_district`];
        return newData;
      });
    }
  };

  const handleStoreChange = (e, type) => {
    const value = e.target.value;
    let store = null;

    if (type === "id") {
      store = stores.find(s => s.id.toString() === value);
    } else if (type === "name") {
      store = stores.find(s => s.name === value);
    }

    if (store) {
      setFormData(prev => ({
        ...prev,
        store_id: store.id,
        store_name: store.name,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [type === "id" ? "store_id" : "store_name"]: value,
      }));
    }
  };

  // Gestion des changements avec logique personnalisée
  const handleFormChange = (e) => {
    const { name } = e.target;
    
    // Extraction de l'index pour les champs de ferme (farm_0_id, farm_1_id, etc.)
    const farmMatch = name.match(/^farm_(\d+)_id$/);
    
    if (farmMatch) {
      const index = parseInt(farmMatch[1], 10);
      handleFarmChange(e, index);
    } else if (name === "store_id") {
      handleStoreChange(e, "id");
    } else if (name === "store_name") {
      handleStoreChange(e, "name");
    } else {
      handleChange(e);
    }
  };

  // -------- Navigation --------
  const nextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // -------- Validation --------
  const isStepValid = () => {
    const currentStepFields = formSteps[currentStep]?.fields || [];

    for (let field of currentStepFields) {
      if (field.type === "group") {
        // Validation spéciale pour les groupes de fermes
        for (let subField of field.fields) {
          if (subField.required && !formData[subField.name]) {
            return false;
          }
        }
      } else {
        if (field.required && !formData[field.name]) {
          return false;
        }
      }
    }
    return true;
  };

  // -------- Génération du QR --------
  const generateQrData = (data) => {
    // Récupérer toutes les fermes
    const farmsList = farmBlocks
      .map((_, i) => ({
        id: data[`farm_${i}_id`],
        phone: data[`farm_${i}_phone`],
        district: data[`farm_${i}_district`],
      }))
      .filter((f) => f.id);

    return `
Farms: ${farmsList.map((f) => `www.nkusu.com/farmmanager/${f.id}`).join(", ")}
Phones: ${farmsList.map((f) => f.phone).join(", ")}
Districts: ${farmsList.map((f) => f.district).join(", ")}
Farmer Group: ${data.farmergroup_id}
Destination: ${data.destination_country}
CP: ${data.channel_partner}
ECN: ${data.end_customer_name}
Store Name: ${data.store_name}
Crop Category: ${data.crop_category}
Grade: ${data.crop_grade || 'N/A'}
Coffee Type: ${data.coffeeType}
HS Code: ${data.hscode}
Season: ${data.season}
Weight: ${data.produce_weight}
Geolocation: ${data.geolocation}
Country Origin: ${data.country_of_origin}
Transaction Date: ${data.timestamp}
    `.trim();
  };

  // -------- Soumission --------
  const handleSubmit = () => {
    const qrText = generateQrData(formData);
    setQrData(qrText);
  };

  // -------- Téléchargement PDF --------
  const handleDownloadPDF = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const baseQrData = JSON.parse(JSON.stringify(formData));
      const batchNumber = parseInt(baseQrData.batch_number, 10);

      if (isNaN(batchNumber)) {
        console.error("Invalid batch number. Must be a number.");
        setIsDownloading(false);
        return;
      }

      const qrDataList = [];
      for (let i = 0; i < batchNumber; i++) {
        const newQrData = { ...baseQrData, batch_number: (i + 1).toString() };
        qrDataList.push(newQrData);
      }

      const response = await axiosInstance.post(
        "/api/qrcode/generate_pdf",
        {
          qr_data_list: qrDataList,
          description: "Digital receipt for export transaction.",
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export_receipts_${baseQrData.batch_number}_batches.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // -------- Composant simplifié --------

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-700">
          Digital Export Stamps
        </h1>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={formSteps.length}
          stepNames={exportStepNames}
        />

        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Formulaire */}
          <div className="w-1/2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-blue-700">
                {formSteps[currentStep]?.title}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <FormStep
                step={formSteps[currentStep]}
                formData={formData}
                onChange={handleFormChange}
                onCategoryChange={handleCategoryChange}
                onStoreChange={handleStoreChange}
                farmBlocks={farmBlocks}
                onAddFarm={addFarmBlock}
                onRemoveFarm={removeFarmBlock}
                onFarmChange={handleFarmChange} // Nouvelle prop pour auto-complétion
                farms={farms}
                districts={districts}
              />

              <FormNavigation
                currentStep={currentStep}
                totalSteps={formSteps.length}
                onPrevStep={prevStep}
                onNextStep={nextStep}
                onSubmit={handleSubmit}
                isStepValid={isStepValid()}
              />
            </div>
          </div>

          {/* Reçu et QR */}
          <div className="w-1/2">
            <div className="sticky top-8">
              <ReceiptPreview
                qrData={qrData}
                onDownloadPDF={handleDownloadPDF}
                isDownloading={isDownloading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointForm;