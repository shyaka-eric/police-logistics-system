import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiAlertCircle, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';

const ManageApprovals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const approvedRequests = response.data.requests.filter(req => 
        req.status === 'approved' || req.status === 'rejected'
      );
      setRequests(approvedRequests);
    } catch (err) {
      setError('Failed to fetch approved requests');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheck className="text-green-500" />;
      case 'rejected':
        return <FiX className="text-red-500" />;
      default:
        return null;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Manage Approvals</h2>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by item or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.itemName}</div>
                    <div className="text-sm text-gray-500">{request.purpose}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.requestedBy.name}</div>
                    <div className="text-xs text-gray-500">{request.requestedBy.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.quantity}</div>
                    <div className="text-xs text-gray-500">{request.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusClass(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="text-sm font-medium capitalize">
                        {request.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(request.updatedAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <FiEye className="mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No requests found matching the criteria
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">Request Details</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Item</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.itemName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Requester</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.requestedBy.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.quantity} {selectedRequest.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className={`mt-1 flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusClass(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  <span className="text-sm font-medium capitalize">
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.purpose}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Admin Remarks</label>
                <p className="mt-1 text-sm text-gray-900">{selectedRequest.adminRemark || 'No remarks provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Request Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Decision Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(selectedRequest.updatedAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageApprovals; 