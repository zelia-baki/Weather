import React from "react";

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  readOnly = false,
  placeholder,
  showError = false,  // ← nouvelle prop pour feedback
}) => {
  const isEmpty    = required && !readOnly && !value;
  const showBorder = showError && isEmpty;

  return (
    <div className="mb-4">
      <label
        className={`text-sm font-semibold mb-1.5 block ${
          readOnly ? "text-gray-400" : "text-teal-700"
        }`}
        htmlFor={name}
      >
        {label}
        {required && !readOnly && (
          <span className="text-red-400 ml-0.5">*</span>
        )}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required && !readOnly}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`border-2 p-3 w-full rounded-lg text-sm text-gray-800
          focus:outline-none focus:ring-2 focus:ring-teal-400 transition-colors
          ${readOnly
            ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-500 italic"
            : showBorder
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-white hover:border-teal-300"
          }`}
      />
      {showError && isEmpty && (
        <p className="text-red-400 text-xs mt-1">This field is required</p>
      )}
    </div>
  );
};

export default InputField;