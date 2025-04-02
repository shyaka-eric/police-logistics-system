import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditUser = ({ requestId }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "UnitLeader",
    status:"Inactive"
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch the existing data if it's an update
  useEffect(() => {
    const fetchRequestData = async () => {
      if (requestId) {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            setMessage("Unauthorized - Please log in again.");
            return;
          }

          const response = await axios.get(
            `http://localhost:5000/api/users/${requestId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setFormData(response.data); // Set the form with existing request data
        } catch (error) {
          console.error("❌ Error fetching request data:", error);
          setMessage("Failed to fetch request data. Please try again later.");
        }
      }
    };

    fetchRequestData();
  }, [requestId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Reset any previous messages

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Unauthorized - Please log in again.");
        return;
      }

      console.log("🔹 Sending Request:", formData); // ✅ Log form data before sending

      // If there's a requestId, we're updating the request; otherwise, we're creating a new one
      const response = requestId
        ? await axios.put(
            `http://localhost:5000/api/users/${requestId}`,
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        : await axios.post(
            "http://localhost:5000/api/users",
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

      console.log("✅ Response:", response.data); // ✅ Log response from backend
      setMessage(requestId ? "User updated successfully!" : "User created successfully!");
      setFormData({
        name: "",
        email: "",
        role: "UnitLeader",
        status: "Inactive"
      });

      navigate("/users");
    } catch (error) {
      console.error("❌ Request Submission Error:", error);

      if (error.response) {
        // API responded with an error
        setMessage(error.response.data.error || "Something went wrong.");
      } else if (error.request) {
        // No response received
        setMessage("No response from server. Please check your connection.");
      } else {
        // Other errors
        setMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {requestId ? "Update User" : "Create User"}
      </h2>

      {message && (
        <p className={`text-sm ${message.includes("successfully") ? "text-green-500" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <label className="block text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            readOnly
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-gray-700">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="admin">Admin</option>
            <option value="UnitLeader">Unit Leader</option>
            <option value="LogisticsOfficer">Logistics Officer</option>
          </select>
        </div>


        {/* Status Selection */}
        <div>
          <label className="block text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status || "Inactive"}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Inactive">Inactive</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {requestId ? "Update User" : "Create User"}
        </button>
      </form>
    </div>
  );
};

export default EditUser;
