// src/pages/FertilizerQrPage.jsx
import React, { useState } from "react";
import QrFormWithReceipt from "../Component/QrFormWithReceipt";
import useFetchData from "../Produce/hooks/useFetchData";
import axiosInstance from "../../../axiosInstance";

const FertilizerQrPage = () => {
  const farms = useFetchData("/api/farm/", "farms");
  const districts = useFetchData("/api/district/", "districts");

  const [farmBlocks, setFarmBlocks] = useState([{ id: "", props: {} }]);

  const handleFarmChange = async (e, index, setFormData) => {
    const farm_id = e.target.value;
    const farmKey = `farm_${index}_id`;

    setFormData((prev) => ({
      ...prev,
      [farmKey]: farm_id,
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
          setFormData((prev) => ({ ...prev, ...props }));
        }
      } catch (error) {
        console.error("Error fetching farm properties:", error);
      }
    }
  };

  const addFarmBlock = () => {
    setFarmBlocks((prev) => [...prev, { id: "", props: {} }]);
  };

  const removeFarmBlock = (index, setFormData) => {
    setFarmBlocks((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => {
      const newData = { ...prev };
      delete newData[`farm_${index}_id`];
      delete newData[`farm_${index}_phone`];
      delete newData[`farm_${index}_district`];
      return newData;
    });
  };

  // 🔹 Construction dynamique des blocs de fermes
  const farmFields = farmBlocks.map((farm, index) => {
    const isLast = index === farmBlocks.length - 1;

    return {
      type: "group", // custom type pour dire "bloc visuel"
      label: `Farm #${index + 1}`,
      fields: [
        {
          label: "Farm ID",
          name: `farm_${index}_id`,
          type: "select",
          required: true,
          options: farms.map((f) => ({
            value: f.id,
            label: `${f.name} - ${f.subcounty}`,
          })),
          onChange: (e, setFormData) => handleFarmChange(e, index, setFormData),
        },
        {
          label: "Farmer Phone Number",
          name: `farm_${index}_phone`,
          required: true,
        },
        {
          label: "District",
          name: `farm_${index}_district`,
          type: "select",
          required: true,
          options: districts.map((d) => ({ value: d.id, label: d.name })),
        },
      ],
      extra: (
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          {farmBlocks.length > 1 && (
            <button
              type="button"
              onClick={() => removeFarmBlock(index, setFormData)}
              style={{ color: "red" }}
            >
              Remove Farm
            </button>
          )}
          {isLast && (
            <button
              type="button"
              onClick={addFarmBlock}
              style={{ color: "green" }}
            >
              + Add Farm
            </button>
          )}
        </div>
      ),
    };
  });

  // 🔹 Champs fixes
  const baseFields = [
    { label: "Batch Number", name: "batch_number", required: true },
    {
      label: "Payment Type",
      name: "payment_type",
      type: "select",
      required: true,
      options: [
        { value: "cash", label: "Cash" },
        { value: "credit", label: "Credit" },
        { value: "mobilemoney", label: "Mobile Money" },
        { value: "visa", label: "Visa" },
      ],
    },
    {
      label: "Store Name",
      name: "store_name",
      type: "select",
      required: true,
      options: [
        { value: "store1", label: "Store 1" },
        { value: "store2", label: "Store 2" },
      ],
    },
    { label: "Application Date", name: "application_date", type: "date", required: true },
    { label: "Application Rate (kg/Acre)", name: "application_rate", required: true },
    {
      label: "AgroInput Category",
      name: "agroInputCategory",
      type: "select",
      required: true,
      options: [
        { value: "Fertilizers", label: "Fertilizers" },
        { value: "Pesticides", label: "Pesticides" },
      ],
    },
    { label: "AgroInput Type", name: "agroInputType", required: true },
    { label: "AgroInput Weight (Kgs)", name: "agroinput_weight", required: true },
    { label: "Price / Kg (Ugshs)", name: "price_per_kg", required: true },
    { label: "Total Price (Ugshs)", name: "total_price", required: true },
    { label: "Store ID", name: "store_id", required: true },
    { label: "Transaction Date", name: "transaction_date", type: "date", required: true },
  ];

  const fields = [...farmFields, ...baseFields];

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
      Fertilizer: ${data.agroInputType}
      Application Date: ${data.application_date}
      Rate: ${data.application_rate}
      Weight: ${data.agroinput_weight}
      Price/Kg: ${data.price_per_kg}
      Total: ${data.total_price}
    `;
  };

  return (
    <QrFormWithReceipt
      title="Generate Digital Codes for Fertilizer Application"
      fields={fields}
      generateQrData={generateQrData}
    />
  );
};

export default FertilizerQrPage;
