import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../axiosInstance";
import StepIndicator  from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep       from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";
import { createExportFormSteps, exportStepNames } from "../Component/exportStepsConfig";

// ✅ Same hook as ProduceQrPage & FertilizerQrPage — handles pagination automatically
import useFetchData from "../../Qr/Produce/useFetchData";

// ─── Auto-computation ──────────────────────────────────────────────────────────
const recompute = (data, blocks) => {
  const totalWeight = blocks.reduce(
    (sum, _, i) => sum + (parseFloat(data[`farm_${i}_qty`]) || 0),
    0
  );
  return { produce_weight: totalWeight.toFixed(2) };
};

const ExportDigitalStamps = () => {
  const [currentStep,    setCurrentStep]    = useState(0);
  const [formData,       setFormData]       = useState({
    farm_id: "", farmergroup_id: "", district_name: "", country_of_origin: "",
    crop_category: "", crop_grade: "", crop: "", produce_weight: "",
    batch_number: "", harvest_date: "", timestamp: "", geolocation: "",
    store_name: "", season: "", destination_country: "", channel_partner: "",
    end_customer_name: "", coffeeType: "", hscode: "", store_id: "",
  });
  const [farmBlocks,     setFarmBlocks]     = useState([{ id: "", props: {} }]);
  const [categorys,      setCategory]       = useState([]);
  const [filteredCrops,  setFilteredCrops]  = useState([]);
  const [cropGrades,     setCropGrades]     = useState([]);
  const [qrData,         setQrData]         = useState(null);
  const [isDownloading,  setIsDownloading]  = useState(false);
  const [error,          setError]          = useState(null);

  // ✅ FIX: use useFetchData (paginated) instead of a single axiosInstance.get()
  const farms        = useFetchData("/api/farm/",            "farms");       // ← was only loading page 1
  const districts    = useFetchData("/api/district/",        "districts");
  const countries    = useFetchData("/api/pays/",            "pays");
  const stores       = useFetchData("/api/store/",           "stores");
  const crops        = useFetchData("/api/crop/",            "crops");

  // farmerGroups & categories — APIs return array/object directly, fetched separately
  const [farmerGroups, setFarmerGroups] = useState([]);
  useEffect(() => {
    axiosInstance.get("/api/farmergroup/")
      .then(r => setFarmerGroups(Array.isArray(r.data) ? r.data : r.data.farmergroups || []))
      .catch(() => {});
    axiosInstance.get("/api/producecategory/")
      .then(r => setCategory(r.data.categories || []))
      .catch(() => {});
  }, []);

  // Build form steps
  const formSteps = createExportFormSteps(
    farmBlocks,
    Array.isArray(farmerGroups) ? farmerGroups : [],
    districts,
    categorys,
    filteredCrops,
    cropGrades,
    stores,
    countries,
    formData.coffeeType
  );

  // Recompute on farmBlocks count change
  useEffect(() => {
    setFormData(prev => ({ ...prev, ...recompute(prev, farmBlocks) }));
  }, [farmBlocks.length]);

  // ── Change handler ─────────────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name.includes("_qty"))  return { ...next, ...recompute(next, farmBlocks) };
      if (name === "coffeeType")  return { ...next, hscode: "" };
      return next;
    });
    if (name === "crop_category") handleCategoryChange(value);
    else if (name === "crop")     handleCropChange(value);
  }, [farmBlocks]); // eslint-disable-line

  const handleCategoryChange = (selectedCatId) => {
    const filtered = crops.filter(c => c.category_id?.toString() === selectedCatId?.toString());
    setFilteredCrops(filtered);
    setFormData(prev => ({ ...prev, crop_category: selectedCatId, crop: "", crop_grade: "" }));
    setCropGrades([]);
  };

  const handleCropChange = (cropId) => {
    setFormData(prev => ({ ...prev, crop: cropId, crop_grade: "" }));
    if (cropId) {
      axiosInstance.get(`/api/grade/getbycrop/${cropId}`)
        .then(r => setCropGrades(r.data.grades || []))
        .catch(() => setCropGrades([]));
    } else {
      setCropGrades([]);
    }
  };

  const handleStoreChange = (e, type) => {
    const value = e.target.value;
    const store = type === "id"
      ? stores.find(s => s.id?.toString() === value)
      : stores.find(s => s.name === value);
    if (store) {
      setFormData(prev => ({ ...prev, store_id: store.id, store_name: store.name }));
    } else {
      setFormData(prev => ({ ...prev, [type === "id" ? "store_id" : "store_name"]: value }));
    }
  };

  // ── Farm auto-fill ─────────────────────────────────────────────────────────
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
      } catch { /* ignore */ }
    }
  };

  const addFarmBlock    = () => setFarmBlocks(prev => [...prev, { id: "", props: {} }]);
  const removeFarmBlock = (index) => {
    if (farmBlocks.length <= 1) return;
    const next = farmBlocks.filter((_, i) => i !== index);
    setFarmBlocks(next);
    setFormData(prev => {
      const d = { ...prev };
      delete d[`farm_${index}_id`];
      delete d[`farm_${index}_phone`];
      delete d[`farm_${index}_district`];
      delete d[`farm_${index}_qty`];
      return { ...d, ...recompute(d, next) };
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
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

  // ── Weight warning ─────────────────────────────────────────────────────────
  const PRODUCT_STEP  = 2;
  const weightMissing = currentStep === PRODUCT_STEP &&
    (!formData.produce_weight || parseFloat(formData.produce_weight) === 0);

  // ── QR generation ──────────────────────────────────────────────────────────
  const generateQrData = (data) => {
    const farmsList = farmBlocks
      .map((_, i) => ({
        id:       data[`farm_${i}_id`]       || "",
        phone:    data[`farm_${i}_phone`]    || "",
        district: data[`farm_${i}_district`] || "",
        qty:      data[`farm_${i}_qty`]      || "0",
      }))
      .filter(f => f.id);

    return [
      `Farms: ${farmsList.map(f => `www.nkusu.com/farmmanager/${f.id}`).join(", ")}`,
      `Phones: ${farmsList.map(f => f.phone).join(", ")}`,
      `Districts: ${farmsList.map(f => f.district).join(", ")}`,
      `Weights (kg): ${farmsList.map(f => f.qty).join(", ")}`,
      `Total Weight: ${data.produce_weight} kg`,
      `Farmer Group: ${data.farmergroup_id}`,
      `Destination: ${data.destination_country}`,
      `CP: ${data.channel_partner}`,
      `ECN: ${data.end_customer_name}`,
      `Store Name: ${data.store_name}`,
      `Crop Category: ${data.crop_category}`,
      `Grade: ${data.crop_grade || "N/A"}`,
      `Coffee Type: ${data.coffeeType}`,
      `HS Code: ${data.hscode}`,
      `Season: ${data.season}`,
      `Geolocation: ${data.geolocation}`,
      `Country Origin: ${data.country_of_origin}`,
      `Transaction Date: ${data.timestamp}`,
    ].join("\n");
  };

  const handleSubmit = () => setQrData(generateQrData(formData));

  // ── PDF download ────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const batchNumber = parseInt(formData.batch_number, 10);
      if (isNaN(batchNumber)) return;

      const qrList = Array.from({ length: batchNumber }, (_, i) => ({
        ...formData, batch_number: (i + 1).toString(),
      }));

      const res = await axiosInstance.post(
        "/api/qrcode/generate_pdf",
        { qr_data_list: qrList, description: "Digital receipt for export transaction." },
        { responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `export_receipts_${batchNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Farm count badge ────────────────────────────────────────────────────────
  const loadedFarmCount = Array.isArray(farms) ? farms.length : 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen py-8 light-panel">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700 mb-1">
            Digital Export Stamps
          </h1>
          {/* ✅ Shows how many farms were loaded so user knows pagination worked */}
          {loadedFarmCount > 0 && (
            <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"/>
              {loadedFarmCount} farm{loadedFarmCount !== 1 ? "s" : ""} loaded
            </p>
          )}
        </div>

        <StepIndicator
          currentStep={currentStep}
          totalSteps={formSteps.length}
          stepNames={exportStepNames}
        />

        <div className="flex gap-8 max-w-7xl mx-auto">

          {/* Form */}
          <div className="w-1/2">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">
                {formSteps[currentStep]?.title}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}

              {/* Weight warning */}
              {weightMissing && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-300
                                text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div>
                    <p className="font-semibold">Farm quantities not filled</p>
                    <p className="text-xs mt-0.5 text-amber-700">
                      Go back to <strong>Step 1 — Farm & Group</strong> and enter the
                      <strong> Weight contributed (kg)</strong> for each farm.
                      The total produce weight will be auto-computed.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="mt-2 text-xs font-semibold text-amber-800 underline hover:no-underline"
                    >
                      ← Go back to Farm step
                    </button>
                  </div>
                </div>
              )}

              <FormStep
                step={formSteps[currentStep]}
                formData={formData}
                onChange={handleChange}
                onCategoryChange={handleCategoryChange}
                onStoreChange={handleStoreChange}
                farmBlocks={farmBlocks}
                onAddFarm={addFarmBlock}
                onRemoveFarm={removeFarmBlock}
                onFarmChange={handleFarmChange}
                farms={farms}
                districts={districts}
                showFarmQty={currentStep === 0}
                farmQtyLabel="Weight contributed (kg)"
                farmQtyKey="qty"
              />

              <FormNavigation
                currentStep={currentStep}
                totalSteps={formSteps.length}
                onPrevStep={() => setCurrentStep(s => s - 1)}
                onNextStep={() => setCurrentStep(s => s + 1)}
                onSubmit={handleSubmit}
                isStepValid={isStepValid()}
              />
            </div>
          </div>

          {/* Receipt preview — unchanged */}
          <div className="w-1/2">
            <div className="sticky top-8">
              <ReceiptPreview
                qrData={qrData}
                onDownloadPDF={handleDownloadPDF}
                isDownloading={isDownloading}
                formData={formData}
                farmBlocks={farmBlocks}
                formType="export"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDigitalStamps;