import React from 'react';
import { FiCheckSquare, FiBox, FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="p-6">
      {/* Header with User Info */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">User, {user?.username} 🎮</h1>
        </div>
        <div className="text-gray-600">
          Role: Admin
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Total Orders</h3>
          <p className="text-4xl font-bold">120</p>
        </div>
        
        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Pending Requests</h3>
          <p className="text-4xl font-bold">8</p>
        </div>
        
        <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Completed Deliveries</h3>
          <p className="text-4xl font-bold">95</p>
        </div>
        
        <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-2">Total Users</h3>
          <p className="text-4xl font-bold">500</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-2 text-gray-700">
            <span className="text-green-500">✓</span>
            Order #12345 has been delivered
          </li>
          <li className="flex items-center gap-2 text-gray-700">
            <span className="text-blue-500">👤</span>
            User "Michael" updated his profile
          </li>
          <li className="flex items-center gap-2 text-gray-700">
            <span className="text-orange-500">📦</span>
            5 new orders placed today
          </li>
          <li className="flex items-center gap-2 text-gray-700">
            <span className="text-yellow-500">⚠️</span>
            2 pending requests require approval
          </li>
        </ul>
      </div>

      {/* Admin Actions Grid */}
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-3 gap-6">
        <Link to="/assess-requests" 
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col items-center text-center">
            <FiCheckSquare className="text-4xl mb-4 text-blue-500" />
            <h3 className="text-xl font-semibold mb-2">Assess Requests</h3>
            <p className="text-gray-600">Review and approve/deny item and repair requests</p>
          </div>
        </Link>

        <Link to="/track-stock" 
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col items-center text-center">
            <FiBox className="text-4xl mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">Track Stock</h3>
            <p className="text-gray-600">Monitor available items and their status</p>
          </div>
        </Link>

        <Link to="/manage-notifications" 
          className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex flex-col items-center text-center">
            <FiBell className="text-4xl mb-4 text-yellow-500" />
            <h3 className="text-xl font-semibold mb-2">Manage Notifications</h3>
            <p className="text-gray-600">Send notifications to Unit Leaders and Logistics Officers</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard; 