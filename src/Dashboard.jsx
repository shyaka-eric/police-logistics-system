import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import SideBar from "./components/SideBar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Simulated static data
  const stats = [
    { title: "Total Orders", value: 120, color: "bg-blue-500" },
    { title: "Pending Requests", value: 8, color: "bg-yellow-500" },
    { title: "Completed Deliveries", value: 95, color: "bg-green-500" },
    { title: "Total Users", value: 500, color: "bg-purple-500" },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SideBar/>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">User, {user?.name} 🎉</h1>
          <p className="text-gray-600">Role: {user?.role}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.color} text-white p-5 rounded-lg shadow-md`}
            >
              <h2 className="text-lg font-semibold">{stat.title}</h2>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity</h2>
          <ul className="text-gray-600">
            <li className="mb-2">✔ Order #12345 has been delivered</li>
            <li className="mb-2">🔄 User "Michael" updated his profile</li>
            <li className="mb-2">📦 5 new orders placed today</li>
            <li className="mb-2">⚠ 2 pending requests require approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
