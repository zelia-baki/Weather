import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FormNavigation = ({ 
  currentStep, 
  totalSteps, 
  onPrevStep, 
  onNextStep, 
  onSubmit, 
  isStepValid 
}) => {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t">
      <button
        type="button"
        onClick={onPrevStep}
        disabled={currentStep === 0}
        className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" />
        Previous
      </button>

      <span className="text-sm text-gray-500">
        Step {currentStep + 1} of {totalSteps}
      </span>

      {currentStep < totalSteps - 1 ? (
        <button
          type="button"
          onClick={onNextStep}
          disabled={!isStepValid}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={20} className="ml-1" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isStepValid}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generate QR & Receipt
        </button>
      )}
    </div>
  );
};

export default FormNavigation;