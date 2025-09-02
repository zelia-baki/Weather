// src/pages/ProduceQrPage.jsx
import React, { useState } from "react";
import QrFormWithReceipt from "../Components/QrFormWithReceipt";
import useFetchData from "../Produce/hooks/useFetchData";
import axiosInstance from "../../../axiosInstance";

const ProduceQrPage = () => {
  const farms = useFetchData("/api/farm/", "farms");
  const districts = useFetchData("/api/district/", "districts");
  const countries = useFetchData("/api/pays/", "pays");
  const stores = useFetchData("/api/store/", "stores");
  const produceCategories = useFetchData("/api/producecategory/", "categories");
  const [grades, setGrades] = useState([]);

  const handleFarmIdChange = async (e, setFormData) => {
    const farm_id = e.target.value;
    setFormData((prev) => ({ ...prev, farm_id }));

    if (farm_id) {
      const { data } = await axiosInstance.get(`/api/farm/${farm_id}/allprop`);
      if (data.status === "success") {
        const props = data.data[0];
        setFormData((prev) => ({
          ...prev,
          phone_number: props.phone_number || "",
          district_id: props.district_id || "",
        }));
      }
    }
  };

  const handleCategoryChange = async (e, setFormData) => {
    const produceCategory = e.target.value;
    setFormData((prev) => ({ ...prev, produceCategory }));

    const cat = produceCategories.find((c) => c.name === produceCategory);
    if (!cat) return;

    const res = await axiosInstance.get(`/api/grade/getbycrop/${cat.id}`);
    setGrades(res.data.status === "success" ? res.data.grades : []);
  };

  const fields = [
    {
      label: "Farm",
      name: "farm_id",
      type: "select",
      required: true,
      onChange: handleFarmIdChange,
      options: farms.map((f) => ({
        value: f.id,
        label: `${f.name} - ${f.subcounty}`,
      })),
    },
    { label: "Phone Number", name: "phone_number", required: true },
    { label: "Batch Number", name: "batch_number", required: true },
    {
      label: "District",
      name: "district_id",
      type: "select",
      required: true,
      options: districts.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      label: "Country",
      name: "country_of_origin",
      type: "select",
      required: true,
      options: countries.map((c) => ({
        value: c.nom_en_gb,
        label: c.nom_en_gb,
      })),
    },
    {
      label: "Produce Category",
      name: "produceCategory",
      type: "select",
      required: true,
      onChange: handleCategoryChange,
      options: produceCategories.map((c) => ({ value: c.name, label: c.name })),
    },
    {
      label: "Produce Grade",
      name: "Crop_grade",
      type: "select",
      required: true,
      options: grades.map((g) => ({
        value: g.grade_value,
        label: `${g.grade_value} - ${g.description || ""}`,
      })),
    },
    {
      label: "Season",
      name: "season",
      type: "select",
      required: true,
      options: ["Season1", "Season2", "Season3", "Season4"].map((s) => ({
        value: s,
        label: s,
      })),
    },
    {
      label: "Produce Weight (kg)",
      name: "produce_weight",
      type: "number",
      required: true,
    },
    {
      label: "Price Per Kg (UGX)",
      name: "price_per_kg",
      type: "number",
      required: true,
    },
    {
      label: "Total Value (UGX)",
      name: "total_value",
      type: "number",
      required: true,
    },
    {
      label: "Payment Type",
      name: "payment_type",
      type: "select",
      required: true,
      options: [
        { value: "cash", label: "Cash" },
        { value: "bank_transfer", label: "Bank Transfer" },
      ],
    },
    {
      label: "Store ID",
      name: "store_id",
      type: "select",
      required: true,
      options: stores.map((s) => ({ value: s.id, label: s.id })),
    },
    {
      label: "Store Name",
      name: "store_name",
      type: "select",
      required: true,
      options: stores.map((s) => ({ value: s.name, label: s.name })),
    },
    {
      label: "Transaction Date",
      name: "transaction_date",
      type: "date",
      required: true,
    },
  ];

  // ✅ Formatage lisible pour le QR (plus de JSON brut)
  const generateQrData = (data) =>
    [
      `Farm ID: ${data.farm_id}`,
      `Phone Number: ${data.phone_number}`,
      `Batch Number: ${data.batch_number}`,
      `District: ${data.district_id}`,
      `Country of Origin: ${data.country_of_origin}`,
      `Produce Category: ${data.produceCategory}`,
      `Produce Grade: ${data.Crop_grade}`,
      `Season: ${data.season}`,
      `Produce Weight (kg): ${data.produce_weight}`,
      `Price per Kg (UGX): ${data.price_per_kg}`,
      `Total Value (UGX): ${data.total_value}`,
      `Payment Type: ${data.payment_type}`,
      `Store ID: ${data.store_id}`,
      `Store Name: ${data.store_name}`,
      `Transaction Date: ${data.transaction_date}`,
    ].join("\n");

  return (
    <QrFormWithReceipt
      title="Generate Digital Codes and E-Receipt for Farmer"
      fields={fields}
      generateQrData={generateQrData}
    />
  );
};

export default ProduceQrPage;
