import React from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";

const FarmBlock = ({ 
  index, 
  formData, 
  onChange, 
  onFarmChange, // Nouvelle prop pour la gestion spéciale des fermes
  onAddFarm, 
  onRemoveFarm, 
  farms, 
  districts, 
  isLastBlock,
  canRemove 
}) => {

  // Handler spécial pour le changement de ferme avec auto-complétion
  const handleFarmSelect = (e) => {
    console.log("FarmBlock: Farm selection triggered", e.target.value, "Index:", index);
    console.log("FarmBlock: onFarmChange function exists:", typeof onFarmChange);
    
    if (onFarmChange) {
      console.log("FarmBlock: Calling onFarmChange");
      onFarmChange(e, index); // Appelle la fonction d'auto-complétion
    } else {
      console.log("FarmBlock: onFarmChange not provided, using fallback");
      onChange(e); // Fallback sur onChange normal
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-teal-700">
          Farm #{index + 1}
        </h3>
        <div className="flex gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemoveFarm(index)}
              className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
            >
              Remove
            </button>
          )}
          {isLastBlock && (
            <button
              type="button"
              onClick={onAddFarm}
              className="text-teal-600 hover:text-teal-800 text-sm font-medium transition-colors"
            >
              + Add Farm
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <SelectField
          label="Farm ID"
          name={`farm_${index}_id`}
          value={formData[`farm_${index}_id`] || ""}
          onChange={handleFarmSelect} // Utilise le handler spécial
          options={farms.map((f) => ({ 
            value: f.id, 
            label: `${f.name} - ${f.subcounty}` 
          }))}
          required
        />
        
        <InputField
          label="Phone Number"
          name={`farm_${index}_phone`}
          value={formData[`farm_${index}_phone`] || ""}
          onChange={onChange}
          readOnly={!!formData[`farm_${index}_id`]} // Read-only si une ferme est sélectionnée
          placeholder={formData[`farm_${index}_id`] ? "Auto-filled from farm data" : "Will auto-fill when farm is selected"}
          required
        />
        
        <SelectField
          label="District"
          name={`farm_${index}_district`}
          value={formData[`farm_${index}_district`] || ""}
          onChange={onChange}
          options={districts.map((d) => ({ value: d.id, label: d.name }))}
          disabled={!!formData[`farm_${index}_id`]} // Disabled si une ferme est sélectionnée
          placeholder={formData[`farm_${index}_id`] ? "Auto-filled from farm data" : "Will auto-fill when farm is selected"}
          required
        />
      </div>
      
      {formData[`farm_${index}_id`] && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
            ✓ Farm data auto-filled
          </span>
        </div>
      )}
    </div>
  );
};

export default FarmBlock;