import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBox, FiClipboard, FiTool, FiAlertCircle } from 'react-icons/fi';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    inUseItems: 0,
    repairRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard statistics');
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user?.name}</h1>
        <p className="text-gray-600">Role: {user?.role}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiClipboard}
          title="Total Requests"
          value={stats.totalRequests}
          color="bg-blue-500"
        />
        <StatCard
          icon={FiClipboard}
          title="Pending Requests"
          value={stats.pendingRequests}
          color="bg-yellow-500"
        />
        <StatCard
          icon={FiBox}
          title="Items In Use"
          value={stats.inUseItems}
          color="bg-green-500"
        />
        <StatCard
          icon={FiTool}
          title="Repair Requests"
          value={stats.repairRequests}
          color="bg-red-500"
        />
      </div>

      {/* Role-specific content */}
      {user?.role === 'UnitLeader' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/request-item"
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2">Request New Item</h3>
              <p className="text-gray-600">Submit a new item request</p>
            </a>
            <a
              href="/track-items"
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2">Track Items</h3>
              <p className="text-gray-600">View your current items</p>
            </a>
            <a
              href="/request-repair"
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2">Request Repair</h3>
              <p className="text-gray-600">Submit repair requests</p>
            </a>
          </div>
        </div>
      )}

      {user?.role === 'Admin' && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Administrative Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/assess-requests"
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2">Assess Requests</h3>
              <p className="text-gray-600">Review pending requests</p>
            </a>
            <a
              href="/stock-availability"
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2">Stock Status</h3>
              <p className="text-gray-600">Check stock availability</p>
            </a>
            <a
              href="/view-reports"
              className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2">Reports</h3>
              <p className="text-gray-600">View system reports</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}; 