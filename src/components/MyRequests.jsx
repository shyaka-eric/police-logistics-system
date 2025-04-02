import React, { useEffect, useState } from "react";
import axios from "axios";
import SideBar from "./SideBar";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import "datatables.net-responsive";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem("token");
      try {
        console.log("🔍 Fetching user requests...");
        const response = await axios.get("http://localhost:5000/api/user/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ API Response:", response.data);
        setRequests(response.data);
      } catch (error) {
        console.error("❌ Error fetching requests:", error);
      }
    };

    fetchRequests();
  }, []);

  // Initialize DataTable after requests data is loaded
  useEffect(() => {
    if (requests.length > 0) {
      setTimeout(() => {
        if (!$.fn.DataTable.isDataTable("#example")) {
          $("#example").DataTable({
            destroy: true, // Prevents duplicate initialization
            responsive: true,
            paging: true,
            searching: true,
            ordering: true,
          });
        }
      }, 500);
    }
  }, [requests]); // ✅ Runs when `requests` data updates

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar />

      <div className="flex-1 p-6">
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">
            {user ? `User, ${user.name} 🎉` : "Welcome!"}
          </h1>
          <p className="text-gray-600">{user ? `Role: ${user.role}` : "Loading..."}</p>
        </div>

        <div className="p-6 bg-white shadow-md rounded-lg mt-3">
          <h2 className="text-2xl font-semibold mb-4">My Requests</h2>

          {requests.length > 0 ? (
            <table id="example" className="display nowrap w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Title</th>
                  <th className="p-2 border">Category</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="text-center">
                    <td className="p-2 border">{req.title}</td>
                    <td className="p-2 border">{req.category}</td>
                    <td className="p-2 border">{req.status}</td>
                    <td className="p-2 border">{new Date(req.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No requests available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRequests;
