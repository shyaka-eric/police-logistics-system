import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTool, FiCheck, FiX, FiImage, FiZoomIn, FiZoomOut, FiDownload, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ENDPOINTS, getAuthHeader, SERVER_URL } from '../constants/api';

export const AssessRepairRequests = () => {
  const [repairRequests, setRepairRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [action, setAction] = useState('');
  const [remark, setRemark] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchRepairRequests = async () => {
    try {
      console.log('Fetching repair requests...');
      const response = await axios.get(ENDPOINTS.REPAIR_REQUESTS.LIST, {
        headers: getAuthHeader()
      });
      console.log('Repair requests response:', response.data);
      setRepairRequests(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching repair requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch repair requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairRequests();
  }, []);

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      console.log('Updating status:', { requestId, newStatus });
      await axios.patch(
        ENDPOINTS.REPAIR_REQUESTS.UPDATE_STATUS(requestId),
        { 
          status: newStatus,
          adminRemark: remark 
        },
        { headers: getAuthHeader() }
      );
      await fetchRepairRequests();
      setShowModal(false);
      setRemark('');
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update repair status');
    }
  };

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setShowModal(true);
  };

  const handleImageClick = (imageUrl) => {
    // Prepend the server URL if the image path is relative
    const fullImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${SERVER_URL}${imageUrl}`;
    setSelectedImage(fullImageUrl);
    setShowImageModal(true);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repair-request-photo-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    setZoomLevel(1); // Reset zoom when toggling fullscreen
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Assess Repair Requests</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repairRequests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow-md p-4">
              <div className="mb-4">
                <h3 className="font-semibold">Location: {request.location}</h3>
                <p className="text-sm text-gray-600">Priority: {request.priority}</p>
                <p className="text-sm text-gray-600">Status: {request.status}</p>
                <p className="text-sm text-gray-600">
                  Requested by: {request.requestedBy?.name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
                {request.photoUrl && (
                  <img
                    src={request.photoUrl}
                    alt="Repair item"
                    className="mt-2 w-full h-48 object-cover rounded cursor-pointer"
                    onClick={() => handleImageClick(request.photoUrl)}
                  />
                )}
              </div>
              <div className="flex justify-end space-x-2">
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(request, 'rejected')}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(request, 'approved')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {action === 'approved' ? 'Approve Repair Request' : 'Reject Repair Request'}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Remarks
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add your remarks here..."
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
                onClick={() => handleStatusUpdate(selectedRequest._id, action)}
                className={`px-4 py-2 text-white rounded ${
                  action === 'approved' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm {action === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`bg-white rounded-lg p-4 ${isFullscreen ? 'fixed inset-4' : 'max-w-3xl w-full'}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Repair Request Photo</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Zoom Out"
                >
                  <FiZoomOut />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Zoom In"
                >
                  <FiZoomIn />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Download"
                >
                  <FiDownload />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                </button>
                <button
                  onClick={() => {
                    setShowImageModal(false);
                    setZoomLevel(1);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>
            <div 
              className="relative overflow-auto"
              style={{ 
                maxHeight: isFullscreen ? 'calc(100vh - 8rem)' : '70vh',
                minHeight: '300px'
              }}
            >
              <img
                src={selectedImage}
                alt="Repair item full view"
                className="max-w-full h-auto mx-auto transition-transform duration-200"
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center'
                }}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  e.target.src = '/placeholder-image.jpg'; // Add a placeholder image
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessRepairRequests; 