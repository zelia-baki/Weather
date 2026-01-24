// components/TreeManagement/TreeManagement.jsx
import React, { useState, useEffect } from 'react';
import { Trees, Plus, List, Map as MapIcon, Upload, Search, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useTreeData } from './hooks/useTreeData';
import { useMapbox } from './hooks/useMapbox';
import { treeService } from './services/treeService';

import TreeForm from './TreeForm';
import TreeList from './TreeList';
import BulkImportModal from './BulkImportModal';
import TreeStats from './TreeStats';
import SearchModal from './SearchModal';

const TreeManagement = () => {
  const [selectedForest, setSelectedForest] = useState('all');
  const [viewMode, setViewMode] = useState('map');
  const [isAddingTree, setIsAddingTree] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTree, setEditingTree] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    forest_id: '',
    height: '',
    diameter: '',
    date_planted: '',
    date_cut: '',
    latitude: '',
    longitude: ''
  });

  const {
    trees,
    allTreesForMap,
    forests,
    stats,
    currentPage,
    totalPages,
    totalTrees,
    setCurrentPage,
    refreshData
  } = useTreeData(viewMode, selectedForest);

  const handleMapClick = (lngLat) => {
    if (isAddingTree) {
      setFormData(prev => ({
        ...prev,
        latitude: lngLat.lat.toFixed(6),
        longitude: lngLat.lng.toFixed(6)
      }));
      setShowForm(true);
      setIsAddingTree(false);
      addTemporaryMarker(lngLat.lng, lngLat.lat);
    }
  };

  const { mapContainer, updateMarkers, flyTo, addTemporaryMarker } = useMapbox(handleMapClick, allTreesForMap);

  useEffect(() => {
    if (viewMode === 'map' && allTreesForMap.length > 0) {
      const filteredTrees = selectedForest === 'all'
        ? allTreesForMap
        : allTreesForMap.filter(t => t.forest_id === parseInt(selectedForest));
      
      updateMarkers(filteredTrees, handleTreeClick, handleEditTree, handleDeleteTree);
    }
  }, [allTreesForMap, selectedForest, viewMode, updateMarkers]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      forest_id: '',
      height: '',
      diameter: '',
      date_planted: '',
      date_cut: '',
      latitude: '',
      longitude: ''
    });
  };

  const handleTreeClick = (tree) => {
    Swal.fire({
      title: tree.name,
      html: `
        <div style="text-align: left;">
          <p><strong>Type:</strong> ${tree.type || 'N/A'}</p>
          <p><strong>Forest:</strong> ${tree.forest_name || 'N/A'}</p>
          <p><strong>Height:</strong> ${tree.height}m</p>
          <p><strong>Diameter:</strong> ${tree.diameter}cm</p>
          <p><strong>Planted:</strong> ${tree.date_planted || 'Unknown'}</p>
          ${tree.date_cut ? `<p><strong>Cut:</strong> ${tree.date_cut}</p>` : ''}
          <p><strong>Location:</strong> ${tree.point?.latitude}, ${tree.point?.longitude}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#059669'
    });
  };

  const handleEditTree = (tree) => {
    setEditingTree(tree);
    setFormData({
      name: tree.name,
      type: tree.type || '',
      forest_id: tree.forest_id,
      height: tree.height,
      diameter: tree.diameter,
      date_planted: tree.date_planted?.split('T')[0] || '',
      date_cut: tree.date_cut?.split('T')[0] || '',
      latitude: tree.point?.latitude || '',
      longitude: tree.point?.longitude || ''
    });
    setShowForm(true);
  };

  const handleDeleteTree = async (treeId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This tree will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await treeService.deleteTree(treeId);
        Swal.fire('Deleted!', 'Tree has been deleted.', 'success');
        refreshData();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete tree', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTree) {
        await treeService.updateTree(editingTree.id, formData);
        Swal.fire('Success', 'Tree updated successfully!', 'success');
      } else {
        await treeService.createTree(formData);
        Swal.fire('Success', 'Tree added successfully!', 'success');
      }
      setShowForm(false);
      setEditingTree(null);
      resetForm();
      refreshData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Failed to save tree', 'error');
    }
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await treeService.bulkImport(file);
      const { success, errors, skipped, details } = response.data;

      let resultHtml = `
        <div style="text-align: left; padding: 10px;">
          <div style="display: flex; justify-content: space-around; margin-bottom: 20px; font-size: 18px;">
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #059669;">${success}</div>
              <div style="color: #6b7280;">Created</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${skipped}</div>
              <div style="color: #6b7280;">Skipped</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${errors}</div>
              <div style="color: #6b7280;">Errors</div>
            </div>
          </div>
      `;

      if (details && details.length > 0) {
        resultHtml += '<div style="max-height: 300px; overflow-y: auto; border-top: 1px solid #e5e7eb; padding-top: 15px;">';
        details.forEach(d => {
          if (d.status === 'created') {
            resultHtml += `
              <div style="padding: 8px; margin-bottom: 8px; background: #d1fae5; border-left: 3px solid #059669; border-radius: 4px;">
                <strong style="color: #065f46;">Row ${d.row}: ${d.name}</strong>
                <div style="font-size: 12px; color: #047857;">✓ Tree created successfully</div>
              </div>
            `;
          } else if (d.status === 'skipped') {
            resultHtml += `
              <div style="padding: 8px; margin-bottom: 8px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px;">
                <strong style="color: #92400e;">Row ${d.row}: ${d.name}</strong>
                <div style="font-size: 12px; color: #b45309;">⊗ ${d.reason}</div>
              </div>
            `;
          } else if (d.error) {
            resultHtml += `
              <div style="padding: 8px; margin-bottom: 8px; background: #fee2e2; border-left: 3px solid #dc2626; border-radius: 4px;">
                <strong style="color: #991b1b;">Row ${d.row}: ${d.name || 'N/A'}</strong>
                <div style="font-size: 12px; color: #b91c1c;">✗ ${d.error}</div>
              </div>
            `;
          }
        });
        resultHtml += '</div>';
      }

      resultHtml += '</div>';

      Swal.fire({
        title: 'Import Complete',
        html: resultHtml,
        icon: errors > 0 ? 'warning' : 'success',
        confirmButtonColor: '#059669',
        width: '600px'
      });

      setShowBulkImport(false);
      refreshData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.msg || 'Failed to import trees', 'error');
    }

    e.target.value = '';
  };

  const downloadTemplate = () => {
    const template = `name,type,forest_id,latitude,longitude,height,diameter,date_planted,date_cut
Example Tree 1,Oak,1,-18.8792,47.5079,15.5,45.2,2023-01-15,
Example Tree 2,Pine,1,-18.8800,47.5100,12.3,38.7,2023-02-20,2024-01-10
Example Tree 3,Eucalyptus,2,-18.8750,47.5050,18.2,52.1,2022-11-30,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = async (query, type) => {
    try {
      if (type === 'coordinates') {
        const [lat, lng] = query.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinates');
        }
        flyTo(lng, lat);
      } else {
        const MAPBOX_TOKEN = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';
        const data = await treeService.geocodeAddress(query, MAPBOX_TOKEN);
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          flyTo(lng, lat);
        } else {
          Swal.fire('Not Found', 'Location not found', 'warning');
        }
      }
      setShowSearch(false);
    } catch (error) {
      Swal.fire('Error', 'Invalid search query', 'error');
    }
  };

  const handleLocateTree = (tree) => {
    if (tree.point) {
      setViewMode('map');
      setTimeout(() => {
        flyTo(tree.point.longitude, tree.point.latitude);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trees className="w-10 h-10 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-800">Tree Management</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSearch(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
              <button
                onClick={() => setShowBulkImport(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Import CSV
              </button>
              <button
                onClick={() => {
                  setIsAddingTree(true);
                  setViewMode('map');
                  Swal.fire({
                    title: 'Click on Map',
                    text: 'Click on the map to place a new tree',
                    icon: 'info',
                    timer: 3000
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Tree
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && <TreeStats stats={stats} totalTrees={totalTrees} />}

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewMode === 'map'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <MapIcon className="w-5 h-5 inline mr-2" />
                Map View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <List className="w-5 h-5 inline mr-2" />
                List View
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedForest}
                onChange={(e) => setSelectedForest(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Forests</option>
                {forests.map(forest => (
                  <option key={forest.id} value={forest.id}>
                    {forest.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div 
            ref={mapContainer} 
            style={{ 
              width: '100%', 
              height: '600px',
              display: viewMode === 'map' ? 'block' : 'none'
            }} 
          />
          
          {viewMode === 'list' && (
            <div className="p-6">
              <TreeList
                trees={trees}
                onEdit={handleEditTree}
                onDelete={handleDeleteTree}
                onLocate={handleLocateTree}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <TreeForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTree(null);
            resetForm();
          }}
          forests={forests}
          isEditing={!!editingTree}
        />
      )}

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSearch={handleSearch}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onImport={handleBulkImport}
          onDownloadTemplate={downloadTemplate}
        />
      )}
    </div>
  );
};

export default TreeManagement;