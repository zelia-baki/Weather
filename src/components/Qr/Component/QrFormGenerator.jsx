import React, { useState } from "react";
import InputField from "./InputField";
import SelectField from "../SelectField";
import QRCodeRenderer from "./QRCodeRenderer";

const QrFormGenerator = ({
  title,
  fields, // tableau de configuration des champs
  generateQrData, // fonction qui transforme formData en texte à encoder
}) => {
  const [formData, setFormData] = useState({});
  const [qrData, setQrData] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const qrText = generateQrData(formData);
    setQrData(qrText);
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10">
      <div className="flex gap-10 w-full">
        <div className="container mx-auto">
          <h1 className="text-5xl font-extrabold mb-12 text-center text-teal-700">
            {title}
          </h1>

          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto bg-white p-10 rounded-lg shadow-xl transform transition-transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) =>
                field.type === "select" ? (
                  <SelectField
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    required={field.required}
                  />
                )
              )}
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white px-8 py-4 rounded-lg w-full text-lg font-bold transition-all transform hover:scale-105"
            >
              Générer le QR Code
            </button>
          </form>
        </div>

        {/* QR rendu */}
        <div className="flex flex-col justify-center items-center">
          {qrData && <QRCodeRenderer qrCodes={[qrData]} />}
        </div>
      </div>
    </div>
  );
};

export default QrFormGenerator;
