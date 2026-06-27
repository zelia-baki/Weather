import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../../../axiosInstance';
import { Link } from 'react-router-dom';
import {
  TreePine, Map, PenLine, BarChart2, Leaf, Edit2, Trash2,
  Check, ChevronLeft, ChevronRight, Download,
} from 'lucide-react';

const ForestList = () => {
  const [forests,         setForests]         = useState([]);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [editingForestId, setEditingForestId] = useState(null);
  const [editedForest,    setEditedForest]    = useState({});

  useEffect(() => { fetchForests(currentPage); }, [currentPage]);

  const fetchForests = async (page) => {
    try {
      const response = await axiosInstance.get(`/api/forest/?page=${page}`);
      setForests(response.data.forests);
      setTotalPages(response.data.total_pages);
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch forests.', customClass: { popup: 'rounded-2xl' } });
    }
  };

  const handleEditClick = (forest) => {
    setEditingForestId(forest.id);
    setEditedForest({ ...forest });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedForest((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClick = async () => {
    try {
      const response = await axiosInstance.post(`/api/forest/${editingForestId}/update`, {
        name: editedForest.name,
        tree_type: editedForest.tree_type,
      });

      if (response.data.success) {
        setForests((prev) => prev.map((f) => (f.id === editingForestId ? editedForest : f)));
        setEditingForestId(null);
        Swal.fire({ icon: 'success', title: 'Forest updated!', timer: 1800, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update the forest.', customClass: { popup: 'rounded-2xl' } });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while updating the forest.', customClass: { popup: 'rounded-2xl' } });
    }
  };

  const handleDelete = async (forestId, forestName) => {
    const result = await Swal.fire({
      title: `Delete "${forestName}"?`, text: 'This action cannot be undone.',
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete', customClass: { popup: 'rounded-2xl' },
    });
    if (!result.isConfirmed) return;

    try {
      const response = await axiosInstance.post(`/api/forest/${forestId}/delete`);
      if (response.data.success) {
        setForests((prev) => prev.filter((f) => f.id !== forestId));
        Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1800, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete the forest.', customClass: { popup: 'rounded-2xl' } });
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while deleting the forest.', customClass: { popup: 'rounded-2xl' } });
    }
  };

  const handleExportPolygon = async (forest) => {
    try {
      const r = await axiosInstance.get(`/api/forest/${forest.id}/export/polygon`);
      const { geojson } = r.data;

      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `forest_${forest.id}_polygon.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Export failed',
        text: err.response?.data?.message || 'Could not export polygon for this forest.',
        customClass: { popup: 'rounded-2xl' },
      });
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const forestActions = (forest) => [
    { icon: <Map size={12}/>,    label: 'View',   to: '/mapview', state: { owner_id: forest.id, owner_type: 'forest' }, cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    { icon: <PenLine size={12}/>,label: 'Draw',    to: '/mapbox',  state: { owner_id: forest.id, owner_type: 'forest' }, cls: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
    { icon: <BarChart2 size={12}/>, label: 'Report', to: '/reportforest', state: { forestId: forest.id }, cls: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200' },
    { icon: <Leaf size={12}/>,   label: 'Carbon',  to: '/reportcarbonforest', state: { forestId: forest.id }, cls: 'bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200' },
  ];

  return (
    <div className="space-y-3">
      {forests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <TreePine size={40} className="mx-auto mb-3 text-gray-300"/>
          <p className="text-gray-500 font-medium">No forests found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first forest to get started</p>
        </div>
      ) : forests.map((forest) => (
        <div key={forest.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                  <TreePine size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  {editingForestId === forest.id ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text" name="name" value={editedForest.name} onChange={handleInputChange}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-800
                                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <input
                        type="text" name="tree_type" value={editedForest.tree_type} onChange={handleInputChange}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-600
                                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-800 leading-tight">{forest.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">#{forest.id} · {forest.tree_type}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {forestActions(forest).map(({ icon, label, to, state, cls }) => (
                <Link key={label} to={to} state={state}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${cls}`}>
                  {icon} {label}
                </Link>
              ))}
              <button onClick={() => handleExportPolygon(forest)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border-cyan-200 transition-colors">
                <Download size={12}/> Export
              </button>

              {editingForestId === forest.id ? (
                <button onClick={handleSaveClick}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-green-50 text-green-700 hover:bg-green-100 border-green-200 transition-colors">
                  <Check size={12}/> Save
                </button>
              ) : (
                <button onClick={() => handleEditClick(forest)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 transition-colors">
                  <Edit2 size={12}/> Edit
                </button>
              )}
              <button onClick={() => handleDelete(forest.id, forest.name)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 transition-colors">
                <Trash2 size={12}/> Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16}/> Previous
          </button>
          <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
            Next <ChevronRight size={16}/>
          </button>
        </div>
      )}
    </div>
  );
};

export default ForestList;