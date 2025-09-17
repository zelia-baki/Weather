import React from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import FarmBlock from "./FarmBlock";

const FormStep = ({ 
  step, 
  formData, 
  onChange, 
  onCategoryChange,
  onStoreChange,
  farmBlocks, 
  onAddFarm, 
  onRemoveFarm,
  onFarmChange, // Cette prop est cruciale
  farms,
  districts 
}) => {

  const renderField = (field) => {
    // Gestion spéciale pour les champs avec onChange personnalisé
    let customOnChange = onChange;
    
    if (field.name === "produceCategory") {
      customOnChange = onCategoryChange;
    } else if (field.name === "agroInputType") {
      customOnChange = onChange;
    } else if (field.name === "agroInputCategory") {
      customOnChange = onChange;
    } else if (field.name === "store_id") {
      customOnChange = (e) => onStoreChange(e, "id");
    } else if (field.name === "store_name") {
      customOnChange = (e) => onStoreChange(e, "name");
    }

    if (field.type === "select") {
      return (
        <SelectField
          key={field.name}
          label={field.label}
          name={field.name}
          value={formData[field.name] || ""}
          onChange={customOnChange}
          options={field.options || []}
          required={field.required}
        />
      );
    } else {
      return (
        <InputField
          key={field.name}
          label={field.label}
          type={field.type || "text"}
          name={field.name}
          value={formData[field.name] || ""}
          onChange={onChange}
          required={field.required}
        />
      );
    }
  };

  return (
    <div className="min-h-[400px]">
      {step.fields.map((field, index) => (
        <div key={index}>
          {field.type === "group" ? (
            // Si c'est le groupe Farm → afficher les FarmBlocks
            field.label.includes("Farm") ? (
              index === 0 && (
                farmBlocks.map((farm, farmIndex) => (
                  <FarmBlock
                    key={farmIndex}
                    index={farmIndex}
                    formData={formData}
                    onChange={onChange}
                    onFarmChange={onFarmChange} // ← CETTE LIGNE EST CRUCIALE
                    onAddFarm={onAddFarm}
                    onRemoveFarm={onRemoveFarm}
                    farms={farms}
                    districts={districts}
                    isLastBlock={farmIndex === farmBlocks.length - 1}
                    canRemove={farmBlocks.length > 1}
                  />
                ))
              )
            ) : (
              // Autres groupes
              <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                <h3 className="text-lg font-medium text-teal-700 mb-4">
                  {field.label}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {field.fields.map(renderField)}
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {renderField(field)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormStep;