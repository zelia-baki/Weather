// Fertilizer QR form steps configuration
export const createFertilizerFormSteps = (farmBlocks, stores, agroInputType, agroInputCategory) => [
  {
    title: "Farm Information",
    fields: farmBlocks.map((farm, index) => ({
      type: "group",
      label: `Farm #${index + 1}`,
      fields: [
        { type: "select", name: `farm_${index}_id`,       label: "Farm ID",      required: true  },
        { type: "text",   name: `farm_${index}_phone`,    label: "Phone Number", required: false },
        { type: "select", name: `farm_${index}_district`, label: "District",     required: false },
      ],
    })),
  },
  {
    title: "AgroInput Information",
    fields: [
      { type: "text",   name: "batch_number",    label: "Batch Number",           required: true },
      { type: "select", name: "agroInputType",   label: "AgroInput Type",         required: true,
        options: [{ value: "Fertilizer", label: "Fertilizer" }, { value: "Pesticide", label: "Pesticide" }] },
      ...(agroInputType === "Fertilizer" ? [
        { type: "select", name: "agroInputCategory", label: "AgroInput Category", required: true,
          options: [{ value: "Chemical", label: "Chemical" }, { value: "Organic", label: "Organic" }] },
      ] : []),
      ...(agroInputType === "Fertilizer" && agroInputCategory ? [
        { type: "select", name: "agroInputSubCategory", label: "AgroInput Level", required: true,
          options: [1,2,3,4].map((l) => ({ value: `${agroInputCategory} Level ${l}`, label: `${agroInputCategory} Level ${l}` })) },
      ] : []),
      { type: "date",   name: "application_date", label: "Application Date",           required: true },
      { type: "number", name: "application_rate", label: "Application Rate (kg/Acre)", required: true },
    ],
  },
  {
    title: "Product Details",
    fields: [
      { type: "number", name: "agroinput_weight", label: "Total AgroInput Weight (kg)", readOnly: true,
        placeholder: "Auto-computed — fill farm quantities in step 1" },
      { type: "number", name: "price_per_kg",     label: "Price / Kg (UGX)",            required: true },
      { type: "number", name: "total_price",      label: "Total Price (UGX)",           readOnly: true,
        placeholder: "Auto-computed: weight × price" },
    ],
  },
  {
    title: "Store & Transaction Information",
    fields: [
      { type: "select", name: "payment_type", label: "Payment Type", required: true,
        options: [{ value: "cash", label: "Cash" }, { value: "credit", label: "Credit" },
                  { value: "mobilemoney", label: "Mobile Money" }, { value: "visa", label: "Visa" }] },
      { type: "select", name: "store_id",   label: "Store ID",   required: true,
        options: stores.map((s) => ({ value: s.id, label: String(s.id) })) },
      { type: "select", name: "store_name", label: "Store Name", required: true,
        options: stores.map((s) => ({ value: s.name, label: s.name })) },
      { type: "date",   name: "transaction_date", label: "Transaction Date", required: true },
    ],
  },
];

export const fertilizerStepNames = ["Farms", "AgroInput", "Product", "Store & Transaction"];