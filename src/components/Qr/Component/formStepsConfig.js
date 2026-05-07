// Produce QR form steps configuration
export const createFormSteps = (farmBlocks, countries, produceCategories, grades, stores) => [
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
    title: "Product Information",
    fields: [
      { type: "text",   name: "batch_number",      label: "Batch Number",      required: true },
      { type: "select", name: "country_of_origin", label: "Country of Origin", required: true,
        options: countries.map((c) => ({ value: c.nom_en_gb, label: c.nom_en_gb })) },
      { type: "select", name: "produceCategory",   label: "Produce Category",  required: true,
        options: produceCategories.map((c) => ({ value: c.name, label: c.name })) },
      { type: "select", name: "Crop_grade",        label: "Crop Grade",        required: true,
        options: grades.map((g) => ({ value: g.grade_value, label: `${g.grade_value}${g.description ? ` — ${g.description}` : ""}` })) },
    ],
  },
  {
    title: "Transaction Details",
    fields: [
      { type: "select", name: "season", label: "Season", required: true,
        options: ["Season1","Season2","Season3","Season4"].map((s) => ({ value: s, label: s })) },
      { type: "number", name: "price_per_kg",   label: "Price Per Kg (UGX)",       required: true },
      { type: "number", name: "produce_weight", label: "Total Produce Weight (kg)", readOnly: true,
        placeholder: "Auto-computed — fill farm quantities in step 1" },
      { type: "number", name: "total_value",    label: "Total Value (UGX)",         readOnly: true,
        placeholder: "Auto-computed: weight × price" },
    ],
  },
  {
    title: "Store & Payment Information",
    fields: [
      { type: "select", name: "payment_type", label: "Payment Type", required: true,
        options: [{ value: "cash", label: "Cash" }, { value: "bank_transfer", label: "Bank Transfer" }] },
      { type: "select", name: "store_id",   label: "Store ID",   required: true,
        options: stores.map((s) => ({ value: s.id, label: String(s.id) })) },
      { type: "select", name: "store_name", label: "Store Name", required: true,
        options: stores.map((s) => ({ value: s.name, label: s.name })) },
      { type: "date",   name: "transaction_date", label: "Transaction Date", required: true },
    ],
  },
];

export const stepNames = ["Farms", "Product", "Transaction", "Store"];