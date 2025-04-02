import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SideBar from "./components/SideBar";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import "datatables.net-responsive";

const Requests = () => {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  const userIn = JSON.parse(localStorage.getItem("user"));

  // Fetch user & requests
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }

    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ API Response:", response.data);
        setRequests(response.data.requests);
      } catch (error) {
        console.error("❌ Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, [navigate]);

  // Initialize DataTable after requests are loaded
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
      await axios.delete(`http://localhost:5000/api/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch updated requests after deletion
      const updatedResponse = await axios.get("http://localhost:5000/api/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(updatedResponse.data.requests);
    } catch (error) {
      console.error("❌ Error deleting request:", error.response ? error.response.data : error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">
            {user ? `User, Patrick 🎉` : "Welcome!"}
          </h1>
          <p className="text-gray-600">{user ? `Role: ${user.role}` : "Loading..."}</p>
        </div>

        {/* Requests Table */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Requests</h2>
          <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
            {requests.length > 0 ? (
              <table id="example" className="display nowrap w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Title</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Priority</th>
                    <th className="px-4 py-2 text-left">Category</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    {user && (user.role === "admin") && (<th className="px-4 py-2 text-left">Actions</th>)}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b">
                      <td className="px-4 py-2">{request.title}</td>
                      <td className="px-4 py-2">{request.description}</td>
                      <td className="px-4 py-2">{request.priority}</td>
                      <td className="px-4 py-2">{request.category}</td>
                      <td className="px-4 py-2">{request.status}</td>
                      {user && (user.role === "admin") && (
                        
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleEdit(request.id)}
                          className="text-blue-500 hover:text-blue-700 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </td>
                      )}
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

export default Requests;
