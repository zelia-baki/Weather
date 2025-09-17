// Form steps configuration
export const createFormSteps = (farmBlocks, countries, produceCategories, grades, stores) => [
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
  
  // Step 2: Product
  {
    title: "Product Information",
    fields: [
      {
        type: "text",
        name: "batch_number",
        label: "Batch Number",
        required: true
      },
      {
        type: "select",
        name: "country_of_origin",
        label: "Country of Origin",
        options: countries.map((c) => ({ value: c.nom_en_gb, label: c.nom_en_gb })),
        required: true
      },
      {
        type: "select",
        name: "produceCategory",
        label: "Produce Category",
        options: produceCategories.map((c) => ({ value: c.name, label: c.name })),
        required: true
      },
      {
        type: "select",
        name: "Crop_grade",
        label: "Crop Grade",
        options: grades.map((g) => ({ 
          value: g.grade_value, 
          label: `${g.grade_value} - ${g.description || ''}` 
        })),
        required: true
      }
    ]
  },
  
  // Step 3: Transaction
  {
    title: "Transaction Details",
    fields: [
      {
        type: "select",
        name: "season",
        label: "Season",
        options: ["Season1", "Season2", "Season3", "Season4"].map((s) => ({ 
          value: s, 
          label: s 
        })),
        required: true
      },
      {
        type: "number",
        name: "produce_weight",
        label: "Produce Weight (kg)",
        required: true
      },
      {
        type: "number",
        name: "price_per_kg",
        label: "Price Per Kg (UGX)",
        required: true
      },
      {
        type: "number",
        name: "total_value",
        label: "Total Value (UGX)",
        required: true
      }
    ]
  },
  
  // Step 4: Store
  {
    title: "Store & Payment Information",
    fields: [
      {
        type: "select",
        name: "payment_type",
        label: "Payment Type",
        options: [
          { value: "cash", label: "Cash" },
          { value: "bank_transfer", label: "Bank Transfer" }
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

export const stepNames = ["Farms", "Product", "Transaction", "Store"];