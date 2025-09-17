// Fertilizer form steps configuration
export const createFertilizerFormSteps = (farmBlocks, stores, agroInputType, agroInputCategory) => [
  // Step 1: Farms
  {
    title: "Farm Information",
    fields: farmBlocks.map((farm, index) => ({
      type: "group",
      label: `Farm #${index + 1}`,
      fields: [
        {
          type: "select",
          name: `farm_${index}_id`,
          label: "Farm ID",
          required: true
        },
        {
          type: "text",
          name: `farm_${index}_phone`,
          label: "Phone Number",
          required: true
        },
        {
          type: "select",
          name: `farm_${index}_district`,
          label: "District",
          required: true
        }
      ]
    }))
  },
  
  // Step 2: AgroInput Information
  {
    title: "AgroInput Information",
    fields: [
      {
        type: "text",
        name: "batch_number",
        label: "Batch Number",
        required: true
      },
      {
        type: "select",
        name: "agroInputType",
        label: "AgroInput Type",
        options: [
          { value: "Fertilizer", label: "Fertilizer" },
          { value: "Pesticide", label: "Pesticide" }
        ],
        required: true
      },
      // Conditionally show category for Fertilizer
      ...(agroInputType === "Fertilizer" ? [{
        type: "select",
        name: "agroInputCategory",
        label: "AgroInput Category",
        options: [
          { value: "Chemical", label: "Chemical" },
          { value: "Organic", label: "Organic" }
        ],
        required: true
      }] : []),
      // Conditionally show subcategory for Fertilizer with category
      ...(agroInputType === "Fertilizer" && agroInputCategory ? [{
        type: "select",
        name: "agroInputSubCategory",
        label: "AgroInput Level",
        options: [1, 2, 3, 4].map((lvl) => ({
          value: `${agroInputCategory} Level ${lvl}`,
          label: `${agroInputCategory} Level ${lvl}`
        })),
        required: true
      }] : []),
      {
        type: "date",
        name: "application_date",
        label: "Application Date",
        required: true
      },
      {
        type: "number",
        name: "application_rate",
        label: "Application Rate (kg/Acre)",
        required: true
      }
    ]
  },
  
  // Step 3: Product Details
  {
    title: "Product Details",
    fields: [
      {
        type: "number",
        name: "agroinput_weight",
        label: "AgroInput Weight (Kgs)",
        required: true
      },
      {
        type: "number",
        name: "price_per_kg",
        label: "Price / Kg (Ugshs)",
        required: true
      },
      {
        type: "number",
        name: "total_price",
        label: "Total Price (Ugshs)",
        required: true
      }
    ]
  },
  
  // Step 4: Store & Transaction
  {
    title: "Store & Transaction Information",
    fields: [
      {
        type: "select",
        name: "payment_type",
        label: "Payment Type",
        options: [
          { value: "cash", label: "Cash" },
          { value: "credit", label: "Credit" },
          { value: "mobilemoney", label: "Mobile Money" },
          { value: "visa", label: "Visa" }
        ],
        required: true
      },
      {
        type: "select",
        name: "store_id",
        label: "Store ID",
        options: stores.map((s) => ({ value: s.id, label: s.id })),
        required: true
      },
      {
        type: "select",
        name: "store_name",
        label: "Store Name",
        options: stores.map((s) => ({ value: s.name, label: s.name })),
        required: true
      },
      {
        type: "date",
        name: "transaction_date",
        label: "Transaction Date",
        required: true
      }
    ]
  }
];

export const fertilizerStepNames = ["Farms", "AgroInput", "Product", "Store & Transaction"];