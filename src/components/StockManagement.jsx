import React, { useEffect, useState } from "react";
import axios from "axios";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "datatables.net";
import "datatables.net-responsive";
import Sidebar from "./Sidebar";
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { FaFileExcel, FaSpinner } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const StockManagement = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: '',
    unit: '',
    minQuantity: '',
    location: '',
    description: '',
    expirationDate: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchStocks = async () => {
    const token = localStorage.getItem('token');
    try {
      console.log("🔍 Fetching stock data...");
      const response = await axios.get("http://localhost:5000/api/stock", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ API Response:", response.data);
      setStocks(response.data);
    } catch (error) {
      console.error("❌ Error fetching stock:", error);
      setError('Failed to fetch stock items');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get("http://localhost:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchCategories();
  }, []);

  // Initialize DataTable when stock data updates
  useEffect(() => {
    if (stocks.length > 0) {
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
  }, [stocks]); // ✅ Runs when stock data updates

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (selectedStock) {
        await axios.put(`http://localhost:5000/api/stock/${selectedStock._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("http://localhost:5000/api/stock", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      await fetchStocks();
      setShowForm(false);
      setSelectedStock(null);
      setFormData({
        itemName: '',
        category: '',
        quantity: '',
        unit: '',
        minQuantity: '',
        location: '',
        description: '',
        expirationDate: ''
      });
    } catch (error) {
      console.error("❌ Error adding stock item:", error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to add stock item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setFormData({
      itemName: stock.itemName,
      category: stock.category,
      quantity: stock.quantity,
      unit: stock.unit,
      minQuantity: stock.minQuantity,
      location: stock.location,
      description: stock.description || '',
      expirationDate: stock.expirationDate ? new Date(stock.expirationDate).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/stock/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStocks();
    } catch (error) {
      console.error("❌ Error deleting stock item:", error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to delete stock item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      setIsLoading(true);

      const response = await axios.post('http://localhost:5000/api/imports/stock', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Import response:', response.data);
      
      if (response.data.results) {
        const successful = response.data.results.filter(r => r.success).length;
        const failed = response.data.results.filter(r => !r.success).length;
        
        if (failed > 0) {
          alert(`Import completed with some issues:\n${successful} items imported successfully\n${failed} items failed`);
        } else {
          alert('Excel data imported successfully!');
        }
      }

      await fetchStocks();
    } catch (err) {
      console.error('Error importing Excel:', err);
      setError(err.response?.data?.message || 'Failed to import Excel data');
      alert(err.response?.data?.message || 'Failed to import Excel data');
    } finally {
      setIsLoading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post("http://localhost:5000/api/categories", categoryFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCategories();
      setIsCategoryModalOpen(false);
      setCategoryFormData({ name: '', description: '' });
    } catch (error) {
      console.error("❌ Error adding category:", error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to add category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredStocks = stocks.filter(stock =>
    stock.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Stock Management</h1>
            <div className="text-gray-600">
              Role: {user?.role || 'Loading...'}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-8">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <FiPlus className="mr-2" />
              Add Category
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <FiPlus className="mr-2" />
              Add Stock Item
            </button>
            <label className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors cursor-pointer flex items-center">
              <FaFileExcel className="mr-2" />
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock) => (
                  <tr key={stock._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stock.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stock.quantity <= stock.minQuantity && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FiAlertCircle className="mr-1" /> Low Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(stock)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(stock._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
              <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
                <h2 className="text-xl font-bold mb-4">
                  {selectedStock ? 'Edit Stock Item' : 'Add New Stock Item'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Item Name</label>
                      <input
                        type="text"
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit</label>
                      <input
                        type="text"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Quantity</label>
                      <input
                        type="number"
                        name="minQuantity"
                        value={formData.minQuantity}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                      <input
                        type="date"
                        name="expirationDate"
                        value={formData.expirationDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setSelectedStock(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                      {selectedStock ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Category Modal */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New Category</h2>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={categoryFormData.name}
                      onChange={handleCategoryInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={categoryFormData.description}
                      onChange={handleCategoryInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <FaSpinner className="animate-spin inline-block mr-2" />
                      ) : (
                        'Add Category'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
