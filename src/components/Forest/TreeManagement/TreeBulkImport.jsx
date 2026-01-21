import React from 'react';
import { Upload, X, Download, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import axiosInstance from '../../../axiosInstance';

const TreeBulkImport = ({ isOpen, onClose, onImportSuccess }) => {
  if (!isOpen) return null;

  const downloadCSVTemplate = () => {
    const template = `name,type,forest_id,latitude,longitude,height,diameter,date_planted,date_cut
Example Tree 1,Oak,1,-18.8792,47.5079,15.5,45.2,2023-01-15,
Example Tree 2,Pine,1,-18.8800,47.5100,12.3,38.7,2023-02-20,2024-01-10
Example Tree 3,Eucalyptus,1,-18.8750,47.5050,18.2,52.1,2022-11-30,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const requiredHeaders = ['name', 'forest_id', 'latitude', 'longitude', 'height', 'diameter', 'date_planted'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          Swal.fire('Error', `Missing required columns: ${missingHeaders.join(', ')}`, 'error');
          return;
        }

        const trees = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const tree = {};
          headers.forEach((header, index) => {
            tree[header] = values[index];
          });
          trees.push(tree);
        }

        const result = await Swal.fire({
          title: 'Import Trees',
          text: `Found ${trees.length} trees. Continue?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, import!',
          confirmButtonColor: '#10b981'
        });

        if (result.isConfirmed) {
          let successCount = 0;
          let errorCount = 0;
          let skippedCount = 0;
          const details = [];

          Swal.fire({
            title: 'Importing Trees...',
            html: `Progress: <b>0/${trees.length}</b>`,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          for (let i = 0; i < trees.length; i++) {
            try {
              const response = await axiosInstance.post('/api/tree/create', trees[i]);
              successCount++;
              details.push({
                row: i + 2,
                name: trees[i].name,
                coordinates: `${trees[i].latitude}, ${trees[i].longitude}`,
                status: 'created',
                tree_id: response.data.tree_id
              });
            } catch (error) {
              const errorMsg = error.response?.data?.error || error.message;
              
              if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
                skippedCount++;
                details.push({
                  row: i + 2,
                  name: trees[i].name,
                  status: 'skipped',
                  reason: errorMsg
                });
              } else {
                errorCount++;
                details.push({
                  row: i + 2,
                  name: trees[i].name,
                  status: 'error',
                  error: errorMsg
                });
              }
            }

            Swal.update({
              html: `Progress: <b>${i + 1}/${trees.length}</b><br/>
                     <span style="color: #059669;">Success: ${successCount}</span> | 
                     <span style="color: #d97706;">Skipped: ${skippedCount}</span> | 
                     <span style="color: #dc2626;">Errors: ${errorCount}</span>`
            });
          }

          // Affichage détaillé des résultats
          let detailsHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">';
          
          if (successCount > 0) {
            detailsHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #059669; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">✓</span> Successfully Created:</h4>';
            details.forEach(detail => {
              if (detail.status === 'created') {
                detailsHtml += `<p style="color: #059669; margin: 5px 0; padding: 8px; background: #d1fae5; border-radius: 4px; border-left: 3px solid #059669;">
                  <strong>Row ${detail.row}:</strong> ${detail.name} 
                  <br><span style="font-size: 11px; color: #047857;">at ${detail.coordinates}</span>
                  - <span style="font-size: 11px; color: #065f46;">ID: ${detail.tree_id}</span>
                </p>`;
              }
            });
            detailsHtml += '</div>';
          }

          if (skippedCount > 0) {
            detailsHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #d97706; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">⊗</span> Skipped (Already Exists):</h4>';
            details.forEach(detail => {
              if (detail.status === 'skipped') {
                detailsHtml += `<p style="color: #d97706; margin: 5px 0; padding: 8px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #d97706;">
                  <strong>Row ${detail.row}:</strong> ${detail.name}
                  <br><span style="font-size: 12px; color: #92400e;">${detail.reason}</span>
                </p>`;
              }
            });
            detailsHtml += '</div>';
          }

          if (errorCount > 0) {
            detailsHtml += '<div><h4 style="color: #dc2626; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">✗</span> Errors:</h4>';
            details.forEach(detail => {
              if (detail.status === 'error') {
                detailsHtml += `<p style="color: #dc2626; margin: 5px 0; padding: 8px; background: #fee2e2; border-radius: 4px; border-left: 3px solid #dc2626;">
                  <strong>Row ${detail.row}:</strong> ${detail.name}
                  <br><span style="font-size: 12px; color: #991b1b;">${detail.error}</span>
                </p>`;
              }
            });
            detailsHtml += '</div>';
          }

          detailsHtml += '</div>';

          Swal.fire({
            title: 'Import Complete!',
            html: `
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; margin: 0 15px;">
                  <div style="font-size: 32px; color: #059669; font-weight: bold;">${successCount}</div>
                  <div style="color: #6b7280; font-size: 13px;">Created</div>
                </div>
                <div style="display: inline-block; margin: 0 15px;">
                  <div style="font-size: 32px; color: #d97706; font-weight: bold;">${skippedCount}</div>
                  <div style="color: #6b7280; font-size: 13px;">Skipped</div>
                </div>
                <div style="display: inline-block; margin: 0 15px;">
                  <div style="font-size: 32px; color: #dc2626; font-weight: bold;">${errorCount}</div>
                  <div style="color: #6b7280; font-size: 13px;">Errors</div>
                </div>
              </div>
              <hr style="margin: 20px 0; border: none; border-top: 2px solid #e5e7eb;">
              ${detailsHtml}
            `,
            icon: successCount > 0 ? 'success' : (skippedCount > 0 ? 'info' : 'error'),
            width: '750px',
            confirmButtonText: 'OK',
            confirmButtonColor: '#10b981'
          });

          if (successCount > 0) {
            onImportSuccess();
          }
          onClose();
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        Swal.fire('Error', 'Failed to parse CSV file', 'error');
      }
    };

    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Bulk Import Trees
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Avertissement doublons GPS */}
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

          {/* Instructions */}
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

          {/* Download Template */}
          <button
            onClick={downloadCSVTemplate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download CSV Template
          </button>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50 hover:bg-purple-100 transition">
            <Upload className="w-16 h-16 mx-auto text-purple-400 mb-4" />
            <p className="text-gray-700 mb-2 font-semibold">Choose your CSV file to upload</p>
            <p className="text-sm text-gray-500 mb-4">Maximum file size: 5MB</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkImport}
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

          {/* Example Preview */}
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

export default TreeBulkImport;