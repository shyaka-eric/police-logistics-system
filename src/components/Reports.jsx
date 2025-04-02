import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import SideBar from "./SideBar";

// Register Chart.js components
Chart.register(...registerables);

const Reports = () => {
  const [user, setUser] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/api/reports", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ API Response:", response.data);
        setReportData(response.data);
      } catch (error) {
        console.error("❌ Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Chart Data
  const chartData = {
    labels: reportData.map((r) => r.category),
    datasets: [
      {
        label: "Requests per Category",
        data: reportData.map((r) => r.count),
        backgroundColor: ["#3B82F6", "#FACC15", "#10B981"],
      },
    ],
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...reportData.map(r => r.count)) + 2, // Dynamic max limit
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">
            {user ? `User, ${user.name} 🎉` : "Welcome!"}
          </h1>
          <p className="text-gray-600">{user ? `Role: ${user.role}` : "Loading..."}</p>
        </div>

        <div className="p-6 bg-white shadow-md rounded-lg mt-3">
          <h2 className="text-2xl font-semibold mb-4">Reports & Analytics</h2>
          <div className="h-64"> {/* ✅ Set a max height */}
            {loading ? (
              <p className="text-gray-500">Loading data...</p>
            ) : reportData.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
