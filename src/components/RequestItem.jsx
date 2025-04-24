import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaSpinner, FaUpload, FaFileExcel, FaCloudUploadAlt } from 'react-icons/fa';
import * as XLSX from 'xlsx';

// Configure axios base URL
const api = axios.create({
  baseURL: 'http://localhost:5000'
});

export const RequestItem = () => {
  const [requestMethod, setRequestMethod] = useState('form'); // 'form' or 'excel'
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    unit: '',
    purpose: '',
    priority: 'normal',
    category: ''
  });

  // Filtered items based on selected category
  const filteredItems = items.filter(item => 
    formData.category ? item.category === formData.category : true
  );

  // Fetch available items and categories on component mount
  useEffect(() => {
    fetchItems();
    fetchCategories();
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role || '');
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/api/stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching items:', err);
      if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view stock items.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch available items. Please try again.');
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset item selection when category changes
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value,
        itemName: '',
        unit: ''
      }));
    }

    // If item is selected, auto-fill unit
    if (name === 'itemName') {
      const selectedItem = items.find(item => item.itemName === value);
      if (selectedItem) {
        setFormData(prev => ({
          ...prev,
          unit: selectedItem.unit,
          itemName: value
        }));
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      await api.post('/api/requests', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Request submitted successfully!');
      setFormData({
        itemName: '',
        quantity: '',
        unit: '',
        purpose: '',
        priority: 'normal',
        category: ''
      });
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        setError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const downloadTemplate = () => {
    // Create template workbook
    const template = XLSX.utils.book_new();
    const templateData = [
      ['itemName', 'quantity', 'unit', 'purpose', 'priority', 'category'], // Headers
      ['Example Item', '10', 'pcs', 'For office use', 'normal', 'Office Supplies'] // Example row
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(template, ws, 'Request Template');
    
    // Save template
    XLSX.writeFile(template, 'request_template.xlsx');
  };

  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(firstSheet);

          // Validate data
          const validationErrors = [];
          data.forEach((row, index) => {
            if (!row.itemName || !row.quantity || !row.unit || !row.purpose) {
              validationErrors.push(`Row ${index + 2}: Missing required fields`);
            }
            if (!items.some(item => item.itemName === row.itemName)) {
              validationErrors.push(`Row ${index + 2}: Item "${row.itemName}" not found in stock`);
            }
          });

          if (validationErrors.length > 0) {
            throw new Error('Validation errors:\n' + validationErrors.join('\n'));
          }

          // Submit each request
          const token = localStorage.getItem('token');
          await Promise.all(data.map(row => 
            api.post('/api/requests', row, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ));

          setSuccess('All requests submitted successfully!');
          setSelectedFile(null);
          // Reset file input
          const fileInput = document.getElementById('excel-upload');
          if (fileInput) fileInput.value = '';
        } catch (err) {
          console.error('Error processing Excel:', err);
          setError(err.message || 'Failed to process Excel file');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read Excel file');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Make a Request</h1>

        {/* Request Method Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setRequestMethod('form')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                requestMethod === 'form'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Request Form
            </button>
            <button
              onClick={() => setRequestMethod('excel')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                requestMethod === 'excel'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Excel Upload
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {requestMethod === 'form' ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <select
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.category}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select an item</option>
                  {filteredItems.map(item => (
                    <option key={item._id} value={item.itemName}>
                      {item.itemName}
                      {(userRole === 'Admin' || userRole === 'LogisticsOfficer') && 
                        ` (${item.quantity} ${item.unit} available)`
                      }
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <FaFileExcel className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <button
                      onClick={downloadTemplate}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Download Excel Template
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Please use our template for correct formatting
                  </p>
                </div>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="mt-4">
                  <label
                    htmlFor="excel-upload"
                    className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <FaUpload className="mr-2" />
                    Select Excel File
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-4 text-sm text-gray-500">
                    Selected file: {selectedFile.name}
                  </div>
                )}
              </div>

              <button
                onClick={handleExcelSubmit}
                disabled={!selectedFile || loading}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt className="mr-2" />
                    Upload and Submit
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestItem;