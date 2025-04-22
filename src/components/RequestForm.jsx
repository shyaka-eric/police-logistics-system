import React, { useState } from 'react';
import axios from 'axios';

const RequestForm = () => {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 1,
    unit: '',
    purpose: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // Validate form data
    if (!formData.itemName.trim()) {
      setMessage({ type: 'error', text: 'Item name is required' });
      setIsSubmitting(false);
      return;
    }

    if (formData.quantity < 1) {
      setMessage({ type: 'error', text: 'Quantity must be at least 1' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.unit.trim()) {
      setMessage({ type: 'error', text: 'Unit is required' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.purpose.trim()) {
      setMessage({ type: 'error', text: 'Purpose is required' });
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'You must be logged in to submit a request' });
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting request with data:', formData);
      console.log('Using token:', token);

      const response = await axios.post(
        'http://localhost:5000/api/requests',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Response from server:', response.data);

      setMessage({
        type: 'success',
        text: 'Item request submitted successfully!'
      });
      
      // Reset form
      setFormData({
        itemName: '',
        quantity: 1,
        unit: '',
        purpose: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to submit item request';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'You must be logged in to submit a request';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if the server is running.';
      }

      setMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Request New Items</h2>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item Name
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
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
              onChange={handleChange}
              placeholder="e.g., pieces, kg, liters"
              className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Purpose
          </label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority Level
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-700'
          } transition-colors duration-200`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default RequestForm;
