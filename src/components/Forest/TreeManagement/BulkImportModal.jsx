// components/TreeManagement/BulkImportModal.jsx
import React from 'react';
import { X, Upload, Download, AlertCircle } from 'lucide-react';

const BulkImportModal = ({ onClose, onImport, onDownloadTemplate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Bulk Import Trees
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 mb-1">Smart Duplicate Detection</p>
              <p className="text-amber-700 mb-2">
                Trees with the same <strong>name + forest + GPS location (within 10m)</strong> will be automatically skipped.
              </p>
              <div className="mt-2 bg-white rounded p-2 text-xs text-amber-900">
                <p className="font-mono">✓ "Oak 1" at -18.8792, 47.5079 - New tree</p>
                <p className="font-mono">⊗ "Oak 1" at -18.8792, 47.5079 - Duplicate, skipped</p>
                <p className="font-mono">✓ "Oak 1" at -18.9000, 47.5200 - Different location, created</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              CSV Format Instructions
            </h3>
            <p className="text-sm text-gray-700 mb-3">Your CSV file must include these columns:</p>
            <ul className="text-sm text-gray-700 space-y-2 ml-4">
              <li>• <strong>name</strong> - Tree name (required)</li>
              <li>• <strong>type</strong> - Tree type (optional)</li>
              <li>• <strong>forest_id</strong> - Forest ID number (required)</li>
              <li>• <strong>latitude</strong> - Latitude coordinate (required)</li>
              <li>• <strong>longitude</strong> - Longitude coordinate (required)</li>
              <li>• <strong>height</strong> - Height in meters (required)</li>
              <li>• <strong>diameter</strong> - Diameter in cm (required)</li>
              <li>• <strong>date_planted</strong> - Format: YYYY-MM-DD (required)</li>
              <li>• <strong>date_cut</strong> - Format: YYYY-MM-DD (optional)</li>
            </ul>
          </div>

          <button
            onClick={onDownloadTemplate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download CSV Template
          </button>

          <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50 hover:bg-purple-100 transition">
            <Upload className="w-16 h-16 mx-auto text-purple-400 mb-4" />
            <p className="text-gray-700 mb-2 font-semibold">Choose your CSV file to upload</p>
            <p className="text-sm text-gray-500 mb-4">Maximum file size: 5MB</p>
            <input
              type="file"
              accept=".csv"
              onChange={onImport}
              className="hidden"
              id="csv-upload-tree"
            />
            <label
              htmlFor="csv-upload-tree"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg cursor-pointer transition shadow-md"
            >
              Select CSV File
            </label>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Example CSV Content:</h4>
            <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
              {`name,type,forest_id,latitude,longitude,height,diameter,date_planted,date_cut
Oak Tree 1,Oak,1,-18.8792,47.5079,15.5,45.2,2023-01-15,
Pine Tree 1,Pine,1,-18.8800,47.5100,12.3,38.7,2023-02-20,
Eucalyptus 1,Eucalyptus,2,-18.8750,47.5050,18.2,52.1,2022-11-30,2024-01-10`}
            </pre>
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Note: GPS coordinates must be at least 10m apart to avoid duplicates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
