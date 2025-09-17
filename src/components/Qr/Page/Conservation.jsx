import React, { useState } from "react";
import axiosInstance from "../../../axiosInstance";

// Composants
import StepIndicator from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";

// Configuration
import { createConservationFormSteps, conservationStepNames } from "../Component/conservationStepsConfig";

const ConservationQrPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Configuration des étapes
  const formSteps = createConservationFormSteps();

  // -------- Gestion des changements de formulaire --------
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    return `
Forest Name: ${data.forest_name}
Forest ID: ${data.forest_id}
Tree Type: ${data.tree_type}
Date of Cutting: ${data.date_cutting}
GPS: ${data.gps_coordinates}
Height: ${data.height}m
Diameter: ${data.diameter}cm
Batch: ${data.batch_number}
    `.trim();
  };

  // -------- Soumission --------
  const handleSubmit = () => {
    const qrText = generateQrData(formData);
    setQrData(qrText);
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
          description: "Digital receipt for tree cutting conservation.",
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `conservation_receipts_${baseQrData.batch_number}_batches.pdf`);
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
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-emerald-700">
          Generate Digital Codes for Tree Cutting
        </h1>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={formSteps.length}
          stepNames={conservationStepNames}
        />

        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Formulaire */}
          <div className="w-1/2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-emerald-700">
                {formSteps[currentStep]?.title}
              </h2>

              <FormStep
                step={formSteps[currentStep]}
                formData={formData}
                onChange={handleChange}
                onCategoryChange={null}
                onStoreChange={null}
                farmBlocks={[]}
                onAddFarm={null}
                onRemoveFarm={null}
                farms={[]}
                districts={[]}
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

export default ConservationQrPage;