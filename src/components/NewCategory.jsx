import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";

const NewCategory = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]); // ✅ Stores fetched categories
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUser(storedUser);
    }
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (response.data) {
        setCategories(response.data);
      } else {
        console.error("Failed to fetch categories:", response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setMessage("Failed to fetch categories");
    }
  };

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

      if (editMode) {
        // ✅ Update category
        await axios.put(
          `http://localhost:5000/api/categories/${editId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage("Category updated successfully!");
      } else {
        // ✅ Add new category
        await axios.post("http://localhost:5000/api/categories", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Category added successfully!");
      }

      setFormData({ name: "", description: "", createdAt: "", updatedAt: "" });
      setEditMode(false);
      setEditId(null);
      fetchCategories();
    } catch (error) {
      console.error("❌ Error submitting category:", error);
      setMessage("Failed to process category.");
    }
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, description: category.description });
    setEditMode(true);
    setEditId(category.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = localStorage.getItem("token");
  
      if (!token) {
        console.error("❌ No token found. User is not authenticated.");
        setMessage("Unauthorized - Please log in again.");
        return;
      }
  
      await axios.delete(`http://localhost:5000/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Fetch updated categories after deletion
      await fetchCategories();
  
      // Success message
      setMessage("Category deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting category:", error);
  
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setMessage("Unauthorized - Please log in again.");
            break;
          case 404:
            setMessage("Category not found.");
            break;
          case 500:
            setMessage("Server error - Please try again later.");
            break;
          default:
            setMessage("Failed to delete category. Please try again.");
        }
      } else if (error.request) {
        setMessage("Network error - Please check your internet connection.");
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="bg-white p-4 shadow-md flex justify-between items-center rounded-lg">
          <h1 className="text-2xl font-semibold text-gray-700">
            {user ? `Welcome, ${user.name} 🎉` : "Welcome!"}
          </h1>
          <p className="text-gray-600">{user ? `Role: ${user.role}` : "Loading..."}</p>
        </div>

        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-3">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            {editMode ? "Edit Category" : "Add New Category"}
          </h2>

          {message && <p className="text-green-500" aria-live="polite">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Category Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2 rounded-lg transition ${editMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
            >
              {editMode ? "Update Category" : "Add Category"}
            </button>
          </form>
        </div>

        {/* Table Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Category List</h2>

          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2">Name</th>
                <th className="border border-gray-300 p-2">Description</th>
                <th className="border border-gray-300 p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="text-center">
                  <td className="border border-gray-300 p-2">{category.name}</td>
                  <td className="border border-gray-300 p-2">{category.description}</td>
                  <td className="border border-gray-300 p-2 space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewCategory;
