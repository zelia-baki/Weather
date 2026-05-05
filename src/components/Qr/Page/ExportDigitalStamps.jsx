import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../axiosInstance";
import StepIndicator  from "../Component/StepIndicator";
import FormNavigation from "../Component/FormNavigation";
import FormStep       from "../Component/FormStep";
import ReceiptPreview from "../Component/ReceiptPreview";
import { createExportFormSteps, exportStepNames } from "../Component/exportStepsConfig";

// ─── Auto-computation helper ──────────────────────────────────
const recompute = (data, blocks) => {
  const totalWeight = blocks.reduce(
    (sum, _, i) => sum + (parseFloat(data[`farm_${i}_qty`]) || 0),
    0
  );
  return { produce_weight: totalWeight.toFixed(2) };
};

const PointForm = () => {
  const [currentStep,       setCurrentStep]       = useState(0);
  const [formData,          setFormData]          = useState({
    farm_id: "", farmergroup_id: "", district_name: "", country_of_origin: "",
    crop_category: "", crop_grade: "", crop: "", produce_weight: "",
    batch_number: "", harvest_date: "", timestamp: "", geolocation: "",
    store_name: "", season: "", destination_country: "", channel_partner: "",
    end_customer_name: "", coffeeType: "", hscode: "", store_id: "",
  });

  const [farms,         setFarms]         = useState([]);
  const [farmBlocks,    setFarmBlocks]    = useState([{ id: "", props: {} }]);
  const [categorys,     setCategory]      = useState([]);
  const [districts,     setDistricts]     = useState([]);
  const [farmerGroups,  setFarmerGroups]  = useState([]);
  const [crops,         setCrops]         = useState([]);
  const [countries,     setCountries]     = useState([]);
  const [stores,        setStores]        = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [cropGrades,    setCropGrades]    = useState([]);
  const [qrData,        setQrData]        = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error,         setError]         = useState(null);

  const formSteps = createExportFormSteps(
    farmBlocks, farmerGroups, districts, categorys,
    filteredCrops, cropGrades, stores, countries, formData.coffeeType
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmsRes, districtsRes, farmerGroupsRes, cropsRes, countriesRes, categorysRes, storesRes] =
          await Promise.all([
            axiosInstance.get("/api/farm/"),
            axiosInstance.get("/api/district/"),
            axiosInstance.get("/api/farmergroup/"),
            axiosInstance.get("/api/crop/"),
            axiosInstance.get("/api/pays/"),
            axiosInstance.get("/api/producecategory/"),
            axiosInstance.get("/api/store/"),
          ]);
        setFarms(farmsRes.data.farms || []);
        setDistricts(districtsRes.data.districts || []);
        setFarmerGroups(farmerGroupsRes.data || []);
        setCrops(cropsRes.data.crops || []);
        setCountries(countriesRes.data.pays || []);
        setCategory(categorysRes.data.categories || []);
        setStores(storesRes.data.stores || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  // ── Recompute when farmBlocks count changes ─────────────────
  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...recompute(prev, farmBlocks) }));
  }, [farmBlocks.length]);

  // ── Change handler ───────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name.includes("_qty")) return { ...next, ...recompute(next, farmBlocks) };
      if (name === "coffeeType") return { ...next, hscode: "" };
      return next;
    });
    if (name === "crop_category") handleCategoryChange(value);
    else if (name === "crop")     handleCropChange(value);
  }, [farmBlocks]);

  const handleCategoryChange = (selectedCatId) => {
    const filtered = crops.filter((c) => c.category_id.toString() === selectedCatId);
    setFilteredCrops(filtered);
    setFormData((prev) => ({ ...prev, crop_category: selectedCatId, crop: "", crop_grade: "" }));
    setCropGrades([]);
  };

  const handleCropChange = (cropId) => {
    setFormData((prev) => ({ ...prev, crop: cropId, crop_grade: "" }));
    if (cropId) {
      axiosInstance.get(`/api/grade/getbycrop/${cropId}`)
        .then((res) => setCropGrades(res.data.grades || []))
        .catch(() => setCropGrades([]));
    } else {
      setCropGrades([]);
    }
  };

  const handleStoreChange = (e, type) => {
    const value = e.target.value;
    const store = type === "id"
      ? stores.find((s) => s.id.toString() === value)
      : stores.find((s) => s.name === value);
    if (store) {
      setFormData((prev) => ({ ...prev, store_id: store.id, store_name: store.name }));
    } else {
      setFormData((prev) => ({ ...prev, [type === "id" ? "store_id" : "store_name"]: value }));
    }
  };

  // ── Farm auto-fill ───────────────────────────────────────────
  const handleFarmChange = async (e, index) => {
    const farm_id = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [`farm_${index}_id`]: farm_id };
      return { ...next, ...recompute(next, farmBlocks) };
    });
    setFarmBlocks((prev) => prev.map((f, i) => (i === index ? { ...f, id: farm_id } : f)));
    if (farm_id) {
      try {
        const res = await axiosInstance.get(`/api/farm/${farm_id}`);
        if (res.data.status === "success") {
          const p = res.data.data;
          setFormData((prev) => ({
            ...prev,
            [`farm_${index}_phone`]:    p.phonenumber1 || p.phonenumber2 || "",
            [`farm_${index}_district`]: p.district_id  || "",
          }));
        }
      } catch { /* ignore */ }
    }
  };

  const addFarmBlock    = () => setFarmBlocks((prev) => [...prev, { id: "", props: {} }]);
  const removeFarmBlock = (index) => {
    if (farmBlocks.length <= 1) return;
    const next = farmBlocks.filter((_, i) => i !== index);
    setFarmBlocks(next);
    setFormData((prev) => {
      const d = { ...prev };
      delete d[`farm_${index}_id`];
      delete d[`farm_${index}_phone`];
      delete d[`farm_${index}_district`];
      delete d[`farm_${index}_qty`];
      return { ...d, ...recompute(d, next) };
    });
  };

  // ── Validation ───────────────────────────────────────────────
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

  // ── QR generation ────────────────────────────────────────────
  const generateQrData = (data) => {
    const farmsList = farmBlocks
      .map((_, i) => ({
        id:       data[`farm_${i}_id`]       || "",
        phone:    data[`farm_${i}_phone`]    || "",
        district: data[`farm_${i}_district`] || "",
        qty:      data[`farm_${i}_qty`]      || "0",
      }))
      .filter((f) => f.id);

    return [
      `Farms: ${farmsList.map((f) => `www.nkusu.com/farmmanager/${f.id}`).join(", ")}`,
      `Phones: ${farmsList.map((f) => f.phone).join(", ")}`,
      `Districts: ${farmsList.map((f) => f.district).join(", ")}`,
      `Weights (kg): ${farmsList.map((f) => f.qty).join(", ")}`,
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

  // ── PDF download ─────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const batchNumber = parseInt(formData.batch_number, 10);
      if (isNaN(batchNumber)) return;

      const qrList = Array.from({ length: batchNumber }, (_, i) => ({
        ...formData,
        batch_number: (i + 1).toString(),
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

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-700">
          Digital Export Stamps
        </h1>

        <StepIndicator currentStep={currentStep} totalSteps={formSteps.length} stepNames={exportStepNames} />

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
                onPrevStep={() => setCurrentStep((s) => s - 1)}
                onNextStep={() => setCurrentStep((s) => s + 1)}
                onSubmit={handleSubmit}
                isStepValid={isStepValid()}
              />
            </div>
          </div>

          {/* Live receipt */}
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

export default PointForm;