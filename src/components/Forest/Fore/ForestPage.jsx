import React, { useState } from 'react';
import axiosInstance from '../../../axiosInstance';
import Modal from './Modal';
import ForestList from './ForestList';
import { Link } from 'react-router-dom';
import { Plus, Upload, X, Download, AlertCircle, TreePine, Map } from 'lucide-react';
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        Swal.fire({ icon: 'success', title: 'Forest created!', timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
        setUpdateFlag(!updateFlag);
        closeForestModal();
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create forest', customClass: { popup: 'rounded-2xl' } });
      }
    } catch (error) {
      console.error('Error creating forest:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while creating the forest', customClass: { popup: 'rounded-2xl' } });
    }
  };

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
        customClass: { popup: 'rounded-2xl' },
        didOpen: () => Swal.showLoading(),
      });

      const response = await axiosInstance.post('/api/forest/bulk-create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { success, errors, skipped, details } = response.data;

      let detailsHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">';

      if (success > 0) {
        detailsHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #059669; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">✓</span> Successfully Created:</h4>';
        details.forEach(detail => {
          if (detail.status === 'created') {
            detailsHtml += `<p style="color: #059669; margin: 5px 0; padding: 8px; background: #d1fae5; border-radius: 8px; border-left: 3px solid #059669;">
              <strong>Row ${detail.row}:</strong> ${detail.name}
              <span style="color: #047857;">(${detail.tree_type})</span>
              - <span style="font-size: 11px; color: #065f46;">ID: ${detail.forest_id}</span>
            </p>`;
          }
        });
        detailsHtml += '</div>';
      }

      if (skipped > 0) {
        detailsHtml += '<div style="margin-bottom: 15px;"><h4 style="color: #d97706; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">⊗</span> Skipped (Already Exists):</h4>';
        details.forEach(detail => {
          if (detail.status === 'skipped') {
            detailsHtml += `<p style="color: #d97706; margin: 5px 0; padding: 8px; background: #fef3c7; border-radius: 8px; border-left: 3px solid #d97706;">
              <strong>Row ${detail.row}:</strong> ${detail.name}
              ${detail.tree_type ? `<span style="color: #b45309;">(${detail.tree_type})</span>` : ''}
              <br><span style="font-size: 12px; color: #92400e;">${detail.reason}</span>
            </p>`;
          }
        });
        detailsHtml += '</div>';
      }

      if (errors > 0) {
        detailsHtml += '<div><h4 style="color: #dc2626; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;"><span style="font-size: 20px;">✗</span> Errors:</h4>';
        details.forEach(detail => {
          if (detail.error) {
            detailsHtml += `<p style="color: #dc2626; margin: 5px 0; padding: 8px; background: #fee2e2; border-radius: 8px; border-left: 3px solid #dc2626;">
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
        confirmButtonColor: '#059669',
        customClass: { popup: 'rounded-2xl' },
      });

      if (success > 0) setUpdateFlag(!updateFlag);
      setShowBulkImport(false);

    } catch (error) {
      console.error('Bulk import error:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.msg || 'Failed to import forests',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        customClass: { popup: 'rounded-2xl' },
      });
    }

    e.target.value = null;
  };
  const handleExportAllPolygons = async () => {
    try {
      const r = await axiosInstance.get('/api/forest/export/polygons');
      const { geojson, total_exported, skipped } = r.data;

      if (!total_exported) {
        Swal.fire({
          icon: 'info', title: 'No polygons to export',
          text: 'No forest currently has a saved boundary.',
          customClass: { popup: 'rounded-2xl' },
        });
        return;
      }

      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `forests_polygons_export_${date}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export complete',
        text: skipped?.length
          ? `${total_exported} polygon(s) exported. ${skipped.length} forest(s) skipped (no boundary).`
          : `${total_exported} polygon(s) exported.`,
        timer: 3000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' },
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Export failed',
        text: err.response?.data?.message || err.message || 'Could not export polygons.',
        customClass: { popup: 'rounded-2xl' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TreePine size={22} className="text-emerald-600" /> Forest Management
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage registered forests and their boundaries</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/mapviewall" state={{ owner_type: 'forest' }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
              <Map size={15} /> View All
            </Link>
            <button onClick={() => setShowBulkImport(true)}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-xl font-medium transition-colors">
              <Upload size={15} /> Bulk Import
            </button>
            <button onClick={handleExportAllPolygons}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-xl font-medium transition-colors">
              <Download size={15} /> Export Polygons
            </button>
            <button onClick={openForestModal}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors">
              <Plus size={15} /> Create Forest
            </button>
          </div>
        </div>
      </div>

      {/* Forest List */}
      <ForestList key={updateFlag} />

      {/* Create Forest Modal */}
      <Modal isOpen={isForestModalOpen} onClose={closeForestModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
            <Plus size={18} className="text-emerald-600" /> New Forest
          </h2>
          <p className="text-xs text-gray-400 mb-3">Register a new forest and its primary tree type</p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Forest Name</label>
            <input
              type="text" name="name" placeholder="e.g. Ambohimanga Forest" required
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-emerald-400 focus:border-transparent hover:border-gray-300 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tree Type</label>
            <input
              type="text" name="tree_type" placeholder="e.g. Eucalyptus, Pine" required
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none
                         focus:ring-2 focus:ring-emerald-400 focus:border-transparent hover:border-gray-300 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Photo (optional)</label>
            <input
              type="file" name="image" accept="image/*"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 outline-none
                         focus:ring-2 focus:ring-emerald-400 focus:border-transparent hover:border-gray-300 transition-all"
            />
          </div>

          <button type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors">
            Create Forest
          </button>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Upload size={18} className="text-emerald-600" /> Bulk Import Forests
              </h2>
              <button onClick={() => setShowBulkImport(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800 mb-1">Duplicate Prevention Active</p>
                  <p className="text-amber-700">
                    Forests with the same <strong>name AND tree type</strong> will be skipped automatically.
                    Same name with a different tree type will still be created.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2 text-sm">CSV Format</h3>
                <p className="text-sm text-gray-600 mb-2">Your file needs these columns:</p>
                <ul className="text-sm text-gray-600 space-y-1 ml-1">
                  <li><strong className="text-blue-700">name</strong> — e.g. "Ambohimanga Forest"</li>
                  <li><strong className="text-blue-700">tree_type</strong> — e.g. "Eucalyptus", "Pine"</li>
                </ul>
              </div>

              <button onClick={downloadCSVTemplate}
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                <Download size={15} /> Download CSV Template
              </button>

              <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                <Upload size={36} className="mx-auto text-emerald-300 mb-3" />
                <p className="text-gray-700 text-sm font-semibold mb-1">Choose your CSV file</p>
                <p className="text-xs text-gray-400 mb-3">Maximum file size: 5MB</p>
                <input type="file" accept=".csv" onChange={handleBulkImport} className="hidden" id="csv-upload-forest" />
                <label htmlFor="csv-upload-forest"
                  className="inline-block cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
                  Select CSV File
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForestPage;