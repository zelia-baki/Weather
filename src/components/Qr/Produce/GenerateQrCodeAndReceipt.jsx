import React, { useState, useEffect } from "react";
import axiosInstance from "../../../axiosInstance";

// ---------- Composants réutilisables ----------
import InputField from "../Component/InputField";
import SelectField from "../Component/SelectField";
import Receipt from "../Component/Qr_receipt";

// ---------- Hook utilitaire pour fetch ----------
import useFetchData from "./hooks/useFetchData";
import { receiptStyles } from "../receipt-styles";

const GenerateQrCodeAndReceipt = () => {
  const [formData, setFormData] = useState({});
  const [grades, setGrades] = useState([]);
  const [qrData, setQrData] = useState(null);

  const farms = useFetchData("/api/farm/", "farms");
  const districts = useFetchData("/api/district/", "districts");
  const countries = useFetchData("/api/pays/", "pays");
  const stores = useFetchData("/api/store/", "stores");
  const produceCategories = useFetchData("/api/producecategory/", "categories");

  const [farmBlocks, setFarmBlocks] = useState([{ id: "", props: {} }]);

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
        const { data } = await axiosInstance.get(`/api/farm/${farm_id}/allprop`);
        if (data.status === "success") {
          const props = data.data[0];
          setFarmBlocks((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, id: farm_id, props } : f
            )
          );
          setFormData((prev) => ({
            ...prev,
            [`farm_${index}_phone`]: props.phone_number || "",
            [`farm_${index}_district`]: props.district_id || "",
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
    setFarmBlocks((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => {
      const newData = { ...prev };
      delete newData[`farm_${index}_id`];
      delete newData[`farm_${index}_phone`];
      delete newData[`farm_${index}_district`];
      return newData;
    });
  };

  // -------- Champs généraux --------
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

  // -------- Soumission --------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // JSON joliment indenté
    const qrJson = JSON.stringify(formData, null, 2);
    setQrData(qrJson);
  };

  const handleDownloadPDF = async () => {
    try {
      const receiptElement = document.getElementById("receipt");
      if (!receiptElement) return;

      const receiptHtml = `
        <html>
          <head><meta charset="utf-8" /><style>${receiptStyles}</style></head>
          <body>${receiptElement.outerHTML}</body>
        </html>
      `;

      const response = await axiosInstance.post(
        "/api/gfw/generate-pdf",
        { html: receiptHtml },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "receipt.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur téléchargement PDF:", err);
    }
  };

  // -------- UI --------
  return (
    <div className="bg-gradient-to-r via-white-50 to-white-50 min-h-screen flex justify-center items-center p-10">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
          Generate Digital Codes and E-Receipt for Farmer
        </h1>

        <div className="flex gap-6">
          <form
            onSubmit={handleSubmit}
            className="w-1/2 bg-white p-10 rounded-lg shadow-xl hover:scale-105 transition"
          >
            {farmBlocks.map((farm, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg p-4 mb-6 shadow-sm bg-gray-50"
              >
                <h3 className="text-lg font-semibold mb-3 text-teal-700">
                  Farm #{index + 1}
                </h3>
                <SelectField
                  label="Farm ID"
                  name={`farm_${index}_id`}
                  value={formData[`farm_${index}_id`] || ""}
                  onChange={(e) => handleFarmChange(e, index)}
                  options={farms.map((f) => ({
                    value: f.id,
                    label: `${f.name} - ${f.subcounty}`,
                  }))}
                  required
                />
                <InputField
                  label="Phone Number"
                  name={`farm_${index}_phone`}
                  value={formData[`farm_${index}_phone`] || ""}
                  onChange={handleChange}
                  required
                />
                <SelectField
                  label="District"
                  name={`farm_${index}_district`}
                  value={formData[`farm_${index}_district`] || ""}
                  onChange={handleChange}
                  options={districts.map((d) => ({ value: d.id, label: d.name }))}
                  required
                />
                <div className="flex gap-2 mt-2">
                  {farmBlocks.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600"
                      onClick={() => removeFarmBlock(index)}
                    >
                      Remove Farm
                    </button>
                  )}
                  {index === farmBlocks.length - 1 && (
                    <button
                      type="button"
                      className="text-green-600"
                      onClick={addFarmBlock}
                    >
                      + Add Farm
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Champs généraux */}
            <InputField
              label="Batch Number"
              name="batch_number"
              value={formData.batch_number || ""}
              onChange={handleChange}
              required
            />
            <SelectField
              label="Country"
              name="country_of_origin"
              value={formData.country_of_origin || ""}
              onChange={handleChange}
              options={countries.map((c) => ({ value: c.nom_en_gb, label: c.nom_en_gb }))}
              required
            />
            <SelectField
              label="Produce Category"
              name="produceCategory"
              value={formData.produceCategory || ""}
              onChange={handleCategoryChange}
              options={produceCategories.map((c) => ({ value: c.name, label: c.name }))}
              required
            />
            <SelectField
              label="Produce Grade"
              name="Crop_grade"
              value={formData.Crop_grade || ""}
              onChange={handleChange}
              options={grades.map((g) => ({
                value: g.grade_value,
                label: `${g.grade_value} - ${g.description || ""}`,
              }))}
              required
            />
            <SelectField
              label="Season"
              name="season"
              value={formData.season || ""}
              onChange={handleChange}
              options={["Season1","Season2","Season3","Season4"].map((s) => ({ value: s, label: s }))}
              required
            />
            <InputField
              label="Produce Weight (kg)"
              type="number"
              name="produce_weight"
              value={formData.produce_weight || ""}
              onChange={handleChange}
              required
            />
            <InputField
              label="Price Per Kg (UGX)"
              type="number"
              name="price_per_kg"
              value={formData.price_per_kg || ""}
              onChange={handleChange}
              required
            />
            <InputField
              label="Total Value (UGX)"
              type="number"
              name="total_value"
              value={formData.total_value || ""}
              onChange={handleChange}
              required
            />
            <SelectField
              label="Payment Type"
              name="payment_type"
              value={formData.payment_type || ""}
              onChange={handleChange}
              options={[
                { value: "cash", label: "Cash" },
                { value: "bank_transfer", label: "Bank Transfer" },
              ]}
              required
            />
            <SelectField
              label="Store ID"
              name="store_id"
              value={formData.store_id || ""}
              onChange={handleChange}
              options={stores.map((s) => ({ value: s.id, label: s.id }))}
              required
            />
            <SelectField
              label="Store Name"
              name="store_name"
              value={formData.store_name || ""}
              onChange={handleChange}
              options={stores.map((s) => ({ value: s.name, label: s.name }))}
              required
            />
            <InputField
              label="Transaction Date"
              type="date"
              name="transaction_date"
              value={formData.transaction_date || ""}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              className="bg-teal-600 text-white p-4 mt-6 rounded-lg shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-400 w-full"
            >
              Generate QR Code and Receipt
            </button>
          </form>

          {/* Reçu + QR à droite */}
          <div className="w-1/2">
            {qrData && (
              <>
                <Receipt description="Digital receipt for produce transaction" qrData={qrData} fields={formData} />
                <button
                  onClick={handleDownloadPDF}
                  className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700"
                >
                  Télécharger en PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateQrCodeAndReceipt;
