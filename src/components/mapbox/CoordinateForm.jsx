import { useState } from "react";

const CoordinateForm = ({ onAdd, onValidate }) => {
  const [newCoordinate, setNewCoordinate] = useState({ lng: "", lat: "" });

  const handleAdd = () => {
    if (!newCoordinate.lng || !newCoordinate.lat) {
      alert("Please enter valid coordinates.");
      return;
    }
    onAdd([parseFloat(newCoordinate.lng), parseFloat(newCoordinate.lat)]);
    setNewCoordinate({ lng: "", lat: "" });
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-lg">
      <div>
        <label>
          Longitude:
          <input
            type="number"
            value={newCoordinate.lng}
            onChange={(e) =>
              setNewCoordinate({ ...newCoordinate, lng: e.target.value })
            }
            className="border p-2 rounded-md ml-2"
          />
        </label>
      </div>
      <div className="mt-2">
        <label>
          Latitude:
          <input
            type="number"
            value={newCoordinate.lat}
            onChange={(e) =>
              setNewCoordinate({ ...newCoordinate, lat: e.target.value })
            }
            className="border p-2 rounded-md ml-2"
          />
        </label>
      </div>

      <button
        onClick={handleAdd}
        className="mt-4 bg-blue-500 text-white p-2 rounded-md"
      >
        Add Coordinate
      </button>

      <button
        onClick={onValidate}
        className="mt-4 bg-green-500 text-white p-2 rounded-md ml-2"
      >
        Validate Selection
      </button>
    </div>
  );
};

export default CoordinateForm;
