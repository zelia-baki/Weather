import React from "react";

const SelectField = ({ 
  label, 
  name, 
  value, 
  options, 
  onChange, 
  required, 
  disabled = false, 
  placeholder 
}) => (
  <div className="mb-6">
    <label className="text-lg text-gray-800 mb-2 block" htmlFor={name}>
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`border-2 p-4 w-full rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-400 ${
        disabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''
      }`}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default SelectField;