import React, { useEffect, useState } from "react";
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

  if (stats.loading) return <div className="p-6 text-gray-400">Loading dashboard...</div>;

  const labels = Object.keys(stats.usersByType);
  const values = Object.values(stats.usersByType);

  // Chart data
  const barData = {
    labels,
    datasets: [
      { label: "Users by Type", data: values, backgroundColor: chartColors, borderRadius: 12, barPercentage: 0.5 }
    ]
  };
  const doughnutData = {
    labels,
    datasets: [{ data: values, backgroundColor: chartColors, hoverOffset: 15 }]
  };
  const lineData = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun"],
    datasets:[{
      label:"New Users",
      data:[5,15,10,25,20,40],
      borderColor:"#6366F1",
      backgroundColor:"rgba(99,102,241,0.2)",
      tension:0.3,
      pointRadius:4,
      fill:true
    }]
  };
  const radarData = {
    labels,
    datasets:[{
      label:"Engagement",
      data:values,
      backgroundColor:"rgba(168,85,247,0.2)",
      borderColor:"#A855F7",
      pointBackgroundColor:"#A855F7",
      pointHoverBackgroundColor:"#fff"
    }]
  };

  // Options with redirect on click
  const chartOptions = (redirectUrl) => ({
    responsive:true,
    plugins:{ legend:{ position:"top" } },
    onClick: () => window.location.href = redirectUrl,
    scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:"#f0f0f0" } } }
  });

  // Card component with hover effect
  const ChartCard = ({ title, desc, children }) => (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition cursor-pointer">
      <h3 className="text-lg font-semibold mb-1 text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{desc}</p>
      {children}
    </div>
  );

  return (
    <div className="p-6 grid gap-6 grid-cols-1 md:grid-cols-3 bg-gray-50 min-h-screen">
      {/* Metric Cards */}
      <div className="rounded-3xl bg-white shadow-md p-6 hover:shadow-xl transition text-center">
        <h3 className="text-sm text-gray-400 font-semibold">Total Users</h3>
        <p className="text-3xl font-bold text-indigo-500">
          {values.reduce((a,b)=>a+b,0)}
        </p>
      </div>
      <div className="rounded-3xl bg-white shadow-md p-6 hover:shadow-xl transition text-center">
        <h3 className="text-sm text-gray-400 font-semibold">Total Farms</h3>
        <p className="text-3xl font-bold text-green-500">{stats.entities.farms || 0}</p>
      </div>
      <div className="rounded-3xl bg-white shadow-md p-6 hover:shadow-xl transition text-center">
        <h3 className="text-sm text-gray-400 font-semibold">Total Entities</h3>
        <p className="text-3xl font-bold text-pink-500">{Object.values(stats.entities).reduce((a,b)=>a+b,0)}</p>
      </div>

      {/* Line chart */}
      <div className="md:col-span-3">
        <ChartCard
          title="User Growth Over Time"
          desc="Tracks how user registrations evolve month by month."
        >
          <div className="h-[300px]">
            <Line data={lineData} options={chartOptions("/users/growth")} />
          </div>
        </ChartCard>
      </div>

      {/* Bar chart */}
      <ChartCard
        title="Users by Type"
        desc="Shows the number of users per category (Admin, Farmer, etc.)."
      >
        <Bar data={barData} options={chartOptions("/users/types")} />
      </ChartCard>

      {/* Doughnut chart */}
      <ChartCard
        title="User Distribution"
        desc="Highlights the proportion of each user category."
      >
        <Doughnut data={doughnutData} options={chartOptions("/users/distribution")} />
      </ChartCard>

      {/* Radar chart */}
      <ChartCard
        title="Engagement Radar"
        desc="Compares engagement levels across different categories."
      >
        <Radar data={radarData} options={chartOptions("/users/engagement")} />
      </ChartCard>

      {/* Action buttons */}
      <div className="md:col-span-3 flex gap-4 bg-white p-6 rounded-3xl shadow-lg hover:shadow-2xl transition">
        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2 rounded-xl text-white hover:opacity-90 transition">
          Add User
        </button>
        <button className="border border-gray-300 px-6 py-2 rounded-xl hover:bg-gray-100 transition">
          Export
        </button>
      </div>
    </div>
  );
}
