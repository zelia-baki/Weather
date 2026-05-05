import React, { useRef } from "react";
import InputField  from "./InputField";
import SelectField from "./SelectField";

/**
 * FarmBlock
 *
 * Logique :
 *  - phone    → TOUJOURS éditable (auto-rempli = valeur pré-renseignée modifiable)
 *  - district → disabled seulement si une valeur a été auto-remplie depuis la ferme
 *               Si la ferme n'a pas de district → select reste actif pour saisie manuelle
 */
const FarmBlock = ({
  index,
  formData,
  onChange,
  onFarmChange,
  onAddFarm,
  onRemoveFarm,
  farms,
  districts,
  isLastBlock,
  canRemove,
  showQty  = false,
  qtyLabel = "Weight (kg)",
  qtyKey   = "qty",
}) => {
  // Ref pour tracker si le phone a été auto-rempli (pour afficher le badge)
  const autoFilledPhone    = useRef(false);
  const autoFilledDistrict = useRef(false);

  const farmSelected = !!formData[`farm_${index}_id`];
  const hasDistrict  = farmSelected && !!formData[`farm_${index}_district`];

  const handleFarmSelect = (e) => {
    // Réinitialise les refs au changement de ferme
    autoFilledPhone.current    = false;
    autoFilledDistrict.current = false;

    if (onFarmChange) {
      // Marque les champs comme auto-remplis après la sélection
      const promise = onFarmChange(e, index);
      if (promise && promise.then) {
        promise.then(() => {
          autoFilledPhone.current    = true;
          autoFilledDistrict.current = true;
        });
      } else {
        autoFilledPhone.current    = true;
        autoFilledDistrict.current = true;
      }
    } else {
      onChange(e);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-teal-700">Farm #{index + 1}</h3>
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
        {/* Farm ID */}
        <SelectField
          label="Farm ID"
          name={`farm_${index}_id`}
          value={formData[`farm_${index}_id`] || ""}
          onChange={handleFarmSelect}
          options={farms.map((f) => ({
            value: f.id,
            label: `${f.name} — ${f.subcounty || f.id}`,
          }))}
          required
        />

        {/* Phone — TOUJOURS éditable, jamais readOnly */}
        <div className="relative">
          <InputField
            label="Phone Number"
            name={`farm_${index}_phone`}
            value={formData[`farm_${index}_phone`] || ""}
            onChange={onChange}
            placeholder={
              farmSelected
                ? "Phone number (editable)"
                : "Auto-filled when farm is selected"
            }
          />
          {farmSelected && formData[`farm_${index}_phone`] && (
            <span className="absolute right-3 top-9 text-xs text-green-600 bg-green-50
                             border border-green-200 px-2 py-0.5 rounded-full pointer-events-none">
              ✓ auto-filled
            </span>
          )}
          {farmSelected && !formData[`farm_${index}_phone`] && (
            <span className="absolute right-3 top-9 text-xs text-amber-600 bg-amber-50
                             border border-amber-200 px-2 py-0.5 rounded-full pointer-events-none">
              ⚠ no phone on record
            </span>
          )}
        </div>

        {/* District — disabled si auto-rempli, actif si manquant */}
        <SelectField
          label="District"
          name={`farm_${index}_district`}
          value={formData[`farm_${index}_district`] || ""}
          onChange={onChange}
          options={districts.map((d) => ({ value: d.id, label: d.name }))}
          disabled={hasDistrict}
          placeholder={
            farmSelected && !hasDistrict
              ? "No district on record — select manually"
              : "Auto-filled when farm is selected"
          }
        />

        {/* Quantité par ferme */}
        {showQty && (
          <InputField
            label={qtyLabel}
            name={`farm_${index}_${qtyKey}`}
            type="number"
            value={formData[`farm_${index}_${qtyKey}`] || ""}
            onChange={onChange}
            required
            placeholder="0.00"
          />
        )}
      </div>

      {/* Status badges */}
      {farmSelected && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2 py-1 bg-green-100
                           text-green-800 rounded-full text-xs">
            ✓ Farm selected
          </span>
          {!hasDistrict && (
            <span className="inline-flex items-center px-2 py-1 bg-amber-50
                             text-amber-700 rounded-full text-xs">
              ⚠ No district — please select manually
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FarmBlock;