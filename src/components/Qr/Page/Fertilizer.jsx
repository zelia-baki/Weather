import React, { useState } from "react";
import axiosInstance from "../../../axiosInstance";

// Composants
import StepIndicator from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";

// Configuration
import { createFertilizerFormSteps, fertilizerStepNames } from "../Component/fertilizerStepsConfig";

// Hook utilitaire
import useFetchData from "../../Qr/Produce/useFetchData";

const FertilizerQrPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [farmBlocks, setFarmBlocks] = useState([{ id: "", props: {} }]);
  const [qrData, setQrData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [agroInputType, setAgroInputType] = useState("");
  const [agroInputCategory, setAgroInputCategory] = useState("");

  // Fetch des données
  const farms = useFetchData("/api/farm/", "farms");
  const districts = useFetchData("/api/district/", "districts");
  const stores = useFetchData("/api/store/", "stores");

  // Configuration des étapes
  const formSteps = createFertilizerFormSteps(farmBlocks, stores, agroInputType, agroInputCategory);

  // -------- Gestion des changements de formulaire --------
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Gestion spéciale pour AgroInputType
  const handleAgroInputTypeChange = (e) => {
    const value = e.target.value;
    setAgroInputType(value);
    setAgroInputCategory(""); // Reset category when type changes
    setFormData((prev) => ({
      ...prev,
      agroInputType: value,
      agroInputCategory: "",
      agroInputSubCategory: "",
    }));
  };

  // Gestion spéciale pour AgroInputCategory
  const handleAgroInputCategoryChange = (e) => {
    const value = e.target.value;
    setAgroInputCategory(value);
    setFormData((prev) => ({
      ...prev,
      agroInputCategory: value,
      agroInputSubCategory: "",
    }));
  };

  // Gestion des changements avec logique personnalisée
  const handleFormChange = (e) => {
    const { name } = e.target;

    if (name === "agroInputType") {
      handleAgroInputTypeChange(e);
    } else if (name === "agroInputCategory") {
      handleAgroInputCategoryChange(e);
    } else if (name === "store_id") {
      handleStoreChange(e, "id");
    } else if (name === "store_name") {
      handleStoreChange(e, "name");
    } else {
      handleChange(e);
    }
  };

  const handleStoreChange = (e, type) => {
    const value = e.target.value;
    let store = null;

    if (type === "id") {
      store = stores.find((s) => s.id.toString() === value);
    } else if (type === "name") {
      store = stores.find((s) => s.name === value);
    }

    if (store) {
      setFormData((prev) => ({
        ...prev,
        store_id: store.id,
        store_name: store.name,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [type === "id" ? "store_id" : "store_name"]: value,
      }));
    }
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
        const response = await axiosInstance.get(`/api/farm/${farm_id}`);

        if (response.data.status === 'success') {
          const farmProperties = response.data.data;

          setFormData((prev) => ({
            ...prev,
            // Corrigez les noms des champs ici
            [`farm_${index}_phone`]: farmProperties.phonenumber1 || farmProperties.phonenumber2 || "",
            [`farm_${index}_district`]: farmProperties.district_id || "",
          }));

          console.log("Updated formData with:", {
            phone: farmProperties.phonenumber1,
            district: farmProperties.district_id
          });
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
    const farmsList = farmBlocks
      .map((_, i) => ({
        id: data[`farm_${i}_id`],
        phone: data[`farm_${i}_phone`],
        district: data[`farm_${i}_district`],
      }))
      .filter((f) => f.id);

    return `
Farms: ${farmsList.map((f) => f.id).join(", ")}
Phones: ${farmsList.map((f) => f.phone).join(", ")}
Districts: ${farmsList.map((f) => f.district).join(", ")}
Batch: ${data.batch_number}
Type: ${data.agroInputType}
${data.agroInputType === "Fertilizer" ? `Category: ${data.agroInputCategory} - ${data.agroInputSubCategory}` : ""}
Application Date: ${data.application_date}
Rate: ${data.application_rate}
Weight: ${data.agroinput_weight}
Price/Kg: ${data.price_per_kg}
Total: ${data.total_price}
Store: ${data.store_name} (${data.store_id})
Transaction Date: ${data.transaction_date}
Payment: ${data.payment_type}
    `.trim();
  };

  // -------- Soumission --------
  const handleSubmit = () => {
    const qrJson = generateQrData(formData);
    setQrData(qrJson);
  };

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
          description: "Digital receipt for fertilizer transaction.",
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `fertilizer_receipts_${baseQrData.batch_number}_batches.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur lors du téléchargement du PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-teal-700">
          Generate Digital Codes for Fertilizer Application
        </h1>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={formSteps.length}
          stepNames={fertilizerStepNames}
        />

        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Formulaire */}
          <div className="w-1/2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-teal-700">
                {formSteps[currentStep]?.title}
              </h2>

              <FormStep
                step={formSteps[currentStep]}
                formData={formData}
                onChange={handleFormChange}
                onCategoryChange={handleAgroInputCategoryChange}
                onStoreChange={handleStoreChange}
                farmBlocks={farmBlocks}
                onAddFarm={addFarmBlock}
                onRemoveFarm={removeFarmBlock}
                onFarmChange={handleFarmChange} // Ajout de la prop pour auto-complétion
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

export default FertilizerQrPage;