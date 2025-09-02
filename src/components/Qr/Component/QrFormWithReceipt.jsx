// src/components/QrFormWithReceipt.jsx
import React, { useState } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import QRCodeRenderer from "./QRCodeRenderer";
import Receipt from "./Qr_receipt";
import axiosInstance from "../../../axiosInstance";
import { receiptStyles } from "../receipt-styles";

const QrFormWithReceipt = ({ title, fields, generateQrData }) => {
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState(null);

  const handleDefaultChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qrText = generateQrData(formData);
    setQrData(qrText);
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

  return (
    <div className="bg-gradient-to-r via-white-50 to-white-50 min-h-screen flex justify-center items-center p-10">
      <div className="container mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
          {title}
        </h1>

        <div className="flex gap-6">
          {/* Formulaire */}
          <form
            onSubmit={handleSubmit}
            className="w-1/2 bg-white p-10 rounded-lg shadow-xl hover:scale-105 transition"
          >
            {fields.map((field) =>
              field.type === "group" ? (
                <div
                  key={field.label}
                  className="border border-gray-300 rounded-lg p-4 mb-6 shadow-sm bg-gray-50"
                >
                  <h3 className="text-lg font-semibold mb-3 text-teal-700">
                    {field.label}
                  </h3>
                  {field.fields.map((sub) =>
                    sub.type === "select" ? (
                      <SelectField
                        key={sub.name}
                        label={sub.label}
                        name={sub.name}
                        value={formData[sub.name] || ""}
                        onChange={
                          sub.onChange
                            ? (e) => sub.onChange(e, setFormData)
                            : handleDefaultChange
                        }
                        options={sub.options || []}
                        required={sub.required}
                      />
                    ) : (
                      <InputField
                        key={sub.name}
                        label={sub.label}
                        type={sub.type || "text"}
                        name={sub.name}
                        value={formData[sub.name] || ""}
                        onChange={handleDefaultChange}
                        required={sub.required}
                      />
                    )
                  )}
                  {field.extra && <div className="mt-2">{field.extra}</div>}
                </div>
              ) : field.type === "select" ? (
                <SelectField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={
                    field.onChange
                      ? (e) => field.onChange(e, setFormData)
                      : handleDefaultChange
                  }
                  options={field.options || []}
                  required={field.required}
                />
              ) : (
                <InputField
                  key={field.name}
                  label={field.label}
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleDefaultChange}
                  required={field.required}
                />
              )
            )}

            <button
              type="submit"
              className="bg-teal-600 text-white p-4 mt-6 rounded-lg shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-400 w-full"
            >
              Générer QR & Reçu
            </button>
          </form>

          {/* QR + reçu */}
          <div className="w-1/2">
            {qrData && (
              <>
                <Receipt description="Digital receipt" qrData={qrData} />
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

export default QrFormWithReceipt;
