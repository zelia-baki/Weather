import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    usersByType: {},
    entities: {},
    loading: true,
  });

  const fetchDashboardStats = async () => {
    try {
      const [userTypeRes, entitiesRes] = await Promise.all([
        axiosInstance.get("/api/dashboard/users/by-type"),
        axiosInstance.get("/api/dashboard/entities/count"),
      ]);

      setStats({
        usersByType: userTypeRes.data,
        entities: entitiesRes.data,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const activityData = {
    labels: Object.keys(stats.usersByType),
    datasets: [
      {
        label: "Users by Type",
        data: Object.values(stats.usersByType),
        backgroundColor: "#4F46E5",
        borderRadius: 4,
      },
    ],
  };

  if (stats.loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 grid gap-6 grid-cols-1 md:grid-cols-3">
      {/* Metric Cards */}
      <div className="rounded-2xl shadow p-4 bg-white">
        <h2 className="text-lg font-semibold">Total Users</h2>
        <p className="text-2xl font-bold">
          {Object.values(stats.usersByType).reduce((acc, val) => acc + val, 0)}
        </p>
      </div>
      <div className="rounded-2xl shadow p-4 bg-white">
        <h2 className="text-lg font-semibold">Total Farms</h2>
        <p className="text-2xl font-bold">{stats.entities.farms || 0}</p>
      </div>
      <div className="rounded-2xl shadow p-4 bg-white">
        <h2 className="text-lg font-semibold">Users by Type</h2>
        <div className="h-[100px]">
          <Bar data={activityData} options={options} />
        </div>
      </div>

      {/* Actions Panel */}
      <div className="md:col-span-3 rounded-2xl shadow p-4 bg-white flex gap-4">
        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Add User
        </button>
        <button className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100">
          Export
        </button>
      </div>
    </div>
  );
}
