// src/pages/ConservationQrPage.jsx
import React from "react";
import QrFormWithReceipt from "../Component/QrFormWithReceipt";

const ConservationQrPage = () => {
  const fields = [
    { label: "Forest Name", name: "forest_name", required: true },
    { label: "Forest ID", name: "forest_id", required: true },
    { label: "Tree Type", name: "tree_type", required: true },
    { label: "Date of Cutting", name: "date_cutting", type: "date", required: true },
    { label: "GPS Coordinates", name: "gps_coordinates", required: true },
    { label: "Height (m)", name: "height", required: true },
    { label: "Diameter (cm)", name: "diameter", required: true },
    { label: "Batch Number", name: "batch_number", required: true },
  ];

  const generateQrData = (data) => `
    Forest Name: ${data.forest_name}
    Forest ID: ${data.forest_id}
    Tree Type: ${data.tree_type}
    Date of Cutting: ${data.date_cutting}
    GPS: ${data.gps_coordinates}
    Height: ${data.height}
    Diameter: ${data.diameter}
    Batch: ${data.batch_number}
  `;

  return (
    <QrFormWithReceipt
      title="Generate Digital Codes for Tree Cutting"
      fields={fields}
      generateQrData={generateQrData}
    />
  );
};

export default ConservationQrPage;
