// services/treeService.js
import axiosInstance from '../../../../axiosInstance';

export const treeService = {
  // Trees
  fetchTrees: (page = 1, forestId = null) => {
    const forestParam = forestId ? `&forest_id=${forestId}` : '';
    return axiosInstance.get(`/api/tree/?page=${page}${forestParam}`);
  },

  fetchAllTrees: (forestId = null) => {
    const forestParam = forestId ? `?forest_id=${forestId}` : '';
    return axiosInstance.get(`/api/tree/all${forestParam}`);
  },

  getTree: (id) => axiosInstance.get(`/api/tree/${id}`),

  createTree: (data) => axiosInstance.post('/api/tree/create', data),

  updateTree: (id, data) => axiosInstance.put(`/api/tree/${id}`, data),

  deleteTree: (id) => axiosInstance.delete(`/api/tree/${id}`),

  getStats: () => axiosInstance.get('/api/tree/stats'),

  bulkImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/api/tree/bulk-create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Forests
  fetchForests: () => axiosInstance.get('/api/forest/'),

  // Geocoding
  geocodeAddress: async (address, mapboxToken) => {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
    );
    return response.json();
  }
};
