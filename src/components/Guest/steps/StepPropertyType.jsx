import React from "react";
import { Trees, Wheat } from "lucide-react";

// ✅ NOUVEAU — demandé juste après le choix "Carbon Report" : la méthode de
// calcul du complément carbone dépend du type de terrain (voir useReports.jsx
// generateCarbonPdf / guest/carbon-extra) :
//   - Forest -> AGB/BGB estimés depuis le NDVI (Sentinel-2)
//   - Farm   -> Carbone organique du sol (SoilGrids ISRIC) + culture prédite
const StepPropertyType = ({ onSelect }) => {
  const options = [
    {
      id: "forest",
      title: "Forest",
      description: "Trees, woodland or forested land — we'll estimate biomass (AGB/BGB) from satellite vegetation index (NDVI).",
      color: "emerald",
      icon: <Trees className="w-8 h-8 text-emerald-600" />,
    },
    {
      id: "farm",
      title: "Farm",
      description: "Cultivated farmland — we'll look up your soil's organic carbon content (SoilGrids) and predict your crop type.",
      color: "amber",
      icon: <Wheat className="w-8 h-8 text-amber-600" />,
    },
  ];

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-bold text-gray-800">Is this a forest or a farm?</h2>
      <p className="text-gray-500 text-sm">
        This helps us add the right extra carbon analysis to your report.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-lg hover:scale-[1.02] transform transition bg-white text-left"
          >
            <div className="flex items-center gap-3 mb-3 justify-center">
              {opt.icon}
              <h3 className={`font-semibold text-${opt.color}-700 text-lg`}>{opt.title}</h3>
            </div>
            <p className="text-sm text-gray-600">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepPropertyType;
