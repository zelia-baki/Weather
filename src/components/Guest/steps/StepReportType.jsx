import React from "react";
import { FileText, Leaf } from "lucide-react"; // ✅ Icônes jolies et légères

const StepReportType = ({ onSelect }) => {
  const options = [
    {
      id: "reporteudrguest",
      title: "Farm (EUDR) Report",
      description:
        "Get a compliance report for your farm according to EUDR requirements.",
      color: "blue",
      icon: <FileText className="w-8 h-8 text-blue-600" />,
    },
    {
      id: "reportcarbonguest",
      title: "Carbon Report",
      description:
        "Analyze your farm’s carbon footprint and environmental impact.",
      color: "green",
      icon: <Leaf className="w-8 h-8 text-green-600" />,
    },
  ];

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold text-gray-800">
        Choose your report type
      </h2>
      <p className="text-gray-500 text-sm">
        Select the type of report you would like to generate.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg hover:scale-[1.02] transform transition bg-white text-left`}
          >
            <div className="flex items-center gap-3 mb-3 justify-center">
              {opt.icon}
              <h3
                className={`font-semibold text-${opt.color}-700 text-lg`}
              >
                {opt.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepReportType;
