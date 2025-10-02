import PolygonDrawer from "../../mapbox/PolygonDrawer";
import UploadCard from "../components/UploadCard";

const StepLocation = ({ 
  files, 
  onFileChange, 
  geojson, 
  setGeojson, 
  onNext,
  canContinue = false, // ✅ NEW: Validation prop
  highlightUpload = "", 
  highlightMap = "",
  highlightModeToggle = "",
  highlightSearchBar = "",
  highlightPointModeInfo = "",
  highlightDrawControls = ""
}) => {
  const handlePolygonChange = (polygon) => {
    setGeojson(polygon);
    localStorage.setItem("polygon_geojson", JSON.stringify(polygon));
  };

  return (
    <div className="space-y-4">
      {/* Section Upload avec highlight conditionnel */}
      <div className={highlightUpload}>
        <UploadCard
          inputName="geojson"
          title="Upload your farm GeoJSON file or create one."
          onFileChange={onFileChange}
        />
      </div>

      {/* Section Map avec highlight conditionnel + props spécifiques */}
      <div className={highlightMap}>
        <PolygonDrawer 
          onChange={handlePolygonChange}
          highlightModeToggle={highlightModeToggle}
          highlightSearchBar={highlightSearchBar}
          highlightPointModeInfo={highlightPointModeInfo}
          highlightDrawControls={highlightDrawControls}
        />
      </div>

      {/* ✅ Button with validation */}
      <button
        onClick={onNext}
        disabled={!canContinue}
        className={`px-4 py-2 rounded text-white transition-all ${
          canContinue 
            ? "bg-green-600 hover:bg-green-700 cursor-pointer" 
            : "bg-gray-400 cursor-not-allowed opacity-60"
        }`}
        title={!canContinue ? "Please upload a file or create a polygon first" : ""}
      >
        Next →
      </button>
    </div>
  );
};

export default StepLocation;