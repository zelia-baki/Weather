import React, { useEffect, useState } from "react";
import * as turf from '@turf/turf';
import axiosInstance from "../../axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";
import MapboxExample from "./../mapbox/MapViewAllDash";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

const chartColors = [
  "rgba(99,102,241,0.7)", // Indigo
  "rgba(168,85,247,0.7)", // Violet
  "rgba(248,113,113,0.7)", // Red
  "rgba(34,197,94,0.7)",   // Green
  "rgba(251,191,36,0.7)",  // Yellow
  "rgba(59,130,246,0.7)",  // Blue
  "rgba(236,72,153,0.7)",  // Pink
];

export default function Dashboard() {
  const [stats, setStats] = useState({ usersByType: {}, entities: {}, loading: true });
  const [areaStats, setAreaStats] = useState({ totalArea: 0, polygonCount: 0, areaByOwnerType: {}, loading: true });
  const [farmerStats, setFarmerStats] = useState({ totalFarmers: 0, loading: true });
  const [forestStats, setForestStats] = useState({ totalForests: 0, loading: true });
  const [treeStats, setTreeStats] = useState({ totalTrees: 0, avgHeight: 0, avgDiameter: 0, treesByForest: [], loading: true });
  const [dynamicUserStats, setDynamicUserStats] = useState({ loading: true, data: {} });
  const [crops, setCrops] = useState([]);
  const [grades, setGrades] = useState([]);
  const [stores, setStores] = useState([]);
  const [forestReports, setForestReports] = useState({ total: 0, compliant: 0, loading: true });

  // ===============================
  // FETCH FARMER STATS
  // ===============================
    const formatArea = (areaInSquareMeters) => {
    if (!areaInSquareMeters || areaInSquareMeters === 0) return '0 m²';
    const hectares = areaInSquareMeters / 10000;
    return hectares >= 0.01 
      ? `${hectares.toFixed(2)} ha` 
      : `${areaInSquareMeters.toFixed(0)} m²`;
  };
  useEffect(() => {
    const fetchFarmerStats = async () => {
      try {
        const response = await axiosInstance.get('/api/farm/?page=1');
        let totalFarmers = 0;

        if (response.data.total) {
          totalFarmers = response.data.total;
        } else if (response.data.total_pages && response.data.farms) {
          const totalPages = response.data.total_pages;

          if (totalPages === 1) {
            totalFarmers = response.data.farms.length;
          } else {
            const allPagesPromises = [];
            for (let page = 1; page <= totalPages; page++) {
              allPagesPromises.push(axiosInstance.get(`/api/farm/?page=${page}`));
            }

            const allPages = await Promise.all(allPagesPromises);
            totalFarmers = allPages.reduce((total, pageResponse) => {
              return total + (pageResponse.data.farms ? pageResponse.data.farms.length : 0);
            }, 0);
          }
        } else {
          totalFarmers = response.data.farms ? response.data.farms.length : 0;
        }

        setFarmerStats({ totalFarmers, loading: false });

      } catch (error) {
        console.error('Error fetching farmer stats:', error);
        setFarmerStats({ totalFarmers: 0, loading: false });
      }
    };

    fetchFarmerStats();
  }, []);

  // ===============================
  // FETCH FOREST STATS
  // ===============================
  useEffect(() => {
    const fetchForestStats = async () => {
      try {
        const response = await axiosInstance.get('/api/forest/?page=1');
        let totalForests = 0;

        if (response.data.total) {
          totalForests = response.data.total;
        } else if (response.data.total_pages && response.data.forests) {
          const totalPages = response.data.total_pages;

          if (totalPages === 1) {
            totalForests = response.data.forests.length;
          } else {
            const allPagesPromises = [];
            for (let page = 1; page <= totalPages; page++) {
              allPagesPromises.push(axiosInstance.get(`/api/forest/?page=${page}`));
            }

            const allPages = await Promise.all(allPagesPromises);
            totalForests = allPages.reduce((total, pageResponse) => {
              return total + (pageResponse.data.forests ? pageResponse.data.forests.length : 0);
            }, 0);
          }
        } else {
          totalForests = response.data.forests ? response.data.forests.length : 0;
        }

        setForestStats({ totalForests, loading: false });

      } catch (error) {
        console.error('Error fetching forest stats:', error);
        setForestStats({ totalForests: 0, loading: false });
      }
    };

    fetchForestStats();
  }, []);

  // ===============================
  // FETCH TREE STATS (NOUVEAU)
  // ===============================
  useEffect(() => {
    const fetchTreeStats = async () => {
      try {
        const response = await axiosInstance.get('/api/tree/stats');
        setTreeStats({
          totalTrees: response.data.total_trees || 0,
          avgHeight: response.data.avg_height || 0,
          avgDiameter: response.data.avg_diameter || 0,
          treesByForest: response.data.trees_by_forest || [],
          loading: false
        });
      } catch (error) {
        console.error('Error fetching tree stats:', error);
        setTreeStats({ totalTrees: 0, avgHeight: 0, avgDiameter: 0, treesByForest: [], loading: false });
      }
    };

    fetchTreeStats();
  }, []);

  // ===============================
  // FETCH FOREST REPORTS (NOUVEAU)
  // ===============================
  useEffect(() => {
    const fetchForestReports = async () => {
      try {
        const response = await axiosInstance.get('/api/forestreport/stats/compliance');
        setForestReports({
          total: response.data.stats.total || 0,
          compliant: response.data.stats.compliant_100 || 0,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching forest reports:', error);
        setForestReports({ total: 0, compliant: 0, loading: false });
      }
    };

    fetchForestReports();
  }, []);

  // STORES
  const fetchStores = async () => {
    try {
      const response = await axiosInstance.get('/api/store/');
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Combiner les stats dynamiques pour le chart
  useEffect(() => {
    if (!farmerStats.loading && !forestStats.loading) {
      const dynamicData = {
        'Admin': 5,
        'Farmer': farmerStats.totalFarmers,
        'Forester': forestStats.totalForests
      };

      setDynamicUserStats({
        loading: false,
        data: dynamicData
      });
    }
  }, [farmerStats.loading, forestStats.loading, farmerStats.totalFarmers, forestStats.totalForests]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userTypeRes, entitiesRes] = await Promise.all([
          axiosInstance.get("/api/dashboard/users/by-type"),
          axiosInstance.get("/api/dashboard/entities/count"),
        ]);
        setStats({ usersByType: userTypeRes.data, entities: entitiesRes.data, loading: false });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  // Fonction pour récupérer les crops et grades
  useEffect(() => {
    const fetchCropsAndGrades = async () => {
      try {
        const [cropsResponse, gradesResponse] = await Promise.all([
          axiosInstance.get('/api/crop/'),
          axiosInstance.get('/api/grade/')
        ]);

        setCrops(cropsResponse.data.crops);
        setGrades(gradesResponse.data.grades);
      } catch (error) {
        console.error("Error fetching crops or grades:", error);
      }
    };
    fetchCropsAndGrades();
  }, []);

  // Fonction pour récupérer les statistiques des aires
  useEffect(() => {
  const fetchAreaStats = async () => {
    try {
      const ownerTypes = ['farmer', 'forest'];
      const promises = ownerTypes.map(type =>
        axiosInstance.get(`/api/points/getallbyownertype/${type}`)
      );

      const responses = await Promise.all(promises);

      let totalArea = 0;
      let totalPolygons = 0;
      const areaByOwnerType = {};

      responses.forEach((response, index) => {
        const data = response.data;
        const ownerType = ownerTypes[index];

        // ✅ Validation stricte des données
        if (!data.polygons || !Array.isArray(data.polygons) || data.polygons.length === 0) {
          areaByOwnerType[ownerType] = { area: 0, count: 0 };
          return;
        }

        let ownerTypeArea = 0;
        let validPolygonCount = 0;

        data.polygons.forEach(polygon => {
          // ✅ Vérifier que polygon.points existe et contient au moins 3 points
          if (!polygon.points || !Array.isArray(polygon.points) || polygon.points.length < 3) {
            console.warn(`Invalid polygon for ${ownerType}:`, polygon);
            return;
          }

          try {
            const coordinates = polygon.points.map(point => [point.longitude, point.latitude]);
            
            // ✅ Fermer le polygone si nécessaire (premier point = dernier point)
            const firstPoint = coordinates[0];
            const lastPoint = coordinates[coordinates.length - 1];
            
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
              coordinates.push([firstPoint[0], firstPoint[1]]);
            }
            
            // Calculer l'aire avec turf.js
            const area = turf.area({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [coordinates]
              }
            });
            
            ownerTypeArea += area;
            validPolygonCount++;
          } catch (err) {
            console.error(`Error calculating area for ${ownerType} polygon:`, err, polygon);
          }
        });

        areaByOwnerType[ownerType] = {
          area: Math.round(ownerTypeArea * 100) / 100,
          count: validPolygonCount
        };

        totalArea += ownerTypeArea;
        totalPolygons += validPolygonCount;
      });

      setAreaStats({
        totalArea: Math.round(totalArea * 100) / 100,
        polygonCount: totalPolygons,
        areaByOwnerType,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching area stats:', error);
      setAreaStats({
        totalArea: 0,
        polygonCount: 0,
        areaByOwnerType: { 
          farmer: { area: 0, count: 0 }, 
          forest: { area: 0, count: 0 } 
        },
        loading: false
      });
    }
  };

  fetchAreaStats();
}, []);

  if (stats.loading || areaStats.loading || farmerStats.loading || forestStats.loading || dynamicUserStats.loading || treeStats.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Utiliser les données dynamiques pour le chart
  const dynamicLabels = Object.keys(dynamicUserStats.data);
  const dynamicValues = Object.values(dynamicUserStats.data);

  // Données du chart bar avec les vraies données dynamiques
  const barData = {
    labels: dynamicLabels,
    datasets: [
      {
        label: "Users by Type",
        data: dynamicValues,
        backgroundColor: chartColors.slice(0, dynamicLabels.length),
        borderRadius: 12,
        barPercentage: 0.5
      }
    ]
  };

  // ✅ NOUVEAU : Chart pour les arbres par forêt
  const treesPerForestData = {
    labels: treeStats.treesByForest.map(f => f.forest),
    datasets: [{
      label: "Trees per Forest",
      data: treeStats.treesByForest.map(f => f.count),
      backgroundColor: chartColors,
      borderRadius: 10,
    }]
  };

  // ✅ NOUVEAU : Doughnut chart pour Forest Compliance
  const forestComplianceData = {
    labels: ['Compliant', 'Pending Assessment'],
    datasets: [{
      data: [forestReports.compliant, forestReports.total - forestReports.compliant],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(251,191,36,0.8)'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  // Données pour le chart Crops avec Grades
  const cropLabels = crops.map(crop => crop.name);
  const cropWeights = crops.map(crop => crop.weight);
  const cropGradeCounts = crops.map(crop => {
    return grades.filter(grade => grade.crop_id === crop.id).length;
  });

  const cropGradeChartData = {
    labels: cropLabels,
    datasets: [
      {
        label: "Crop Weight (kg)",
        data: cropWeights,
        backgroundColor: "rgba(99,102,241,0.7)",
        borderRadius: 8,
        yAxisID: 'y',
      },
      {
        label: "Number of Grades",
        data: cropGradeCounts,
        backgroundColor: "rgba(248,113,113,0.7)",
        borderRadius: 8,
        yAxisID: 'y1',
      }
    ]
  };

  // Liste des crops spécifiques à afficher avec des valeurs inventées
  const specificCrops = [
    { name: "Cocoa", value: 15 },
    { name: "Coffee Robusta", value: 28 },
    { name: "Coffee Arabica", value: 32 },
    { name: "Oil Palm", value: 45 },
    { name: "Soya Bean", value: 18 },
    { name: "Rubber", value: 38 },
    { name: "Hass Avocado", value: 22 },
    { name: "Macademia", value: 35 },
    { name: "Maize", value: 25 },
    { name: "Sunflower", value: 20 },
    { name: "Sweet Potato", value: 12 },
    { name: "Potato", value: 16 },
    { name: "Tomato", value: 30 },
    { name: "Millet", value: 8 },
    { name: "Sorghum", value: 14 },
    { name: "Groundnut", value: 26 },
    { name: "Ginger", value: 42 },
    { name: "Pineapple", value: 33 }
  ];

  // Line chart avec les crops spécifiques et valeurs inventées
  const lineData = {
    labels: specificCrops.map(crop => crop.name),
    datasets: [{
      label: "Crop Analytics",
      data: specificCrops.map(crop => crop.value),
      borderColor: "#6366F1",
      backgroundColor: "rgba(99,102,241,0.2)",
      tension: 0.3,
      pointRadius: 6,
      pointBackgroundColor: "#6366F1",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      fill: true
    }]
  };

  const chartOptions = (redirectUrl) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    onClick: () => window.location.href = redirectUrl,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: { color: "#f0f0f0" },
        title: {
          display: true,
          text: 'Analytics Value'
        }
      }
    }
  });

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" }
    }
  };

  const cropGradeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" }
    },
    onClick: () => window.location.href = "/crops",
    scales: {
      x: { grid: { display: false } },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: "#f0f0f0" },
        title: {
          display: true,
          text: 'Weight (kg)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: {
          display: true,
          text: 'Number of Grades'
        }
      }
    }
  };

  const ChartCard = ({ title, desc, children, className = "" }) => (
    <div className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer ${className}`}>
      <h3 className="text-sm sm:text-lg font-semibold mb-1 text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{desc}</p>
      <div className="w-full">
        {children}
      </div>
    </div>
  );

  // Composant pour les cartes métriques avec animation - proportionnel
  const MetricCard = ({ title, value, color, icon, onClick }) => (
    <div
      className="rounded-2xl bg-white shadow-md p-4 sm:p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 h-full"
      onClick={onClick}
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm text-gray-400 font-semibold truncate">{title}</h3>
          <p className={`text-lg sm:text-2xl lg:text-3xl font-bold ${color} transition-all duration-300 mt-1`}>
            {value}
          </p>
        </div>
        <div className="text-2xl sm:text-3xl lg:text-4xl opacity-20 ml-2 flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="relative">
        
        {/* Section des métriques - Responsive grid avec nouvelles métriques forest */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6">
          <MetricCard
            title="Total Users Assets"
            value={dynamicValues.reduce((a, b) => a + b, 0)}
            color="text-indigo-500"
            icon="👥"
            onClick={() => window.location.href = '/usermanager'}
          />
          <MetricCard
            title="Total Stores"
            value={stores.length}
            color="text-indigo-500"
            icon="🏬"
            onClick={() => window.location.href = '/storeProductManager'}
          />
          <MetricCard
            title="Total Farmers"
            value={farmerStats.totalFarmers}
            color="text-emerald-500"
            icon="🌱"
            onClick={() => window.location.href = '/farmmanager'}
          />
          <MetricCard
            title="Total Forests"
            value={forestStats.totalForests}
            color="text-green-600"
            icon="🌲"
            onClick={() => window.location.href = '/forestpage'}
          />
          <MetricCard
            title="Total Trees"
            value={treeStats.totalTrees}
            color="text-green-500"
            icon="🌳"
            onClick={() => window.location.href = '/treemanager'}
          />
          <MetricCard
            title="Total Polygons"
            value={areaStats.polygonCount}
            color="text-pink-500"
            icon="📐"
            onClick={() => window.location.href = '/mapviewall'}
          />
        </div>

        {/* Nouvelle section: Forest & Tree Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-gradient-to-br from-white-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-800">🌲 Forest Health</h3>
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                {forestReports.total > 0 ? Math.round((forestReports.compliant / forestReports.total) * 100) : 0}%
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Reports</span>
                <span className="text-lg font-bold text-gray-800">{forestReports.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Compliant</span>
                <span className="text-lg font-bold text-green-600">{forestReports.compliant}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-lg font-bold text-yellow-600">{forestReports.total - forestReports.compliant}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
            <h3 className="text-lg font-bold text-blue-800 mb-4">🌳 Tree Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Height</span>
                <span className="text-lg font-bold text-gray-800">{treeStats.avgHeight.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Diameter</span>
                <span className="text-lg font-bold text-gray-800">{treeStats.avgDiameter.toFixed(1)}cm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Trees</span>
                <span className="text-lg font-bold text-blue-600">{treeStats.totalTrees}</span>
              </div>
            </div>
          </div>

         <div className="bg-gradient-to-br from-white-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-purple-100">
  <h3 className="text-lg font-bold text-purple-800 mb-4">📊 Coverage</h3>
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">Total Area</span>
      <span className="text-lg font-bold text-gray-800">
        {formatArea(areaStats.totalArea)}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">Farmer Area</span>
      <span className="text-lg font-bold text-emerald-600">
        {formatArea(areaStats.areaByOwnerType['farmer']?.area)}
      </span>
    </div>
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">Forest Area</span>
      <span className="text-lg font-bold text-green-600">
        {formatArea(areaStats.areaByOwnerType['forest']?.area)}
      </span>
    </div>
  </div>
</div>
        </div>

        {/* Section des fonctionnalités et graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
          
          {/* Smart Features Card */}
          <div className="md:col-span-1">
            <div
              className="rounded-2xl bg-white shadow-lg hover:shadow-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] border border-gray-100 overflow-hidden h-full"
              onClick={() => window.location.href = '/featuresManager'}
            >
              <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-full -translate-y-8 translate-x-8 opacity-60"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-1">Smart Features</h3>
                    <p className="text-xs text-gray-500">Advanced agricultural & forest tools</p>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Active & Running</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full p-2 sm:p-3 text-white text-lg sm:text-xl shadow-lg">
                    ⚡
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: "📲", text: "QR Codes", desc: "Track products" },
                    { icon: "📊", text: "EUDR Reports", desc: "Compliance" },
                    { icon: "🌦️", text: "Weather", desc: "Live alerts" },
                    { icon: "🌲", text: "Forest Track", desc: "Tree monitoring" }
                  ].map((feature, index) => (
                    <div key={index} className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 transition-all duration-200 group">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm sm:text-base group-hover:scale-110 transition-transform duration-200">{feature.icon}</span>
                        <span className="text-xs font-semibold text-gray-800">{feature.text}</span>
                      </div>
                      <span className="text-xs text-gray-500 ml-6">{feature.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">4 Tools Available</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-60"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users by Type Chart */}
          <div className="md:col-span-1">
            <ChartCard
              title="Users by Type"
              desc="Dynamic user distribution"
              className="h-full"
            >
              <div className="h-64 sm:h-80">
                <Bar data={barData} options={chartOptions("/usermanager")} />
              </div>
            </ChartCard>
          </div>

          {/* Trees per Forest Chart (NOUVEAU) */}
          <div className="md:col-span-1">
            <ChartCard
              title="Trees per Forest"
              desc={`Distribution across ${treeStats.treesByForest.length} forests`}
              className="h-full"
            >
              <div className="h-64 sm:h-80">
                {treeStats.treesByForest.length > 0 ? (
                  <Bar data={treesPerForestData} options={chartOptions("/treemanager")} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No tree data available
                  </div>
                )}
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Forest Compliance & Crop Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Forest Compliance Doughnut (NOUVEAU) */}
          <ChartCard
            title="Forest EUDR Compliance"
            desc={`${forestReports.total} total reports analyzed`}
            className="h-full"
          >
            <div className="h-64 sm:h-80">
              {forestReports.total > 0 ? (
                <Doughnut data={forestComplianceData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No forest reports available
                </div>
              )}
            </div>
          </ChartCard>

          {/* Line chart avec les crops spécifiques */}
          <ChartCard
            title="Crop Analytics Trend"
            desc={`Analytics for ${specificCrops.length} predefined crops`}
            className="h-full"
          >
            <div className="h-64 sm:h-80">
              <Line data={lineData} options={chartOptions("/cropmanager")} />
            </div>
          </ChartCard>
        </div>

        {/* Map Section - Responsive */}
        <div className="relative">
          <div
            className="rounded-2xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm border border-white/20"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Agricultural & Forest Plots Visualization</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 font-medium">
              Live visualization of farms and forests in hexagonal shapes
            </p>
            <div className="rounded-xl overflow-hidden border-2 border-gradient-to-r from-pink-300 to-purple-300 w-full h-[50vh] sm:h-[60vh] min-h-[300px] sm:min-h-[400px]">
              <MapboxExample
                ownerType="farmer"
                showControls={false}
                height="100%"
                styleType="light"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}