import React, { useState, useEffect } from "react";
import axios from "axios";

const RequestForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "General",
    type: "new-item",
    status: "Pending",
  });

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState([]); // Store available items fetched from the database

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/items");
        if (response.data && Array.isArray(response.data.items)) {
          setItems(response.data.items); // Accessing the 'items' array inside the response
        } else {
          console.error("Expected an array, but received:", response.data);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchItems();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Unauthorized - Please log in again.");
        setIsSubmitting(false);
        return;
      }

      console.log("🔹 Sending Request:", formData);

      const response = await axios.post(
        "http://localhost:5000/api/requests",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Response:", response.data);
      setMessage("Request submitted successfully!");
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        category: "General",
        type: "new-item",
        status: "Pending",
      });
    } catch (error) {
      console.error("❌ Request Submission Error:", error);
      setMessage("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Submit a Request</h2>

      {message && (
        <p className={`text-${message.includes('successfully') ? 'green' : 'red'}-500`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Title - Item Name Dropdown */}
        <div>
          <label className="block text-gray-700">Item Name</label>
          <select
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
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
          disabled={isSubmitting}
          className={`w-full py-2 rounded-lg ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white transition`}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default RequestForm;
