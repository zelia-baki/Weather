// Conservation form steps configuration
export const createConservationFormSteps = () => [
  // Step 1: Forest Information
  {
    title: "Forest Information",
    fields: [
      {
        type: "text",
        name: "forest_name",
        label: "Forest Name",
        required: true
      },
      {
        type: "text",
        name: "forest_id",
        label: "Forest ID",
        required: true
      },
      {
        type: "text",
        name: "gps_coordinates",
        label: "GPS Coordinates",
        required: true
      }
    ]
  },
  
  // Step 2: Tree Information
  {
    title: "Tree Information",
    fields: [
      {
        type: "text",
        name: "tree_type",
        label: "Tree Type",
        required: true
      },
      {
        type: "number",
        name: "height",
        label: "Height (m)",
        required: true
      },
      {
        type: "number",
        name: "diameter",
        label: "Diameter (cm)",
        required: true
      }
    ]
  },
  
  // Step 3: Cutting Information
  {
    title: "Cutting Information",
    fields: [
      {
        type: "date",
        name: "date_cutting",
        label: "Date of Cutting",
        required: true
      },
      {
        type: "text",
        name: "batch_number",
        label: "Batch Number",
        required: true
      }
    ]
  }
];

export const conservationStepNames = ["Forest Info", "Tree Info", "Cutting Info"];