import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTool, FiAlertTriangle, FiCheck, FiX } from 'react-icons/fi';
import { format } from 'date-fns';

export const RepairRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remark, setRemark] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    fetchRepairRequests();
  }, []);

  const fetchRepairRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter repair requests
      const repairRequests = response.data.requests.filter(req => 
        req.type === 'repair' && req.status === 'pending'
      );
      setRequests(repairRequests);
    } catch (err) {
      setError('Failed to fetch repair requests');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setShowModal(true);
  };

  const submitAction = async () => {
    try {
      const token = localStorage.getItem('token');
      const requestId = selectedRequest._id;

      // Update request status
      await axios.put(
        `http://localhost:5000/api/requests/${requestId}`,
        {
          status: action,
          adminRemark: remark,
          repairStatus: action === 'approved' ? 'under-repair' : 'damaged'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update stock status
      await axios.put(
        `http://localhost:5000/api/stock/${selectedRequest.itemId}`,
        {
          status: action === 'approved' ? 'under-repair' : 'damaged'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Create notification for Unit Leader
      await axios.post(
        'http://localhost:5000/api/notifications',
        {
          userId: selectedRequest.requestedBy,
          message: `Your repair request for ${selectedRequest.itemName} has been ${action}. ${remark}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If damaged, notify Unit Leader to request new item
      if (action === 'rejected') {
        await axios.post(
          'http://localhost:5000/api/notifications',
          {
            userId: selectedRequest.requestedBy,
            message: `The item ${selectedRequest.itemName} has been marked as damaged. Please submit a new request for a replacement.`
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Refresh the requests list
      await fetchRepairRequests();
      setShowModal(false);
      setRemark('');
      setSelectedRequest(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process repair request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Repair Requests</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiTool className="mr-2" />
                    <span>{request.itemName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.requestedBy?.name}
                </td>
                <td className="px-6 py-4">
                  {request.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAction(request, 'approved')}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 flex items-center"
                    >
                      <FiCheck className="mr-1" />
                      Under Repair
                    </button>
                    <button
                      onClick={() => handleAction(request, 'rejected')}
                      className="bg-red-100 text-red-800 px-3 py-1 rounded-full hover:bg-red-200 flex items-center"
                    >
                      <FiAlertTriangle className="mr-1" />
                      Damaged
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No repair requests pending
          </div>
        )}
      </div>

      {/* Remark Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {action === 'approved' ? 'Mark as Under Repair' : 'Mark as Damaged'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Remarks
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepairRequest; 