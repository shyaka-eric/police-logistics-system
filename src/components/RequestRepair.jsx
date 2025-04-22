import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export const RequestRepair = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({
    itemId: '',
    issueDescription: '',
    priority: 'low',
    location: '',
  });

  useEffect(() => {
    fetchAssignedItems();
  }, []);

  const fetchAssignedItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/items/assigned', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (err) {
      setError('Failed to fetch assigned items');
      console.error('Error fetching items:', err);
    }
  };

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
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/repairs/request', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Repair request submitted successfully');
      setFormData({
        itemId: '',
        issueDescription: '',
        priority: 'low',
        location: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit repair request');
      console.error('Error submitting repair request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Request Repair</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
          <FiCheckCircle className="mr-2" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-2">
            Select Item
          </label>
          <select
            id="itemId"
            name="itemId"
            value={formData.itemId}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an item</option>
            {items.map(item => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.serialNumber || 'No Serial'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="issueDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Issue Description
          </label>
          <textarea
            id="issueDescription"
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleInputChange}
            required
            rows="4"
            placeholder="Describe the issue in detail..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Current Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            placeholder="Where is the item currently located?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-6 py-3 text-white font-medium rounded-lg ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Submitting...' : 'Submit Repair Request'}
        </button>
      </form>
    </div>
  );
}; 