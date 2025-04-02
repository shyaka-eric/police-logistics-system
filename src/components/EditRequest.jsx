import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditRequest = ({ requestId }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "General",
    type: "new-item",
    status: "Pending",
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
            `http://localhost:5000/api/requests/${requestId}`,
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

      // If there's a requestId, we're updating the request, otherwise creating a new one
      const response = requestId
        ? await axios.put(
            `http://localhost:5000/api/requests/${requestId}`,
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        : await axios.post(
            "http://localhost:5000/api/requests",
            formData,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

      console.log("✅ Response:", response.data); // ✅ Log response from backend
      setMessage(requestId ? "Request updated successfully!" : "Request submitted successfully!");
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        category: "General",
        type: "new-item",
        status: "Pending",
      });

      navigate("/requests");
      
    } catch (error) {
      console.error("❌ Request Submission Error:", error);
      setMessage("Failed to submit request. Please check your network or try again later.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {requestId ? "Update Request" : "Submit a Request"}
      </h2>

      {message && (
        <p className={`text-sm ${message.includes("successfully") ? "text-green-500" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Title */}
        <div>
          <label className="block text-gray-700">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Request Description */}
        <div>
          <label className="block text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          ></textarea>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-gray-700">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="General">General</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Logistics">Logistics</option>
            <option value="HR">HR</option>
          </select>
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-gray-700">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="new-item">New item</option>
            <option value="repair">Repair</option>
          </select>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="under-repair">Under Repair</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {requestId ? "Update Request" : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default EditRequest;
