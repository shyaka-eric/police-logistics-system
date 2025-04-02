import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SideBar from "./components/SideBar";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import "datatables.net-responsive";

const UserLogs = () => {
  const [logs, setLogs] = useState([]);
  const [requests, setRequests] = useState([]); // Track requests for DataTable initialization
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/api/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLogs(response.data);  // Store the fetched logs
        setRequests(response.data); // Set requests to trigger DataTable update
      } catch (error) {
        console.error("❌ Error fetching logs:", error);
      }
    };
    
    fetchLogs();
  }, []);

  // Initialize DataTable after logs are fetched
  useEffect(() => {
    if (requests.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#example")) {
          $("#example").DataTable({
            destroy: true, // Prevent duplicate initialization
            responsive: true,
            paging: true,
            searching: true,
            ordering: true,
          });
        }
      }, 500);
    }
  }, [requests]); // ✅ Runs when requests data updates

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleEdit = (id) => {
    navigate(`/edit-request/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch updated logs after deletion
      const updatedResponse = await axios.get("http://localhost:5000/api/logs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(updatedResponse.data.logs); // Corrected typo
    } catch (error) {
      console.error("❌ Error deleting request:", error.response ? error.response.data : error);
    }
  };

  const user = JSON.parse(localStorage.getItem("user")); // Fetch user details from localStorage
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">
            {user ? `User, ${user.name} 🎉` : "Welcome!"}
          </h1>
          <p className="text-gray-600">{user ? `Role: ${user.role}` : "Loading..."}</p>
        </div>

        {/* Requests Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Requests</h2>
          <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
            {logs.length > 0 ? (
              <table id="example" className="display nowrap w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">User ID</th>
                    <th className="p-2 border">Action</th>
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-2 border">{log.userId}</td>
                      <td className="p-2 border">{log.action}</td>
                      <td className="p-2 border">{log.description}</td>
                      <td className="p-2 border">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No requests found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogs;
