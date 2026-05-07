// Export form steps configuration
export const createExportFormSteps = (
  farmBlocks, farmerGroups, districts, categorys,
  filteredCrops, cropGrades, stores, countries, coffeeType
) => [
  // Step 1 : Farm & Group — seul farm_id est requis
  {
    title: "Farm & Group Information",
    fields: [
      ...farmBlocks.map((farm, index) => ({
        type: "group",
        label: `Farm #${index + 1}`,
        fields: [
          { type: "select", name: `farm_${index}_id`,       label: "Farm ID",             required: true  },
          { type: "text",   name: `farm_${index}_phone`,    label: "Farmer Phone Number", required: false },
          { type: "select", name: `farm_${index}_district`, label: "District",            required: false },
        ],
      })),
      {
        type: "select", name: "farmergroup_id", label: "Farmer Group", required: true,
        options: farmerGroups.map((g) => ({ value: g.id, label: g.name })),
      },
      { type: "text", name: "geolocation", label: "Geolocation", required: true },
    ],
  },

  // Step 2 : Crop
  {
    title: "Crop Information",
    fields: [
      {
        type: "select", name: "crop_category", label: "Crop Category", required: true,
        options: categorys.map((c) => ({ value: c.id, label: c.name })),
      },
      {
        type: "select", name: "crop", label: "Crop", required: true,
        options: filteredCrops.map((c) => ({ value: c.id, label: c.name })),
      },
      ...(cropGrades.length > 0 ? [{
        type: "select", name: "crop_grade", label: "Crop Grade", required: true,
        options: cropGrades.map((g) => ({ value: g.grade_value, label: g.grade_value })),
      }] : []),
      {
        type: "select", name: "coffeeType", label: "Coffee Type", required: true,
        options: [
          { value: "Robusta", label: "Robusta" },
          { value: "Arabica", label: "Arabica" },
          { value: "Other",   label: "Other"   },
        ],
      },
      ...(coffeeType ? [{
        type: "select", name: "hscode", label: "HS Code", required: true,
        options: coffeeType === "Robusta"
          ? [{ value: "0901.11", label: "0901.11" }, { value: "0901.21", label: "0901.21" }]
          : coffeeType === "Arabica"
          ? [{ value: "0901.12", label: "0901.12" }, { value: "0901.22", label: "0901.22" }]
          : [{ value: "0901.90", label: "0901.90" }],
      }] : []),
    ],
  },

  // Step 3 : Product
  {
    title: "Product Details",
    fields: [
      { type: "number", name: "batch_number",   label: "Batch Number",        required: true },
      { type: "text",   name: "produce_weight", label: "Produce Weight (kg)", readOnly: true, placeholder: "Auto-computed from farm quantities" },
      {
        type: "select", name: "season", label: "Season", required: true,
        options: [
          { value: "Season 1", label: "Season 1" },
          { value: "Season 2", label: "Season 2" },
          { value: "Season 3", label: "Season 3" },
          { value: "Season 4", label: "Season 4" },
        ],
      },
    ],
  },

  // Step 4 : Store
  {
    title: "Store Information",
    fields: [
      {
        type: "select", name: "store_id",   label: "Store ID",   required: true,
        options: stores.map((s) => ({ value: s.id,   label: String(s.id) })),
      },
      {
        type: "select", name: "store_name", label: "Store Name", required: true,
        options: stores.map((s) => ({ value: s.name, label: s.name })),
      },
    ],
  },

  // Step 5 : Export
  {
    title: "Export Information",
    fields: [
      {
        type: "select", name: "country_of_origin",   label: "Country of Origin",    required: true,
        options: countries.map((c) => ({ value: c.nom_en_gb, label: c.nom_en_gb })),
      },
      {
        type: "select", name: "destination_country", label: "Destination Country",  required: true,
        options: countries.map((c) => ({ value: c.nom_en_gb, label: c.nom_en_gb })),
      },
      { type: "text",           name: "channel_partner",   label: "Channel Partner",              required: true },
      { type: "text",           name: "end_customer_name", label: "End Customer Name",            required: true },
      { type: "datetime-local", name: "timestamp",         label: "Timestamp (Transaction Date)", required: true },
    ],
  },
];

export const exportStepNames = ["Farm & Group", "Crop Info", "Product", "Store", "Export Info"];