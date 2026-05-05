import React from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const FormNavigation = ({
  currentStep,
  totalSteps,
  onPrevStep,
  onNextStep,
  onSubmit,
  isStepValid,
  missingCount = 0,  // ← optionnel : nb de champs manquants
}) => {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      {/* Feedback champs manquants */}
      {!isStepValid && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200
                        rounded-lg px-3 py-2 mb-4 text-xs font-medium">
          <AlertCircle size={14} className="shrink-0" />
          <span>
            Please fill in all required fields
            {missingCount > 0 ? ` (${missingCount} remaining)` : ""}
            &nbsp;to continue.
          </span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onPrevStep}
          disabled={currentStep === 0}
          className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg
                     hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} className="mr-1" />
          Previous
        </button>

        <span className="text-xs text-gray-400 font-medium">
          Step {currentStep + 1} of {totalSteps}
        </span>

        {currentStep < totalSteps - 1 ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={!isStepValid}
            className="flex items-center px-5 py-2 bg-teal-600 text-white rounded-lg
                       hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors font-medium"
          >
            Next
            <ChevronRight size={18} className="ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isStepValid}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg
                       hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors font-semibold"
          >
            Generate QR &amp; Receipt
          </button>
        )}
      </div>
    </div>
  );
};

export default FormNavigation;