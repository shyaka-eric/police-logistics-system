import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Sidebar from './Sidebar';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';

export const ApprovedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
      
      // Filter only approved requests
      const approvedRequests = response.data.requests.filter(req => req.status === 'approved');
      console.log('Fetched requests:', {
        total: response.data.requests.length,
        approved: approvedRequests.length
      });
      
      setRequests(approvedRequests);
    } catch (err) {
      console.error('Error fetching requests:', err.response || err);
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (requestId) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Log the request details for debugging
      console.log('Completing request:', {
        requestId,
        token: token ? 'exists' : 'missing',
        userRole: user?.role,
        userId: user?.id
      });

      if (!token || !user) {
        throw new Error('Authentication required');
      }

      if (user.role !== 'LogisticsOfficer') {
        throw new Error('Only Logistics Officers can complete requests');
      }

      const response = await axios.put(
        `http://localhost:5000/api/requests/${requestId}`,
        { 
          status: 'completed',
          adminRemark: 'Completed by Logistics Officer'
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Log the response for debugging
      console.log('Complete response:', response.data);
      
      await fetchRequests();
      setShowModal(false);
      alert('Request marked as completed successfully!');
    } catch (err) {
      console.error('Error completing request:', err.response || err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to complete request';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  // Check if user is logged in and has correct role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || user.role !== 'LogisticsOfficer') {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Access denied. Only Logistics Officers can view and complete approved requests.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Approved Requests</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
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
                      {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowModal(true);
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                        disabled={isProcessing}
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {requests.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No approved requests found
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Complete Request</h2>
            <p className="mb-4">
              Are you sure you want to mark this request as completed?
              This will update the stock levels accordingly.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleComplete(selectedRequest._id)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedRequests; 