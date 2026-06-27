import React, { useState } from 'react';
import ModalTree from './ModalTree';
import axiosInstance from '../../../axiosInstance';
import Swal from 'sweetalert2';
import { Download } from 'lucide-react';

const ForestTree = () => {
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);

  const openTreeModal = () => setIsTreeModalOpen(true);
  const closeTreeModal = () => setIsTreeModalOpen(false);

  const handleExportTreePoints = async () => {
    const { value: forestId } = await Swal.fire({
      title: 'Export Tree Points',
      input: 'number',
      inputLabel: 'Forest ID',
      inputPlaceholder: 'Enter the forest ID to export',
      showCancelButton: true,
      confirmButtonText: 'Export',
      confirmButtonColor: '#059669',
      customClass: { popup: 'rounded-2xl' },
      inputValidator: (value) => {
        if (!value) return 'Forest ID is required';
      },
    });

    if (!forestId) return;

    try {
      const r = await axiosInstance.get(`/api/tree/forest/${forestId}/export/points`);
      const { geojson, total_exported, skipped, forest_name } = r.data;

      if (!total_exported) {
        Swal.fire({
          icon: 'info', title: 'No tree points to export',
          text: 'This forest has no trees with valid geolocation.',
          customClass: { popup: 'rounded-2xl' },
        });
        return;
      }

      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `forest_${forestId}_tree_points.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export complete',
        text: skipped?.length
          ? `${total_exported} tree point(s) exported from "${forest_name}". ${skipped.length} skipped (missing point).`
          : `${total_exported} tree point(s) exported from "${forest_name}".`,
        timer: 3000, showConfirmButton: false, customClass: { popup: 'rounded-2xl' },
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Export failed',
        text: err.response?.data?.message || 'Could not export tree points for this forest.',
        customClass: { popup: 'rounded-2xl' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/20 p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tree Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">Create trees and export their boundary points</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportTreePoints}
              className="inline-flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-xl font-medium transition-colors"
            >
              <Download size={15}/> Export Tree Points
            </button>
            <button
              onClick={openTreeModal}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-sm transition-colors"
            >
              Create Tree
            </button>
          </div>
        </div>
      </div>

      <ModalTree isOpen={isTreeModalOpen} onClose={closeTreeModal}>
        <h2 className="text-3xl font-bold text-center text-green-700 mb-6">Create Tree</h2>
        <form
          action="/tree/handle_create_tree"
          method="post"
          className="flex flex-wrap space-y-4"
          encType="multipart/form-data"
        >
          <div className="w-full flex">
            {/* Left Side */}
            <div className="w-1/2 pr-4">
              <div className="mb-4">
                <label htmlFor="tree_name" className="block text-lg font-semibold text-gray-600 mb-2">Tree Name:</label>
                <input
                  type="text"
                  name="tree_name"
                  id="tree_name"
                  placeholder="Enter tree name"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="species" className="block text-lg font-semibold text-gray-600 mb-2">Species:</label>
                <input
                  type="text"
                  name="species"
                  id="species"
                  placeholder="Enter species"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="forest_id" className="block text-lg font-semibold text-gray-600 mb-2">Forest ID:</label>
                <input
                  type="text"
                  name="forest_id"
                  id="forest_id"
                  placeholder="Enter forest ID"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="point_id" className="block text-lg font-semibold text-gray-600 mb-2">Point ID:</label>
                <input
                  type="text"
                  name="point_id"
                  id="point_id"
                  placeholder="Enter point ID"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="date_planted" className="block text-lg font-semibold text-gray-600 mb-2">Date Planted:</label>
                <input
                  type="date"
                  name="date_planted"
                  id="date_planted"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="w-1/2 pl-4">
              <div className="mb-4">
                <label htmlFor="cutting_date" className="block text-lg font-semibold text-gray-600 mb-2">Cutting Date:</label>
                <input
                  type="date"
                  name="cutting_date"
                  id="cutting_date"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="height" className="block text-lg font-semibold text-gray-600 mb-2">Height (m):</label>
                <input
                  type="number"
                  name="height"
                  id="height"
                  placeholder="Enter height in meters"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="diameter" className="block text-lg font-semibold text-gray-600 mb-2">Diameter (cm):</label>
                <input
                  type="number"
                  name="diameter"
                  id="diameter"
                  placeholder="Enter diameter in cm"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="image" className="block text-lg font-semibold text-gray-600 mb-2">Tree Image:</label>
                <input
                  type="file"
                  name="image"
                  id="image"
                  accept="image/*"
                  className="border border-gray-300 rounded-md px-4 py-3 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              className="bg-green-600 text-white font-semibold px-6 py-3 rounded-md shadow-lg hover:bg-green-700 hover:shadow-xl transition duration-300"
            >
              Create Tree
            </button>
          </div>
        </form>
      </ModalTree>
    </div>
  );
};

export default ForestTree;
