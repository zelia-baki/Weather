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
  onFarmChange,
  farms,
  districts,
  // Contrôle du champ par-ferme
  showFarmQty = false,
  farmQtyLabel = "Weight (kg)",
  farmQtyKey   = "qty",
}) => {
  const renderField = (field) => {
    let customOnChange = onChange;

    if (field.name === "produceCategory")  customOnChange = onCategoryChange;
    else if (field.name === "store_id")    customOnChange = (e) => onStoreChange?.(e, "id");
    else if (field.name === "store_name")  customOnChange = (e) => onStoreChange?.(e, "name");

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
          disabled={field.disabled}
          placeholder={field.placeholder}
        />
      );
    }

    return (
      <InputField
        key={field.name}
        label={field.label}
        type={field.type || "text"}
        name={field.name}
        value={formData[field.name] || ""}
        onChange={field.readOnly ? undefined : onChange}
        required={field.required}
        readOnly={field.readOnly}
        placeholder={field.placeholder}
      />
    );
  };

  return (
    <div className="min-h-[400px]">
      {step.fields.map((field, index) => (
        <div key={index}>
          {field.type === "group" ? (
            field.label?.includes("Farm") ? (
              index === 0 && (
                farmBlocks.map((farm, farmIndex) => (
                  <FarmBlock
                    key={farmIndex}
                    index={farmIndex}
                    formData={formData}
                    onChange={onChange}
                    onFarmChange={onFarmChange}
                    onAddFarm={onAddFarm}
                    onRemoveFarm={onRemoveFarm}
                    farms={farms}
                    districts={districts}
                    isLastBlock={farmIndex === farmBlocks.length - 1}
                    canRemove={farmBlocks.length > 1}
                    showQty={showFarmQty}
                    qtyLabel={farmQtyLabel}
                    qtyKey={farmQtyKey}
                  />
                ))
              )
            ) : (
              <div className="border border-gray-200 rounded-xl p-4 mb-5 bg-gray-50">
                <h3 className="text-sm font-semibold text-teal-700 mb-3">{field.label}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {field.fields.map(renderField)}
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              {renderField(field)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormStep;