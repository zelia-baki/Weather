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
];

export default function Dashboard() {
  const [stats, setStats] = useState({ usersByType: {}, entities: {}, loading: true });
  const [areaStats, setAreaStats] = useState({ totalArea: 0, polygonCount: 0, areaByOwnerType: {}, loading: true });
  const [farmerStats, setFarmerStats] = useState({ totalFarmers: 0, loading: true });
  const [forestStats, setForestStats] = useState({ totalForests: 0, loading: true });
  const [dynamicUserStats, setDynamicUserStats] = useState({ loading: true, data: {} });
  const [crops, setCrops] = useState([]);
  const [grades, setGrades] = useState([]);

  // Fonction pour récupérer le nombre de fermiers
  useEffect(() => {
    const fetchFarmerStats = async () => {
      try {
        // Récupérer la première page pour obtenir le total
        const response = await axiosInstance.get('/api/farm/?page=1');
        
        let totalFarmers = 0;
        
        if (response.data.total) {
          // Si l'API retourne directement le total
          totalFarmers = response.data.total;
        } else if (response.data.total_pages && response.data.farms) {
          // Si on doit calculer à partir du nombre de pages
          const totalPages = response.data.total_pages;
          
          if (totalPages === 1) {
            totalFarmers = response.data.farms.length;
          } else {
            // Récupérer toutes les pages pour compter exactement
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
          // Fallback: compter les fermiers de la première page seulement
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

  // Fonction pour récupérer le nombre de forestiers
  useEffect(() => {
    const fetchForestStats = async () => {
      try {
        // Récupérer la première page pour obtenir le total
        const response = await axiosInstance.get('/api/forest/?page=1');
        
        let totalForests = 0;
        
        if (response.data.total) {
          // Si l'API retourne directement le total
          totalForests = response.data.total;
        } else if (response.data.total_pages && response.data.forests) {
          // Si on doit calculer à partir du nombre de pages
          const totalPages = response.data.total_pages;
          
          if (totalPages === 1) {
            totalForests = response.data.forests.length;
          } else {
            // Récupérer toutes les pages pour compter exactement
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
          // Fallback: compter les forestiers de la première page seulement
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

  // Combiner les stats dynamiques pour le chart
  useEffect(() => {
    if (!farmerStats.loading && !forestStats.loading) {
      const dynamicData = {
        'Admin': 5, // Nombre constant d'admins
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
        const ownerTypes = ['farmer', 'government', 'company'];
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
          
          if (data.polygons && data.polygons.length > 0) {
            let ownerTypeArea = 0;
            
            data.polygons.forEach(polygon => {
              const coordinates = polygon.points.map(point => [point.longitude, point.latitude]);
              const area = turf.area({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [coordinates]
                }
              });
              ownerTypeArea += area;
            });
            
            areaByOwnerType[ownerType] = {
              area: Math.round(ownerTypeArea * 100) / 100,
              count: data.polygons.length
            };
            
            totalArea += ownerTypeArea;
            totalPolygons += data.polygons.length;
          }
        });
        
        setAreaStats({
          totalArea: Math.round(totalArea * 100) / 100,
          polygonCount: totalPolygons,
          areaByOwnerType,
          loading: false
        });
        
      } catch (error) {
        console.error('Error fetching area stats:', error);
        setAreaStats(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchAreaStats();
  }, []);

  if (stats.loading || areaStats.loading || farmerStats.loading || forestStats.loading || dynamicUserStats.loading) {
    return (
      <div className="p-6 text-gray-400 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
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

  // Données du doughnut avec les vraies données dynamiques
  const doughnutData = {
    labels: dynamicLabels,
    datasets: [{ 
      data: dynamicValues, 
      backgroundColor: chartColors.slice(0, dynamicLabels.length), 
      hoverOffset: 15 
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
    datasets:[{
      label:"Crop Analytics",
      data: specificCrops.map(crop => crop.value),
      borderColor:"#6366F1",
      backgroundColor:"rgba(99,102,241,0.2)",
      tension:0.3,
      pointRadius:6,
      pointBackgroundColor:"#6366F1",
      pointBorderColor:"#fff",
      pointBorderWidth:2,
      fill:true
    }]
  };

  const chartOptions = (redirectUrl) => ({
    responsive:true,
    plugins:{ 
      legend:{ position:"top" },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    onClick: () => window.location.href = redirectUrl,
    scales:{ 
      x:{ 
        grid:{ display:false },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }, 
      y:{ 
        grid:{ color:"#f0f0f0" },
        title: {
          display: true,
          text: 'Analytics Value'
        }
      } 
    }
  });

  const cropGradeChartOptions = {
    responsive: true,
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

  const ChartCard = ({ title, desc, children }) => (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition cursor-pointer">
      <h3 className="text-lg font-semibold mb-1 text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{desc}</p>
      {children}
    </div>
  );

  // Composant pour les cartes métriques avec animation
  const MetricCard = ({ title, value, color, icon, onClick }) => (
    <div 
      className={`rounded-3xl bg-white shadow-md p-6 hover:shadow-xl transition cursor-pointer transform hover:scale-105`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-400 font-semibold">{title}</h3>
          <p className={`text-3xl font-bold ${color} transition-all duration-300`}>
            {value}
          </p>
        </div>
        <div className={`text-4xl opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Nouvelle carte pour les fonctionnalités avancées
  const FeatureCard = ({ title, features, color, icon, onClick }) => (
    <div 
      className={`rounded-3xl bg-white shadow-md p-6 hover:shadow-xl transition cursor-pointer transform hover:scale-105 border-l-4 ${color}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm text-gray-400 font-semibold mb-2">{title}</h3>
          <div className="space-y-1">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                {feature}
              </div>
            ))}
          </div>
        </div>
        <div className={`text-3xl opacity-20`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 grid gap-6 grid-cols-1 md:grid-cols-4 bg-gray-50 min-h-screen">
      {/* Metric Cards */}
      <MetricCard
        title="Total Users"
        value={dynamicValues.reduce((a,b)=>a+b,0)}
        color="text-indigo-500"
        icon="👥"
        onClick={() => window.location.href = '/users'}
      />
      
      <MetricCard
        title="Total Farmers"
        value={farmerStats.totalFarmers}
        color="text-emerald-500"
        icon="🌱"
        onClick={() => window.location.href = '/farms'}
      />
      
      <MetricCard
        title="Total Polygons"
        value={areaStats.polygonCount}
        color="text-pink-500"
        icon="📐"
        onClick={() => window.location.href = '/polygons'}
      />
      
      <MetricCard
        title="Total Area"
        value={areaStats.totalArea 
          ? areaStats.totalArea >= 10000 
            ? `${(areaStats.totalArea / 10000).toFixed(2)} ha`
            : `${areaStats.totalArea.toFixed(2)} m²`
          : '0 m²'
        }
        color="text-green-500"
        icon="🏞️"
        onClick={() => window.location.href = '/areas'}
      />

      {/* Nouvelle carte pour les fonctionnalités avancées - prend 2 colonnes */}
     <div className="relative">
  <div 
    className="rounded-2xl bg-white shadow-lg hover:shadow-xl p-6 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] border border-gray-100 overflow-hidden"
    onClick={() => window.location.href = '/features'}
  >
    {/* Subtle background pattern */}
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-full -translate-y-8 translate-x-8 opacity-60"></div>
    
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Smart Features</h3>
          <p className="text-xs text-gray-500">Advanced agricultural tools</p>
          <div className="flex items-center mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Active & Running</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full p-3 text-white text-xl shadow-lg">
          ⚡
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: "🔲", text: "QR Codes", desc: "Track crops" },
          { icon: "📊", text: "ETC & ET0", desc: "Smart irrigation" },
          { icon: "🌦️", text: "Weather", desc: "Live alerts" },
          { icon: "🐛", text: "Pest Control", desc: "Early warning" }
        ].map((feature, index) => (
          <div key={index} className="flex flex-col space-y-1 p-3 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50 transition-all duration-200 group">
            <div className="flex items-center space-x-2">
              <span className="text-base group-hover:scale-110 transition-transform duration-200">{feature.icon}</span>
              <span className="text-xs font-semibold text-gray-800">{feature.text}</span>
            </div>
            <span className="text-xs text-gray-500 ml-6">{feature.desc}</span>
          </div>
        ))}
      </div>
      
      {/* Bottom accent */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">4 Tools Available</span>
          <div className="flex space-x-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-60"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Users by Type */}
      <ChartCard
        title="Users by Type"
        desc="Shows the dynamic number of users per category (Farmers & Foresters: real data, Admin: 5)."
      >
        <Bar data={barData} options={chartOptions("/users/types")} />
      </ChartCard>


      {/* Line chart avec les crops spécifiques */}
      <div className="md:col-span-2">
        <ChartCard
          title={
            <div className="flex items-center justify-between">
              <span>Crop Analytics Trend</span>
            </div>
          }
          desc={`Showing analytics for ${specificCrops.length} predefined crops with demo values.`}
        >
          <div className="h-[350px]">
            <Line data={lineData} options={chartOptions("/crops")} />
          </div>
        </ChartCard>
      </div>

      {/* Map Section */}
      <div className="md:col-span-4">
        <div 
          className="rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 backdrop-blur-sm border border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p className="text-sm text-gray-600 mb-4 font-medium">
            Live visualization of agricultural plots in hexagonal shapes
          </p>
          <div 
            className="rounded-xl overflow-hidden border-2 border-gradient-to-r from-pink-300 to-purple-300"
            style={{ height: '500px' }}
          >
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
  );
}