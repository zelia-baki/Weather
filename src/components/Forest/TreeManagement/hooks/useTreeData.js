// hooks/useTreeData.js
import { useState, useEffect, useCallback } from 'react';
import { treeService } from '../services/treeService';
import Swal from 'sweetalert2';

export const useTreeData = (viewMode, selectedForest) => {
  const [trees, setTrees] = useState([]);
  const [allTreesForMap, setAllTreesForMap] = useState([]);
  const [forests, setForests] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrees, setTotalTrees] = useState(0);

  const fetchForests = useCallback(async () => {
    try {
      const response = await treeService.fetchForests();
      setForests(response.data.forests || []);
    } catch (error) {
      console.error('Error fetching forests:', error);
    }
  }, []);

  const fetchTrees = useCallback(async (page = 1) => {
    try {
      const forestId = selectedForest !== 'all' ? selectedForest : null;
      const response = await treeService.fetchTrees(page, forestId);
      setTrees(response.data.trees || []);
      setCurrentPage(response.data.current_page || 1);
      setTotalPages(response.data.total_pages || 1);
      setTotalTrees(response.data.total_trees || 0);
    } catch (error) {
      console.error('Error fetching trees:', error);
      Swal.fire('Error', 'Failed to load trees', 'error');
    }
  }, [selectedForest]);

  const fetchAllTreesForMap = useCallback(async () => {
    try {
      const forestId = selectedForest !== 'all' ? selectedForest : null;
      const response = await treeService.fetchAllTrees(forestId);
      setAllTreesForMap(response.data.trees || []);
    } catch (error) {
      console.error('Error fetching all trees for map:', error);
    }
  }, [selectedForest]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await treeService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchForests();
    fetchAllTreesForMap();
    fetchStats();
  }, [fetchForests, fetchAllTreesForMap, fetchStats]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchTrees(currentPage);
    }
  }, [currentPage, viewMode, fetchTrees]);

  useEffect(() => {
    fetchAllTreesForMap();
  }, [selectedForest, fetchAllTreesForMap]);

  return {
    trees,
    allTreesForMap,
    forests,
    stats,
    currentPage,
    totalPages,
    totalTrees,
    setCurrentPage,
    refreshData: () => {
      fetchTrees(currentPage);
      fetchAllTreesForMap();
      fetchStats();
    }
  };
};
