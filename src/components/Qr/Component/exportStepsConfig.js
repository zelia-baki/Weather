// Export form steps configuration
export const createExportFormSteps = (
  farmBlocks,
  farmerGroups, 
  districts, 
  categorys, 
  filteredCrops, 
  cropGrades, 
  stores, 
  countries,
  coffeeType
) => [
  // Step 1: Farm & Group Information (avec support multi-fermes)
  {
    title: "Farm & Group Information",
    fields: [
      // Farms dynamiques
      ...farmBlocks.map((farm, index) => ({
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
            label: "Farmer Phone Number",
            required: true
          },
          {
            type: "select",
            name: `farm_${index}_district`,
            label: "District",
            required: true
          }
        ]
      })),
      // Farmer Group
      {
        type: "select",
        name: "farmergroup_id",
        label: "Farmer Group",
        options: farmerGroups.map(group => ({
          value: group.id,
          label: group.name
        })),
        required: true
      },
      {
        type: "text",
        name: "geolocation",
        label: "Geolocation",
        required: true
      }
    ]
  },
  
  // Step 2: Crop Information
  {
    title: "Crop Information",
    fields: [
      {
        type: "select",
        name: "crop_category",
        label: "Crop Category",
        options: categorys.map(category => ({
          value: category.id,
          label: category.name
        })),
        required: true
      },
      {
        type: "select",
        name: "crop",
        label: "Crop",
        options: filteredCrops.map(crop => ({
          value: crop.id,
          label: crop.name
        })),
        required: true
      },
      ...(cropGrades.length > 0 ? [{
        type: "select",
        name: "crop_grade",
        label: "Crop Grade",
        options: cropGrades.map(grade => ({
          value: grade.grade_value,
          label: grade.grade_value
        })),
        required: true
      }] : []),
      {
        type: "select",
        name: "coffeeType",
        label: "Coffee Type",
        options: [
          { value: "Robusta", label: "Robusta" },
          { value: "Arabica", label: "Arabica" },
          { value: "Other", label: "Other" }
        ],
        required: true
      },
      ...(coffeeType ? [{
        type: "select",
        name: "hscode",
        label: "HS Code",
        options: coffeeType === "Robusta" 
          ? [{ value: "0901.11", label: "0901.11" }, { value: "0901.21", label: "0901.21" }]
          : coffeeType === "Arabica"
          ? [{ value: "0901.12", label: "0901.12" }, { value: "0901.22", label: "0901.22" }]
          : [{ value: "0901.90", label: "0901.90" }],
        required: true
      }] : [])
    ]
  },
  
  // Step 3: Product Details
  {
    title: "Product Details",
    fields: [
      {
        type: "number",
        name: "batch_number",
        label: "Batch Number",
        required: true
      },
      {
        type: "text",
        name: "produce_weight",
        label: "Produce Weight (Kgs)",
        required: true
      },
      {
        type: "select",
        name: "season",
        label: "Season",
        options: [
          { value: "Season 1", label: "Season 1" },
          { value: "Season 2", label: "Season 2" },
          { value: "Season 3", label: "Season 3" },
          { value: "Season 4", label: "Season 4" }
        ],
        required: true
      }
    ]
  },
  
  // Step 4: Store Information
  {
    title: "Store Information",
    fields: [
      {
        type: "select",
        name: "store_id",
        label: "Store ID",
        options: stores.map(store => ({
          value: store.id,
          label: store.id
        })),
        required: true
      },
      {
        type: "select",
        name: "store_name",
        label: "Store Name",
        options: stores.map(store => ({
          value: store.name,
          label: store.name
        })),
        required: true
      }
    ]
  },
  
  // Step 5: Export Information
  {
    title: "Export Information",
    fields: [
      {
        type: "select",
        name: "country_of_origin",
        label: "Country of Origin",
        options: countries.map(country => ({
          value: country.nom_en_gb,
          label: country.nom_en_gb
        })),
        required: true
      },
      {
        type: "select",
        name: "destination_country",
        label: "Destination Country",
        options: countries.map(country => ({
          value: country.nom_en_gb,
          label: country.nom_en_gb
        })),
        required: true
      },
      {
        type: "text",
        name: "channel_partner",
        label: "Channel Partner",
        required: true
      },
      {
        type: "text",
        name: "end_customer_name",
        label: "End Customer Name",
        required: true
      },
      {
        type: "datetime-local",
        name: "timestamp",
        label: "Timestamp (Transaction Date)",
        required: true
      }
    ]
  }
];

export const exportStepNames = ["Farm & Group", "Crop Info", "Product", "Store", "Export Info"];