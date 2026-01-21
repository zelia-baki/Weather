import React, { useState } from 'react';
import axiosInstance from '../../../axiosInstance';
import Modal from './Modal';
import ForestList from './ForestList';
import { Link } from 'react-router-dom';
import { Upload, X, Download, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const ForestPage = () => {
  const [isForestModalOpen, setIsForestModalOpen] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);

  const openForestModal = () => setIsForestModalOpen(true);
  const closeForestModal = () => setIsForestModalOpen(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
      const response = await axiosInstance.post('/api/forest/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Swal.fire('Success', 'Forest created successfully', 'success');
        setUpdateFlag(!updateFlag);
        closeForestModal();
      } else {
        Swal.fire('Error', 'Failed to create forest', 'error');
      }
    } catch (error) {
      console.error('Error creating forest:', error);
      Swal.fire('Error', 'An error occurred while creating the forest', 'error');
    }
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const template = `name,tree_type
Ambohimanga Forest,Eucalyptus
Ranomafana Forest,Pine
Andasibe Forest,Rosewood
Masoala Forest,Ebony
Isalo Forest,Baobab`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forest_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk import from CSV
  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      Swal.fire({
        title: 'Importing Forests...',
        html: 'Processing your CSV file...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axiosInstance.post('/api/forest/bulk-create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { success, errors, skipped, details } = response.data;

      // ✅ Affichage des résultats détaillés
      let detailsHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">';
      
      // Succès - Forêts créées
      if (success > 0) {
        detailsHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #059669; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">✓</span> Successfully Created:</h4>';
        details.forEach(detail => {
          if (detail.status === 'created') {
            detailsHtml += `<p style="color: #059669; margin: 5px 0; padding: 8px; background: #d1fae5; border-radius: 4px; border-left: 3px solid #059669;">
              <strong>Row ${detail.row}:</strong> ${detail.name} 
              <span style="color: #047857;">(${detail.tree_type})</span> 
              - <span style="font-size: 11px; color: #065f46;">ID: ${detail.forest_id}</span>
            </p>`;
          }
        });
        detailsHtml += '</div>';
      }

      // Ignorés - Doublons détectés
      if (skipped > 0) {
        detailsHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #d97706; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">⊗</span> Skipped (Already Exists):</h4>';
        details.forEach(detail => {
          if (detail.status === 'skipped') {
            detailsHtml += `<p style="color: #d97706; margin: 5px 0; padding: 8px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #d97706;">
              <strong>Row ${detail.row}:</strong> ${detail.name} 
              ${detail.tree_type ? `<span style="color: #b45309;">(${detail.tree_type})</span>` : ''} 
              <br><span style="font-size: 12px; color: #92400e;">${detail.reason}</span>
            </p>`;
          }
        });
        detailsHtml += '</div>';
      }

      // Erreurs
      if (errors > 0) {
        detailsHtml += '<div><h4 style="color: #dc2626; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">✗</span> Errors:</h4>';
        details.forEach(detail => {
          if (detail.error) {
            detailsHtml += `<p style="color: #dc2626; margin: 5px 0; padding: 8px; background: #fee2e2; border-radius: 4px; border-left: 3px solid #dc2626;">
              <strong>Row ${detail.row}:</strong> ${detail.name || 'N/A'}
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
              <div style="font-size: 32px; color: #059669; font-weight: bold;">${success}</div>
              <div style="color: #6b7280; font-size: 13px;">Created</div>
            </div>
            <div style="display: inline-block; margin: 0 15px;">
              <div style="font-size: 32px; color: #d97706; font-weight: bold;">${skipped}</div>
              <div style="color: #6b7280; font-size: 13px;">Skipped</div>
            </div>
            <div style="display: inline-block; margin: 0 15px;">
              <div style="font-size: 32px; color: #dc2626; font-weight: bold;">${errors}</div>
              <div style="color: #6b7280; font-size: 13px;">Errors</div>
            </div>
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 2px solid #e5e7eb;">
          ${detailsHtml}
        `,
        icon: success > 0 ? 'success' : (skipped > 0 ? 'info' : 'error'),
        width: '750px',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0d9488'
      });

      if (success > 0) {
        setUpdateFlag(!updateFlag);
      }
      setShowBulkImport(false);

    } catch (error) {
      console.error('Bulk import error:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.msg || 'Failed to import forests',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    }

    e.target.value = null;
  };

  return (
    <div className="container mx-auto px-6 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-teal-800">Forest Management</h1>
      
      <div className="flex flex-col items-center mb-8">
        {/* Buttons Row */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <button
            onClick={openForestModal}
            className="bg-teal-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-teal-700 transition duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Forest
          </button>

          <button
            onClick={() => setShowBulkImport(true)}
            className="bg-purple-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-purple-700 transition duration-300 flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>

          <Link
            to="/mapviewall"
            state={{ owner_type: "forest" }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md shadow-lg transition duration-300"
          >
            View All Forests
          </Link>

          <Link
            to="/treemanager"
            state={{ owner_type: "forest" }}
            className="bg-green-500 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-md shadow-lg transition duration-300"
          >
            Go to Trees
          </Link>
        </div>
        
        {/* Forest List */}
        <div className="w-full bg-white p-6 rounded-lg shadow-md">
          <ForestList key={updateFlag} />
        </div>
      </div>

      {/* Create Forest Modal */}
      <Modal isOpen={isForestModalOpen} onClose={closeForestModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4 text-teal-800">Create New Forest</h2>
          <input
            type="text"
            name="name"
            placeholder="Forest Name"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <input
            type="text"
            name="tree_type"
            placeholder="Tree Type (e.g., Oak, Pine, Eucalyptus)"
            className="border rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-teal-400"
            required
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            className="border rounded-md px-4 py-3 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            type="submit"
            className="bg-teal-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-teal-700 transition duration-300 w-full"
          >
            Create Forest
          </button>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Bulk Import Forests
              </h2>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ✅ Avertissement doublons */}
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Duplicate Prevention Active</p>
                  <p className="text-amber-700">
                    Forests with the same <strong>name AND tree type</strong> will be automatically skipped. 
                    You can have forests with the same name but different tree types.
                  </p>
                  <div className="mt-2 bg-white rounded p-2 text-xs text-amber-900">
                    <p className="font-mono">✓ "Oak Forest" (Eucalyptus) - New entry</p>
                    <p className="font-mono">✓ "Oak Forest" (Pine) - Different type, will create</p>
                    <p className="font-mono">⊗ "Oak Forest" (Eucalyptus) - Duplicate, will skip</p>
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
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <div>
                      <strong className="text-purple-700">name</strong> - Forest name (required)
                      <div className="text-xs text-gray-500 mt-1">Example: "Ambohimanga Forest"</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <div>
                      <strong className="text-purple-700">tree_type</strong> - Primary tree type (required)
                      <div className="text-xs text-gray-500 mt-1">Example: "Eucalyptus", "Pine", "Oak"</div>
                    </div>
                  </li>
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
                  id="csv-upload-forest"
                />
                <label
                  htmlFor="csv-upload-forest"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg cursor-pointer transition shadow-md"
                >
                  Select CSV File
                </label>
              </div>

              {/* Example Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Example CSV Content:</h4>
                <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
{`name,tree_type
Ambohimanga Forest,Eucalyptus
Ranomafana Forest,Pine
Andasibe Forest,Rosewood
Ambohimanga Forest,Pine`}
                </pre>
                <p className="text-xs text-gray-500 mt-2">
                  ℹ️ Note: Last line has same name but different tree type - it will be created
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForestPage;