import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Trees, Plus, List, Map as MapIcon, Edit2, Trash2, X, Filter, Upload, Search, MapPin, Download, AlertCircle } from 'lucide-react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import 'mapbox-gl/dist/mapbox-gl.css';


const MAPBOX_TOKEN = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

const TreeManagement = () => {
  const [trees, setTrees] = useState([]);
  const [forests, setForests] = useState([]);
  const [selectedForest, setSelectedForest] = useState('all');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [isAddingTree, setIsAddingTree] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTree, setEditingTree] = useState(null);
  const [stats, setStats] = useState(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('coordinates'); // 'coordinates' or 'address'

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

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [47.5079, -18.8792], // Madagascar center
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  }, []);

  // Handle map clicks for adding trees
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e) => {
      if (isAddingTree) {
        const { lng, lat } = e.lngLat;
        console.log('Map clicked:', lng, lat); // Debug
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));
        setShowForm(true);
        setIsAddingTree(false);

        // Add temporary marker
        new mapboxgl.Marker({ color: '#10b981' })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }
    };

    map.current.on('click', handleMapClick);

    // Cleanup
    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [isAddingTree]);

  // Fetch data
  useEffect(() => {
    fetchForests();
    fetchTrees();
    fetchStats();
  }, []);

  // Update markers when trees change
  useEffect(() => {
    if (map.current && trees.length > 0) {
      updateMarkers();
    }
  }, [trees, selectedForest]);

  const fetchForests = async () => {
    try {
      const response = await axiosInstance.get('/api/forest/');
      setForests(response.data.forests || []);
    } catch (error) {
      console.error('Error fetching forests:', error);
    }
  };

  const fetchTrees = async () => {
    try {
      const response = await axiosInstance.get('/api/tree/');
      setTrees(response.data.trees || []);
    } catch (error) {
      console.error('Error fetching trees:', error);
      Swal.fire('Error', 'Failed to load trees', 'error');
    }
  };
  // Download CSV template pour trees
  const downloadTreeCSVTemplate = () => {
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

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/tree/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateMarkers = () => {
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter trees by selected forest
    const filteredTrees = selectedForest === 'all'
      ? trees
      : trees.filter(t => t.forest_id === parseInt(selectedForest));

    // Add new markers
    filteredTrees.forEach(tree => {
      if (tree.point) {
        const el = document.createElement('div');
        el.className = 'tree-marker';
        el.innerHTML = `
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#10b981">
            <path d="M17,8C17,10.76 14.76,13 12,13C9.24,13 7,10.76 7,8C7,5.24 9.24,3 12,3C14.76,3 17,5.24 17,8M12,21L9,16H11V12H13V16H15L12,21Z"/>
          </svg>
        `;
        el.style.cursor = 'pointer';

        const popupContent = document.createElement('div');
        popupContent.style.padding = '10px';
        popupContent.innerHTML = `
          <h3 style="font-weight: bold; margin-bottom: 5px;">${tree.name}</h3>
          <p style="margin: 3px 0;"><strong>Type:</strong> ${tree.type || 'N/A'}</p>
          <p style="margin: 3px 0;"><strong>Height:</strong> ${tree.height}m</p>
          <p style="margin: 3px 0;"><strong>Diameter:</strong> ${tree.diameter}cm</p>
          <p style="margin: 3px 0;"><strong>Forest:</strong> ${tree.forest_name || 'N/A'}</p>
          <p style="margin: 3px 0;"><strong>Planted:</strong> ${tree.date_planted || 'N/A'}</p>
          <div style="margin-top: 10px; display: flex; gap: 5px;">
            <button id="edit-tree-${tree.id}" style="background: #3b82f6; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Edit
            </button>
            <button id="delete-tree-${tree.id}" style="background: #ef4444; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
              Delete
            </button>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContent);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([tree.point.longitude, tree.point.latitude])
          .setPopup(popup)
          .addTo(map.current);

        // Add event listeners after popup opens
        popup.on('open', () => {
          const editBtn = document.getElementById(`edit-tree-${tree.id}`);
          const deleteBtn = document.getElementById(`delete-tree-${tree.id}`);

          if (editBtn) {
            editBtn.onclick = () => {
              popup.remove();
              handleEdit(tree);
            };
          }

          if (deleteBtn) {
            deleteBtn.onclick = () => {
              popup.remove();
              handleDelete(tree.id);
            };
          }
        });

        markers.current.push(marker);
      }
    });

    // Fit bounds if trees exist
    if (filteredTrees.length > 0 && filteredTrees[0].point) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredTrees.forEach(tree => {
        if (tree.point) {
          bounds.extend([tree.point.longitude, tree.point.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      Swal.fire('Error', 'Please click on the map to select a location', 'error');
      return;
    }

    try {
      const endpoint = editingTree ? `/api/tree/${editingTree.id}` : '/api/tree/create';
      const method = editingTree ? 'put' : 'post';

      await axiosInstance[method](endpoint, formData);

      Swal.fire('Success', `Tree ${editingTree ? 'updated' : 'created'} successfully`, 'success');

      setShowForm(false);
      setEditingTree(null);
      resetForm();
      fetchTrees();
      fetchStats();

    } catch (error) {
      console.error('Error saving tree:', error);
      Swal.fire('Error', error.response?.data?.error || 'Failed to save tree', 'error');
    }
  };

  const handleEdit = (tree) => {
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

  const handleDelete = async (treeId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the tree and its location',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/tree/${treeId}`);
        Swal.fire('Deleted!', 'Tree has been deleted.', 'success');
        fetchTrees();
        fetchStats();
      } catch (error) {
        Swal.fire('Error', 'Failed to delete tree', 'error');
      }
    }
  };

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

  // Search location on map
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Swal.fire('Error', 'Please enter search criteria', 'error');
      return;
    }

    if (searchType === 'coordinates') {
      // Search by coordinates (format: lat,lng or lng,lat)
      const coords = searchQuery.split(',').map(c => parseFloat(c.trim()));

      if (coords.length !== 2 || coords.some(isNaN)) {
        Swal.fire('Error', 'Invalid coordinates format. Use: latitude,longitude', 'error');
        return;
      }

      const [first, second] = coords;
      // Try both lat,lng and lng,lat
      const lat = Math.abs(first) <= 90 ? first : second;
      const lng = Math.abs(second) <= 180 ? second : first;

      map.current.flyTo({
        center: [lng, lat],
        zoom: 15,
        duration: 2000
      });

      // Add temporary marker
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`<p>Search Result<br/>${lat}, ${lng}</p>`))
        .addTo(map.current)
        .togglePopup();

    } else {
      // Search by address using Mapbox Geocoding API
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const placeName = data.features[0].place_name;

          map.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            duration: 2000
          });

          new mapboxgl.Marker({ color: '#ef4444' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<p>${placeName}</p>`))
            .addTo(map.current)
            .togglePopup();
        } else {
          Swal.fire('Not Found', 'Location not found', 'warning');
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        Swal.fire('Error', 'Failed to search location', 'error');
      }
    }

    setSearchQuery('');
    setShowSearch(false);
  };

  // Bulk import from CSV
  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Validate headers
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

        // Show confirmation
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

              // ✅ Détecter si c'est un doublon (selon le message d'erreur du backend)
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

            // Update progress
            Swal.update({
              html: `Progress: <b>${i + 1}/${trees.length}</b><br/>
                   <span style="color: #059669;">Success: ${successCount}</span> | 
                   <span style="color: #d97706;">Skipped: ${skippedCount}</span> | 
                   <span style="color: #dc2626;">Errors: ${errorCount}</span>`
            });
          }

          // ✅ Affichage détaillé des résultats
          let detailsHtml = '<div style="text-align: left; max-height: 400px; overflow-y: auto; padding: 10px;">';

          // Succès
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

          // Ignorés
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

          // Erreurs
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

          fetchTrees();
          fetchStats();
          setShowBulkImport(false);
        }
      } catch (error) {
        console.error('CSV parsing error:', error);
        Swal.fire('Error', 'Failed to parse CSV file', 'error');
      }
    };

    reader.readAsText(file);
    e.target.value = null;
  };
  // Download CSV template
  const downloadCSVTemplate = () => {
    const template = `name,type,forest_id,latitude,longitude,height,diameter,date_planted,date_cut
Example Tree 1,Oak,1,-18.8792,47.5079,15.5,45.2,2023-01-15,
Example Tree 2,Pine,1,-18.8800,47.5100,12.3,38.7,2023-02-20,2024-01-10`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTrees = selectedForest === 'all'
    ? trees
    : trees.filter(t => t.forest_id === parseInt(selectedForest));

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2 mb-4">
          <Trees className="w-8 h-8" />
          Tree Management System
        </h1>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm text-gray-600">Total Trees</h3>
              <p className="text-2xl font-bold text-green-700">{stats.total_trees}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm text-gray-600">Average Height</h3>
              <p className="text-2xl font-bold text-blue-700">{stats.avg_height}m</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h3 className="text-sm text-gray-600">Average Diameter</h3>
              <p className="text-2xl font-bold text-amber-700">{stats.avg_diameter}cm</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsAddingTree(!isAddingTree)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${isAddingTree
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
          >
            {isAddingTree ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {isAddingTree ? 'Cancel Adding' : 'Add Tree'}
          </button>
          {/* Dans la section Controls, après le bouton "Add Tree" */}
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>

          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
          >
            <Search className="w-5 h-5" />
            Search Location
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            {viewMode === 'map' ? <List className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
            {viewMode === 'map' ? 'List View' : 'Map View'}
          </button>

          <select
            value={selectedForest}
            onChange={(e) => setSelectedForest(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Forests</option>
            {forests.map(forest => (
              <option key={forest.id} value={forest.id}>{forest.name}</option>
            ))}
          </select>
        </div>

        {isAddingTree && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-semibold">📍 Click on the map to place a tree</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Forest</th>
                <th className="px-4 py-3 text-left">Height</th>
                <th className="px-4 py-3 text-left">Diameter</th>
                <th className="px-4 py-3 text-left">Planted</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrees.map((tree, index) => (
                <tr key={tree.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3">{tree.name}</td>
                  <td className="px-4 py-3">{tree.type || 'N/A'}</td>
                  <td className="px-4 py-3">{tree.forest_name || 'N/A'}</td>
                  <td className="px-4 py-3">{tree.height}m</td>
                  <td className="px-4 py-3">{tree.diameter}cm</td>
                  <td className="px-4 py-3">{tree.date_planted || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(tree)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tree.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-800">
                  {editingTree ? 'Edit Tree' : 'Add New Tree'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingTree(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tree Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tree Type
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Oak, Pine..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Forest *
                    </label>
                    <select
                      value={formData.forest_id}
                      onChange={(e) => setFormData({ ...formData, forest_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select Forest</option>
                      {forests.map(forest => (
                        <option key={forest.id} value={forest.id}>{forest.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Height (m) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Diameter (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.diameter}
                      onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Date Planted *
                    </label>
                    <input
                      type="date"
                      value={formData.date_planted}
                      onChange={(e) => setFormData({ ...formData, date_planted: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Date Cut (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.date_cut}
                      onChange={(e) => setFormData({ ...formData, date_cut: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="text"
                      value={formData.latitude}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Click on map"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="text"
                      value={formData.longitude}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      placeholder="Click on map"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                  >
                    {editingTree ? 'Update Tree' : 'Create Tree'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTree(null);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Search Location Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                Search Location
              </h2>
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchType('coordinates')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${searchType === 'coordinates'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Coordinates
                  </button>
                  <button
                    onClick={() => setSearchType('address')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${searchType === 'address'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    Address
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {searchType === 'coordinates' ? 'Enter Coordinates (lat,lng)' : 'Enter Address'}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={searchType === 'coordinates' ? '-18.8792, 47.5079' : 'Antananarivo, Madagascar'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {searchType === 'coordinates'
                    ? 'Format: latitude, longitude (e.g., -18.8792, 47.5079)'
                    : 'Enter city, address, or place name'}
                </p>
              </div>

              <button
                onClick={handleSearch}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                <Search className="w-5 h-5 inline mr-2" />
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Bulk Import Trees
              </h2>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ✅ Avertissement doublons GPS */}
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
                    <p className="font-mono">✓ "Oak 1" at -18.9000, 47.5200 - Different location 10m, created</p>
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
                onClick={downloadTreeCSVTemplate}
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
      )}
    </div>
  );
};

export default TreeManagement;