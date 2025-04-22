import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiAlertCircle, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';
import RepairRequest from './RepairRequest';

const RequestAssessment = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockLevels, setStockLevels] = useState({});
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remark, setRemark] = useState('');
  const [action, setAction] = useState('');
  const [modifiedQuantity, setModifiedQuantity] = useState('');
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'repair'
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const requests = response.data.requests || [];
      // Filter based on request type
      const filteredRequests = requests.filter(req => 
        req.status === 'pending' && 
        (activeTab === 'new' ? req.type !== 'repair' : req.type === 'repair')
      );
      setRequests(filteredRequests);
    } catch (err) {
      setError('Failed to fetch requests');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLevels = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stockMap = {};
      response.data.forEach(item => {
        stockMap[item.itemName.toLowerCase()] = {
          quantity: item.quantity,
          status: item.status
        };
      });
      setStockLevels(stockMap);
    } catch (err) {
      console.error('Error fetching stock levels:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStockLevels();
    // Set up notification polling
    const interval = setInterval(checkNewRequests, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [activeTab]);

  const checkNewRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newRequests = response.data.requests.filter(req => 
        req.status === 'pending' && 
        !requests.some(existingReq => existingReq._id === req._id)
      );

      if (newRequests.length > 0) {
        setNotificationMessage(`${newRequests.length} new request(s) received`);
        setShowNotification(true);
        fetchRequests(); // Update the requests list
      }
    } catch (err) {
      console.error('Error checking for new requests:', err);
    }
  };

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setModifiedQuantity(request.quantity.toString());
    setShowRemarkModal(true);
  };

  const submitAction = async () => {
    try {
      const token = localStorage.getItem('token');
      const requestId = selectedRequest._id;
      
      // Prepare request data
      const requestData = {
        status: action,
        adminRemark: remark,
        quantity: parseInt(modifiedQuantity)
      };

      // Update request status
      await axios.put(
        `http://localhost:5000/api/requests/${requestId}`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Create notifications
      await Promise.all([
        // Notify Unit Leader
        axios.post(
          'http://localhost:5000/api/notifications',
          {
            userId: selectedRequest.requestedBy._id,
            message: `Your request for ${selectedRequest.itemName} has been ${action}${
              action === 'approved' ? ` for quantity ${modifiedQuantity}` : ''
            }. ${remark}`
          },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        // If approved, notify Logistics Officer
        action === 'approved' && axios.post(
          'http://localhost:5000/api/notifications',
          {
            role: 'LogisticsOfficer',
            message: `New request approved for ${selectedRequest.itemName} (Quantity: ${modifiedQuantity})`
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      // Update UI
      setRequests(prev => prev.filter(req => req._id !== selectedRequest._id));
      setShowRemarkModal(false);
      setRemark('');
      setSelectedRequest(null);
      setModifiedQuantity('');
      setError(null);

      // Show success notification
      setNotificationMessage(`Request ${action} successfully`);
      setShowNotification(true);
    } catch (err) {
      console.error('Error processing request:', err);
      setError(err.response?.data?.message || 'Failed to process request');
    }
  };

  const checkStockAvailability = (itemName, requestedQuantity) => {
    const stock = stockLevels[itemName.toLowerCase()];
    if (!stock) return { available: false, quantity: 0 };
    
    return {
      available: stock.quantity >= requestedQuantity && stock.status === 'in-stock',
      quantity: stock.quantity,
      status: stock.status
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center">
            <span>{notificationMessage}</span>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'new'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          New Requests
        </button>
        <button
          onClick={() => setActiveTab('repair')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'repair'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Repair Requests
        </button>
      </div>

      {activeTab === 'new' ? (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">New Requests Assessment</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.requestedBy?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{request.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{request.quantity} {request.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StockStatusCell 
                        itemName={request.itemName} 
                        requestedQuantity={request.quantity}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getPriorityClass(request.priority)
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">{request.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAction(request, 'approved')}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200 flex items-center"
                        >
                          <FiCheck className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(request, 'rejected')}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full hover:bg-red-200 flex items-center"
                        >
                          <FiX className="mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requests.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No pending requests
              </div>
            )}
          </div>
        </div>
      ) : (
        <RepairRequest />
      )}

      {/* Action Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {action === 'approved' ? 'Approve Request' : 'Reject Request'}
            </h3>
            
            {action === 'approved' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modify Quantity (if needed)
                </label>
                <input
                  type="number"
                  value={modifiedQuantity}
                  onChange={(e) => setModifiedQuantity(e.target.value)}
                  min="1"
                  max={stockLevels[selectedRequest?.itemName.toLowerCase()]?.quantity}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

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
                onClick={() => {
                  setShowRemarkModal(false);
                  setRemark('');
                  setSelectedRequest(null);
                  setModifiedQuantity('');
                }}
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

// Helper Components
const StockStatusCell = ({ itemName, requestedQuantity }) => {
  const status = checkStockAvailability(itemName, requestedQuantity);
  const bgColor = status.available ? 'bg-green-100' : 'bg-red-100';
  const textColor = status.available ? 'text-green-800' : 'text-red-800';
  
  return (
    <div className={`flex items-center space-x-2 ${bgColor} ${textColor} px-3 py-1 rounded-full`}>
      {status.available ? (
        <FiCheck className="flex-shrink-0" />
      ) : (
        <FiAlertCircle className="flex-shrink-0" />
      )}
      <div>
        <div className="font-medium">
          {status.available ? 'Available' : 'Insufficient'}
        </div>
        <div className="text-sm">
          {status.quantity} in stock
        </div>
      </div>
    </div>
  );
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

export default RequestAssessment; 