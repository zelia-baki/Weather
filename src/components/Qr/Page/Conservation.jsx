import React, { useState } from "react";
import axiosInstance from "../../../axiosInstance";
import StepIndicator  from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep       from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";
import { createConservationFormSteps, conservationStepNames } from "../Component/conservationStepsConfig";

const ConservationQrPage = () => {
  const [currentStep,   setCurrentStep]   = useState(0);
  const [formData,      setFormData]      = useState({});
  const [qrData,        setQrData]        = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const formSteps = createConservationFormSteps();

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const nextStep = () => { if (currentStep < formSteps.length - 1) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

  const isStepValid = () => {
    for (const field of formSteps[currentStep]?.fields || []) {
      if (field.type === "group") {
        for (const sub of field.fields) {
          if (sub.required && !formData[sub.name]) return false;
        }
      } else {
        if (field.required && !formData[field.name]) return false;
      }
    }
    return true;
  };

  const generateQrData = (data) => `
Forest Name: ${data.forest_name}
Forest ID: ${data.forest_id}
Tree Type: ${data.tree_type}
Date of Cutting: ${data.date_cutting}
GPS: ${data.gps_coordinates}
Height: ${data.height}m
Diameter: ${data.diameter}cm
Batch: ${data.batch_number}
  `.trim();

  const handleSubmit = () => setQrData(generateQrData(formData));

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const baseQrData  = JSON.parse(JSON.stringify(formData));
      const batchNumber = parseInt(baseQrData.batch_number, 10);
      if (isNaN(batchNumber)) return;

      const qrDataList = Array.from({ length: batchNumber }, (_, i) => ({
        ...baseQrData, batch_number: (i + 1).toString(),
      }));

      const res = await axiosInstance.post(
        "/api/qrcode/generate_pdf",
        { qr_data_list: qrDataList, description: "Digital receipt for tree cutting conservation." },
        { responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `conservation_receipts_${baseQrData.batch_number}_batches.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  return (
    // ✅ light-panel on root → fixes all text/label visibility inside
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 min-h-screen py-8 light-panel">
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