import React, { useState, useEffect } from "react";
import axios from "axios";
import SideBar from "./SideBar"; // Ensure this component is implemented correctly

const NewInStock = () => {
  const [formData, setFormData] = useState({
    name: "",           // Item name
    category: "",       // Item category
    quantity: 0,        // Item quantity
    status: "in-stock",// Item status (Available or other)
  });

  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);  // Ensure user state is properly initialized
  const [categories, setCategories] = useState([]); // State for categories

  // Fetch user from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/categories");
        if (response.data && Array.isArray(response.data.categories)) {
          setCategories(response.data.categories);
        } else {
          console.error("Expected an array, but received:", response.data.categories);
        }
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Unauthorized - Please log in again.");
        return;
      }

      console.log("🔹 Sending Stock Data:", formData); // ✅ Log form data before sending

      const response = await axios.post(
        "http://localhost:5000/api/stock",  // Update URL for stock API
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Response:", response.data); // ✅ Log response from backend
      setMessage("Item added to stock successfully!");
      setFormData({
        name: "",
        category: "",
        quantity: 0,
        status: "in-stock",
      });
    } catch (error) {
      console.error("❌ Stock Submission Error:", error);
      setMessage(error.response?.data?.error || "Failed to add item to stock.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <SideBar />
      <div className="flex-1 p-6">
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">
            {user ? `Welcome, ${user.name} 🎉` : "Welcome!"}
          </h1>
          <p className="text-gray-600">{user ? `Role: ${user.role}` : "Loading..."}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md mt-3 ">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Item to Stock</h2>

          {message && <p className="text-green-500">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Item Name */}
            <div>
              <label className="block text-gray-700">Item Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-gray-700">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-gray-700">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
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
                <option value="in-stock">In stock</option>
                <option value="under-repair">Under repair</option>
                <option value="Damaged">Damaged</option>
                <option value="in-use">In use</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add to Stock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewInStock;