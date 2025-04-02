import React, { useEffect, useState } from "react";
import axios from "axios";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import "datatables.net-responsive";
import SideBar from "./SideBar";

const StockManagement = () => {
  const [stock, setStock] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchStock = async () => {
      const token = localStorage.getItem("token");
      try {
        console.log("🔍 Fetching stock data...");
        const response = await axios.get("http://localhost:5000/api/stock", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("✅ API Response:", response.data);
        setStock(response.data);
      } catch (error) {
        console.error("❌ Error fetching stock:", error);
      }
    };

    fetchStock();
  }, []);

  // Initialize DataTable when stock data updates
  useEffect(() => {
    if (stock.length > 0) {
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
  }, [stock]); // ✅ Runs when stock data updates

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SideBar />
      <div className="flex-1 p-6">
        <div className="p-6 bg-white shadow-md rounded-lg mt-3">
          <h2 className="text-2xl font-semibold mb-4">Stock Management</h2>
          {stock.length > 0 ? (
            <table id="example" className="table table-striped table-bordered dt-responsive nowrap">
              <thead>
                <tr className="bg-gray-100">
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.category}</td>
                    <td>{item.status}</td>
                    {user && (user.role === "admin" || user.role === "LogisticsOfficer") && (
                        
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
            <p className="text-gray-500">No stock data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
