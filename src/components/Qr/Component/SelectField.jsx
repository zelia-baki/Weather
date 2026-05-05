import React from "react";

const SelectField = ({
  label,
  name,
  value,
  options,
  onChange,
  required,
  disabled = false,
  placeholder,
  showError = false,  // ← nouvelle prop
}) => {
  const isEmpty    = required && !disabled && !value;
  const showBorder = showError && isEmpty;

  return (
    <div className="mb-4">
      <label
        className={`text-sm font-semibold mb-1.5 block ${
          disabled ? "text-gray-400" : "text-teal-700"
        }`}
        htmlFor={name}
      >
        {label}
        {required && !disabled && (
          <span className="text-red-400 ml-0.5">*</span>
        )}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required && !disabled}
        disabled={disabled}
        className={`border-2 p-3 w-full rounded-lg text-sm text-gray-800
          focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors
          ${disabled
            ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500 italic"
            : showBorder
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-white hover:border-teal-300"
          }`}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {showError && isEmpty && (
        <p className="text-red-400 text-xs mt-1">Please select an option</p>
      )}
    </div>
  );
};

export default SelectField;