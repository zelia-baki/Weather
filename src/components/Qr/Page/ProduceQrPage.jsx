import React, { useState, useEffect } from "react";
import axiosInstance from "../../../axiosInstance";

// Composants
import StepIndicator from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";

// Configuration
import { createFormSteps, stepNames } from "../Component/formStepsConfig";

// Hook utilitaire
import useFetchData from "../../Qr/Produce/useFetchData";
import { receiptStyles } from "../receipt-styles";

const GenerateQrCodeAndReceipt = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [farmBlocks, setFarmBlocks] = useState([{ id: "", props: {} }]);
  const [grades, setGrades] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch des données
  const farms = useFetchData("/api/farm/", "farms");
  const districts = useFetchData("/api/district/", "districts");
  const countries = useFetchData("/api/pays/", "pays");
  const stores = useFetchData("/api/store/", "stores");
  const produceCategories = useFetchData("/api/producecategory/", "categories");

  // Configuration des étapes
  const formSteps = createFormSteps(farmBlocks, countries, produceCategories, grades, stores);

  // -------- Gestion des changements de formulaire --------
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCategoryChange = async (e) => {
    const produceCategory = e.target.value;
    setFormData((prev) => ({ ...prev, produceCategory }));

    const cat = produceCategories.find((c) => c.name === produceCategory);
    if (!cat) return;

    try {
      const res = await axiosInstance.get(`/api/grade/getbycrop/${cat.id}`);
      setGrades(res.data.status === "success" ? res.data.grades : []);
    } catch (err) {
      console.error("Error fetching grades:", err);
      setGrades([]);
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

  // -------- Gestion des blocs ferme avec auto-complétion --------
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

  // -------- Soumission --------
  const handleSubmit = () => {
    const qrJson = JSON.stringify(formData, null, 2);
    setQrData(qrJson);
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const baseQrData = JSON.parse(qrData);
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
          description: "Digital receipt for produce transaction.",
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipts_${baseQrData.batch_number}_batches.pdf`);
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
          Digital receipt for produce transaction
        </h1>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={formSteps.length}
          stepNames={stepNames}
        />

        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Formulaire */}
          <div className="w-1/2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibent mb-6 text-teal-700">
                {formSteps[currentStep]?.title}
              </h2>

              <FormStep
                step={formSteps[currentStep]}
                formData={formData}
                onChange={handleChange}
                onCategoryChange={handleCategoryChange}
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

export default GenerateQrCodeAndReceipt;