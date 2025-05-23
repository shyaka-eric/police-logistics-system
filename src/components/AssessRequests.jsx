import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

export const AssessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionRemark, setActionRemark] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      // Debug log for user info
      console.log('Current user:', {
        token: token ? 'exists' : 'missing',
        role: user?.role,
        id: user?.id
      });

      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure we have an array of requests
      const requestsArray = Array.isArray(response.data.requests) 
        ? response.data.requests 
        : [];
      
      console.log('Fetched requests:', {
        total: requestsArray.length,
        data: response.data
      });
      
      setRequests(requestsArray);
    } catch (err) {
      console.error('Error fetching requests:', err.response || err);
      setError(err.response?.data?.message || 'Failed to fetch requests');
      setRequests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action, remark = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      // Map action to correct status
      const status = action === 'approve' ? 'approved' : 'rejected';

      // Update request status
      const response = await axios.put(
        `http://localhost:5000/api/requests/${requestId}`,
        { 
          status,
          adminRemark: remark 
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Create notification for the requester
      const request = response.data;
      await axios.post(
        'http://localhost:5000/api/notifications',
        {
          userId: request.requestedBy._id,
          message: `Your request for ${request.quantity} ${request.unit} of ${request.itemName} has been ${status}${remark ? `: ${remark}` : ''}`
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // If approved, create notification for Logistics Officers
      if (status === 'approved') {
        const logisticsOfficers = await axios.get(
          'http://localhost:5000/api/users?role=LogisticsOfficer',
          { headers: { Authorization: `Bearer ${token}` }}
        );

        // Create notifications for each Logistics Officer
        await Promise.all(
          logisticsOfficers.data.map(officer =>
            axios.post(
              'http://localhost:5000/api/notifications',
              {
                userId: officer._id,
                message: `New request approved for ${request.quantity} ${request.unit} of ${request.itemName}`
              },
              { headers: { Authorization: `Bearer ${token}` }}
            )
          )
        );
      }

      // Refresh requests list
      fetchRequests();
      setSelectedRequest(null);
      setShowModal(false);
      setActionRemark('');
      
    } catch (error) {
      console.error('Error processing request:', error);
      setError(error.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter requests based on search term and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedBy?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  // Check if user is logged in and has correct role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || user.role !== 'Admin') {
    return (
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Access denied. Only Admins can assess requests.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Assess Requests</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by item name or requester..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.requestedBy?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.itemName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityClass(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                          disabled={isProcessing}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                          disabled={isProcessing}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No requests found
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Action</h2>
            <p className="mb-4">
              Are you sure you want to {selectedRequest.status === 'pending' ? 'approve' : 'reject'} this request?
            </p>
            <div className="mb-4">
              <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                Add a remark (optional)
              </label>
              <textarea
                id="remark"
                value={actionRemark}
                onChange={(e) => setActionRemark(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter your remark here..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setActionRemark('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const action = selectedRequest.status === 'pending' ? 'approve' : 'reject';
                  handleAction(selectedRequest._id, action, actionRemark);
                }}
                className={`px-4 py-2 ${
                  selectedRequest.status === 'pending' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                } text-white rounded flex items-center`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  selectedRequest.status === 'pending' ? 'Approve' : 'Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessRequests; 