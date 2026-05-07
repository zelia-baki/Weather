import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../axiosInstance";
import StepIndicator  from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep       from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";
import { createFertilizerFormSteps, fertilizerStepNames } from "../Component/fertilizerStepsConfig";
import useFetchData from "../../Qr/Produce/useFetchData";

const recompute = (data, blocks) => {
  const totalWeight = blocks.reduce(
    (sum, _, i) => sum + (parseFloat(data[`farm_${i}_qty`]) || 0), 0
  );
  const price = parseFloat(data.price_per_kg) || 0;
  return {
    agroinput_weight: totalWeight.toFixed(2),
    total_price:      (totalWeight * price).toFixed(2),
  };
};

const FertilizerQrPage = () => {
  const [currentStep,       setCurrentStep]       = useState(0);
  const [formData,          setFormData]          = useState({});
  const [farmBlocks,        setFarmBlocks]        = useState([{ id: "", props: {} }]);
  const [qrData,            setQrData]            = useState(null);
  const [isDownloading,     setIsDownloading]     = useState(false);
  const [agroInputType,     setAgroInputType]     = useState("");
  const [agroInputCategory, setAgroInputCategory] = useState("");

  const farms     = useFetchData("/api/farm/",     "farms");
  const districts = useFetchData("/api/district/", "districts");
  const stores    = useFetchData("/api/store/",    "stores");

  const formSteps = createFertilizerFormSteps(farmBlocks, stores, agroInputType, agroInputCategory);

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...recompute(prev, farmBlocks) }));
  }, [farmBlocks.length]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name.includes("_qty") || name === "price_per_kg")
        return { ...next, ...recompute(next, farmBlocks) };
      return next;
    });
  }, [farmBlocks]);

  const handleAgroInputTypeChange = (e) => {
    const value = e.target.value;
    setAgroInputType(value);
    setAgroInputCategory("");
    setFormData(prev => ({ ...prev, agroInputType: value, agroInputCategory: "", agroInputSubCategory: "" }));
  };

  const handleAgroInputCategoryChange = (e) => {
    const value = e.target.value;
    setAgroInputCategory(value);
    setFormData(prev => ({ ...prev, agroInputCategory: value, agroInputSubCategory: "" }));
  };

  const handleFormChange = useCallback((e) => {
    const { name } = e.target;
    if      (name === "agroInputType")     handleAgroInputTypeChange(e);
    else if (name === "agroInputCategory") handleAgroInputCategoryChange(e);
    else if (name === "store_id")          handleStoreChange(e, "id");
    else if (name === "store_name")        handleStoreChange(e, "name");
    else                                   handleChange(e);
  }, [handleChange]);

  const handleStoreChange = (e, type) => {
    const value = e.target.value;
    const store = type === "id"
      ? stores.find(s => s.id?.toString() === value)
      : stores.find(s => s.name === value);
    if (store) setFormData(prev => ({ ...prev, store_id: store.id, store_name: store.name }));
    else        setFormData(prev => ({ ...prev, [type === "id" ? "store_id" : "store_name"]: value }));
  };

  const handleFarmChange = async (e, index) => {
    const farm_id = e.target.value;
    setFormData(prev => {
      const next = { ...prev, [`farm_${index}_id`]: farm_id };
      return { ...next, ...recompute(next, farmBlocks) };
    });
    setFarmBlocks(prev => prev.map((f, i) => i === index ? { ...f, id: farm_id } : f));
    if (farm_id) {
      try {
        const res = await axiosInstance.get(`/api/farm/${farm_id}`);
        if (res.data.status === "success") {
          const p = res.data.data;
          setFormData(prev => ({
            ...prev,
            [`farm_${index}_phone`]:    p.phonenumber1 || p.phonenumber2 || "",
            [`farm_${index}_district`]: p.district_id  || "",
          }));
        }
      } catch {}
    }
  };

  const addFarmBlock    = () => setFarmBlocks(prev => [...prev, { id: "", props: {} }]);
  const removeFarmBlock = (index) => {
    if (farmBlocks.length <= 1) return;
    const next = farmBlocks.filter((_, i) => i !== index);
    setFarmBlocks(next);
    setFormData(prev => {
      const d = { ...prev };
      delete d[`farm_${index}_id`]; delete d[`farm_${index}_phone`];
      delete d[`farm_${index}_district`]; delete d[`farm_${index}_qty`];
      return { ...d, ...recompute(d, next) };
    });
  };

  const nextStep = () => { if (currentStep < formSteps.length - 1) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(s => s - 1); };

  const isStepValid = () => {
    const fields = formSteps[currentStep]?.fields || [];
    for (const field of fields) {
      if (field.type === "group") {
        for (const sub of field.fields) {
          if (sub.required && !formData[sub.name]) return false;
        }
      } else {
        if (field.required && !field.readOnly && !formData[field.name]) return false;
      }
    }
    return true;
  };

  const PRODUCT_STEP  = 2;
  const weightMissing = currentStep === PRODUCT_STEP &&
    (!formData.agroinput_weight || parseFloat(formData.agroinput_weight) === 0);

  const generateQrData = (data) => {
    const farmsList = farmBlocks
      .map((_, i) => ({ id: data[`farm_${i}_id`] || "", phone: data[`farm_${i}_phone`] || "",
                        district: data[`farm_${i}_district`] || "", qty: data[`farm_${i}_qty`] || "0" }))
      .filter(f => f.id);
    return [
      `Farms: ${farmsList.map(f => f.id).join(", ")}`,
      `Phones: ${farmsList.map(f => f.phone).join(", ")}`,
      `Districts: ${farmsList.map(f => f.district).join(", ")}`,
      `Quantities (kg): ${farmsList.map(f => f.qty).join(", ")}`,
      `Batch: ${data.batch_number}`,
      `Type: ${data.agroInputType}`,
      data.agroInputType === "Fertilizer" ? `Category: ${data.agroInputCategory} - ${data.agroInputSubCategory}` : "",
      `Application Date: ${data.application_date}`,
      `Rate: ${data.application_rate}`,
      `Total Weight: ${data.agroinput_weight} kg`,
      `Price/Kg: ${data.price_per_kg} UGX`,
      `Total: ${data.total_price} UGX`,
      `Store: ${data.store_name} (${data.store_id})`,
      `Transaction Date: ${data.transaction_date}`,
      `Payment: ${data.payment_type}`,
    ].filter(Boolean).join("\n");
  };

  const handleSubmit = () => setQrData(generateQrData(formData));

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const base        = JSON.parse(JSON.stringify(formData));
      const batchNumber = parseInt(base.batch_number, 10);
      if (isNaN(batchNumber)) return;
      const qrList = Array.from({ length: batchNumber }, (_, i) => ({ ...base, batch_number: (i + 1).toString() }));
      const res = await axiosInstance.post(
        "/api/qrcode/generate_pdf",
        { qr_data_list: qrList, description: "Digital receipt for fertilizer transaction." },
        { responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `fertilizer_receipts_${base.batch_number}_batches.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  return (
    // ✅ light-panel on root → fixes all text/label visibility inside
    <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 min-h-screen py-8 light-panel">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center text-teal-700">
          Generate Digital Codes for Fertilizer Application
        </h1>

        <StepIndicator currentStep={currentStep} totalSteps={formSteps.length} stepNames={fertilizerStepNames}/>

        <div className="flex gap-8 max-w-7xl mx-auto">
          <div className="w-1/2">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6 text-teal-700">
                {formSteps[currentStep]?.title}
              </h2>

              {weightMissing && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-300
                                text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div>
                    <p className="font-semibold">Farm quantities not filled</p>
                    <p className="text-xs mt-0.5 text-amber-700">
                      Go back to <strong>Step 1 — Farms</strong> and enter the
                      <strong> Quantity applied (kg)</strong> for each farm.
                    </p>
                    <button type="button" onClick={() => setCurrentStep(0)}
                      className="mt-2 text-xs font-semibold text-amber-800 underline hover:no-underline">
                      ← Go back to Farms step
                    </button>
                  </div>
                </div>
              )}

              <FormStep
                step={formSteps[currentStep]}
                formData={formData}
                onChange={handleFormChange}
                onCategoryChange={handleAgroInputCategoryChange}
                onStoreChange={handleStoreChange}
                farmBlocks={farmBlocks}
                onAddFarm={addFarmBlock}
                onRemoveFarm={removeFarmBlock}
                onFarmChange={handleFarmChange}
                farms={farms}
                districts={districts}
                showFarmQty={currentStep === 0}
                farmQtyLabel="Quantity applied (kg)"
                farmQtyKey="qty"
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
                formData={formData}
                farmBlocks={farmBlocks}
                formType="fertilizer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FertilizerQrPage;