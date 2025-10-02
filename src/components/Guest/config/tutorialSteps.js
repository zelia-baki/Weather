export const tutorialSteps = [
  {
    step: 1,
    title: "Welcome! Let's Create Your EUDR Report",
    description: "This guide will walk you through creating your EUDR compliance report step by step. You'll define your farm location, choose your report type, and receive your complete analysis.",
    highlight: "welcome",
    targetStep: 1,
    action: "Start",
    tips: [
      "The process takes about 5 minutes",
      "You can go back at any time",
      "Your data is secure"
    ]
  },
  {
    step: 2,
    title: "Step 1: Locate Your Farm",
    description: "You have two options to define your area: upload an existing GeoJSON file OR create your polygon directly on the map.",
    highlight: "upload",
    targetStep: 1,
    action: "Got it",
    tips: [
      "Option A: Upload an existing .geojson file",
      "Option B: Create your polygon with the interactive map below",
      "Choose the method that's most convenient for you"
    ]
  },
  {
    step: 3,
    title: "Choose Your Creation Mode",
    description: "Before creating your polygon, you must choose your working mode. Two options are available:",
    highlight: "mode-toggle",
    targetStep: 1,
    action: "Continue",
    tips: [
      "Draw Mode: Draw directly on the map by clicking",
      "Point Mode: Search for coordinates and add them point by point",
      "The button is in the right panel"
    ],
    detailedSteps: [
      {
        title: "Draw Mode (default)",
        description: "Click successively on the map to create the vertices of your polygon. Double-click to finish."
      },
      {
        title: "Point Mode (recommended for precise coordinates)",
        description: "Search for coordinates, then click 'Add Point' to add them to your polygon."
      }
    ]
  },
  {
    step: 4,
    title: "Search Your Location",
    description: "Use the search bar at the top of the map to find your location or enter precise coordinates.",
    highlight: "search-bar",
    targetStep: 1,
    action: "Next",
    tips: [
      "Place search: type 'Kampala' or your city name",
      "Coordinate search: 'Lat: 0.3476, Lng: 32.5825'",
      "Simplified format: '0.3476, 32.5825'",
      "A red marker will appear on your search"
    ]
  },
  {
    step: 5,
    title: "Point Mode: Adding Points",
    description: "In Point Mode, after searching for a location, an 'Add Point' button appears on the marker. Click it to add this point to your polygon.",
    highlight: "point-mode-info",
    targetStep: 1,
    action: "Understood",
    gifUrl: "/gifs/point-mode-demo.gif",
    tips: [
      "Search for your first field corner",
      "Click the red marker to see the 'Add Point' button",
      "Repeat for each corner (minimum 3 points)",
      "The polygon forms automatically after 3 points"
    ]
  },
  {
    step: 6,
    title: "Draw Mode: Drawing on the Map",
    description: "In Draw Mode, use the pencil tool to draw your polygon directly on the map.",
    highlight: "draw-controls",
    targetStep: 1,
    action: "Next",
    gifUrl: "/gifs/draw-mode-demo.gif",
    tips: [
      "Activate the pencil (polygon) tool at the top left of the map",
      "Click on the map to create points",
      "Double-click to close the polygon",
      "Use the trash icon to delete and start over"
    ]
  },
  {
    step: 7,
    title: "Step 2: Choose Your Report Type",
    description: "Select the report(s) you need:",
    highlight: "report-type",
    targetStep: 2,
    action: "Next",
    tips: [
      "EUDR Report: European regulatory compliance analysis",
      "Carbon Report: Carbon stock estimation",
      "You can select both reports"
    ]
  },
  {
    step: 8,
    title: "Step 3: Your Information",
    description: "Enter your contact details to receive your report:",
    highlight: "user-info",
    targetStep: 3,
    action: "Next",
    tips: [
      "Phone: Required for mobile payment (format: 256XXXXXXXXX)",
      "Email: To receive your report by email",
      "Agent ID: Your unique identifier"
    ]
  },
  {
    step: 9,
    title: "Step 4: Payment",
    description: "Finalize your order by proceeding with secure payment:",
    highlight: "payment",
    targetStep: 4,
    action: "Next",
    tips: [
      "Secure payment via mobile money",
      "Transparent pricing displayed",
      "Instant confirmation"
    ]
  },
  {
    step: 10,
    title: "Step 5: Your Report",
    description: "View and download your analysis report:",
    highlight: "reports",
    targetStep: 5,
    action: "Finish",
    tips: [
      "Detailed report with mapping",
      "Downloadable data in PDF",
      "Stored in your client area"
    ]
  }
];