import React from "react";
import { Link } from "react-router-dom";
import { FaBox, FaClipboardList, FaChartBar, FaTools } from 'react-icons/fa';
import Sidebar from "./components/Sidebar";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const renderLogisticsOfficerOptions = () => (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/approved-requests" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaClipboardList className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">Process Requests</h3>
          </div>
          <p className="text-gray-600">View and fulfill approved requests</p>
        </Link>

        <Link to="/stock-management" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaBox className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">Manage Stock</h3>
          </div>
          <p className="text-gray-600">Update and track inventory levels</p>
        </Link>

        <Link to="/reports" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaChartBar className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">View Reports</h3>
          </div>
          <p className="text-gray-600">Access inventory reports and analytics</p>
        </Link>
      </div>
    </div>
  );

  const renderUnitLeaderOptions = () => (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/request-form" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaClipboardList className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">Make Request</h3>
          </div>
          <p className="text-gray-600">Submit new item requests</p>
        </Link>

        <Link to="/my-requests" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaBox className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">My Requests</h3>
          </div>
          <p className="text-gray-600">View your request history</p>
        </Link>
      </div>
    </div>
  );

  const renderAdminOptions = () => (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/assess-requests" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaClipboardList className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">Assess Requests</h3>
          </div>
          <p className="text-gray-600">Review and process pending requests</p>
        </Link>

        <Link to="/stock-management" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaBox className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">Stock Management</h3>
          </div>
          <p className="text-gray-600">Monitor and manage inventory</p>
        </Link>

        <Link to="/reports" 
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-duration-150">
          <div className="flex items-center text-cyan-600 mb-3">
            <FaChartBar className="text-xl" />
            <h3 className="text-lg font-semibold ml-2">Reports</h3>
          </div>
          <p className="text-gray-600">View system reports and analytics</p>
        </Link>
      </div>
    </div>
  );

  const renderRoleOptions = () => {
    switch (user?.role) {
      case 'LogisticsOfficer':
        return renderLogisticsOfficerOptions();
      case 'UnitLeader':
        return renderUnitLeaderOptions();
      case 'Admin':
        return renderAdminOptions();
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        {/* Header with user info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-semibold">
              User, {user?.name} <span role="img" aria-label="party">🎉</span>
            </h1>
            <div className="ml-4 text-gray-600">
              Role: {user?.role}
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-blue-500 text-white rounded-lg p-6">
            <h2 className="text-xl mb-4">Total Orders</h2>
            <div className="text-4xl font-bold">120</div>
          </div>

          {/* Pending Requests */}
          <div className="bg-yellow-500 text-white rounded-lg p-6">
            <h2 className="text-xl mb-4">Pending Requests</h2>
            <div className="text-4xl font-bold">8</div>
          </div>

          {/* Completed Deliveries */}
          <div className="bg-green-500 text-white rounded-lg p-6">
            <h2 className="text-xl mb-4">Completed Deliveries</h2>
            <div className="text-4xl font-bold">95</div>
          </div>

          {/* Total Users */}
          <div className="bg-purple-500 text-white rounded-lg p-6">
            <h2 className="text-xl mb-4">Total Users</h2>
            <div className="text-4xl font-bold">500</div>
          </div>
        </div>

        {/* Role-specific Quick Access Options */}
        {renderRoleOptions()}
      </div>
    </div>
  );
};

export default Dashboard;
