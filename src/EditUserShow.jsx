import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // import useParams to get the requestId
import { FiHome, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import EditUser from "./components/EditUser"; // Import your EditRequest component
import { Sidebar } from "./components/Sidebar";

const EditUserShow = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { requestId } = useParams(); // Get the requestId from URL params

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
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">User, {user?.name} 🎉</h1>
          <p className="text-gray-600">Role: {user?.role}</p>
        </div>

        <div className="mt-8">
          {/* Pass requestId to EditRequest component */}
          <EditUser requestId={requestId} />
        </div>
      </div>
    </div>
  );
};

export default EditUserShow;
