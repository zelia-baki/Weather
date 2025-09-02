  import PolygonDrawer from "../../mapbox/PolygonDrawer";
  import UploadCard from "../components/UploadCard";

  const StepLocation = ({ files, onFileChange, geojson, setGeojson, onNext }) => {
    const handlePolygonChange = (polygon) => {
      setGeojson(polygon);
      localStorage.setItem("polygon_geojson", JSON.stringify(polygon));
    };

    const canContinue = files.geojson || geojson;

    return (
      <div className="space-y-4">
        <UploadCard
          inputName="geojson"
          title="Upload your farm GeoJSON file or create one."
          onFileChange={onFileChange}
        />
        <PolygonDrawer onChange={handlePolygonChange} />
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`px-4 py-2 rounded text-white ${
            canContinue ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  export default StepLocation;
