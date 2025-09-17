import React from "react";

const InputField = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  required, 
  readOnly = false, 
  placeholder 
}) => (
  <div className="mb-6">
    <label className="text-lg text-gray-800 mb-2 block" htmlFor={name}>
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400 ${
        readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''
      }`}
    />
  </div>
);

export default InputField;