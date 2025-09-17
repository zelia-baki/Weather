import React from "react";
import { Check } from "lucide-react";

const StepIndicator = ({ currentStep, totalSteps, stepNames }) => (
  <div className="flex justify-center items-center mb-8 overflow-x-auto">
    {stepNames.map((stepName, index) => (
      <div key={index} className="flex items-center flex-shrink-0">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
          index < currentStep 
            ? 'bg-teal-600 border-teal-600 text-white' 
            : index === currentStep 
            ? 'bg-teal-100 border-teal-600 text-teal-600' 
            : 'bg-gray-100 border-gray-300 text-gray-400'
        }`}>
          {index < currentStep ? <Check size={16} /> : index + 1}
        </div>
        <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
          index <= currentStep ? 'text-teal-700' : 'text-gray-400'
        }`}>
          {stepName}
        </span>
        {index < stepNames.length - 1 && (
          <div className={`w-12 h-0.5 mx-4 ${
            index < currentStep ? 'bg-teal-600' : 'bg-gray-300'
          }`} />
        )}
      </div>
    ))}
  </div>
);

export default StepIndicator;