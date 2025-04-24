import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaBox, 
  FaClipboardList, 
  FaUserCog, 
  FaChartBar, 
  FaCheckCircle, 
  FaEye, 
  FaUsers, 
  FaSignOutAlt, 
  FaWrench, 
  FaBoxes,
  FaCog,
  FaPlus,
  FaTools,
  FaUser,
  FaToolbox
} from 'react-icons/fa';
import { memo } from 'react';
import PropTypes from 'prop-types';
import { FiHome, FiUsers, FiActivity } from 'react-icons/fi';

const navigationConfig = {
  UnitLeader: [
    { path: '/dashboard/request-item', icon: FaClipboardList, label: 'Request Item' },
    { path: '/dashboard/track-items', icon: FaBox, label: 'Track In-Use Items' },
    { path: '/dashboard/my-requests', icon: FaEye, label: 'My Requests' },
    { path: '/dashboard/request-repair', icon: FaWrench, label: 'Request Repair' },
    { path: '/dashboard/manage-repairs', icon: FaToolbox, label: 'Repair Items' },
    { path: '/dashboard/profile', icon: FaUserCog, label: 'My Profile' },
  ],
  Admin: [
    { path: '/dashboard/assess-requests', icon: FaClipboardList, label: 'Assess Requests' },
    { path: '/dashboard/assess-repair-requests', icon: FaWrench, label: 'Assess Repairs' },
    { path: '/dashboard/stock-availability', icon: FaBox, label: 'Stock Availability' },
    { path: '/dashboard/manage-approvals', icon: FaCheckCircle, label: 'Manage Approvals' },
    { path: '/dashboard/manage-repairs', icon: FaToolbox, label: 'Manage Repairs' },
    { path: '/dashboard/view-reports', icon: FaChartBar, label: 'View Reports' },
  ],
  LogisticsOfficer: [
    { path: '/dashboard/approved-requests', icon: FaClipboardList, label: 'Approved Requests' },
    { path: '/dashboard/stock-management', icon: FaBox, label: 'Manage Stock' },
    { path: '/dashboard/issue-items', icon: FaBoxes, label: 'Issue Items' },
    { path: '/dashboard/manage-repairs', icon: FaToolbox, label: 'Manage Repairs' },
  ],
  SystemAdmin: [
    { path: '/dashboard/assess-requests', icon: FaClipboardList, label: 'Assess Requests' },
    { path: '/dashboard/stock-management', icon: FaBox, label: 'Stock Management' },
    { path: '/dashboard/manage-users', icon: FaUsers, label: 'Manage Users' },
    { path: '/dashboard/view-reports', icon: FaChartBar, label: 'View Reports' },
    { path: '/dashboard/system-logs', icon: FiActivity, label: 'System Logs' },
  ],
};

export const Sidebar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderNavLinks = () => {
    if (!role || !navigationConfig[role]) return null;

    return navigationConfig[role].map(({ path, icon: Icon, label }) => (
      <Link
        key={path}
        to={path}
        className={`flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 
          hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 
          ${isActive(path) ? 'bg-gray-700' : ''}`}
        aria-label={label}
      >
        <Icon className="text-lg" />
        <span>{label}</span>
      </Link>
    ));
  };

  return (
    <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Logistics System</h1>
        <p className="text-sm text-gray-400">Welcome, {user?.name}</p>
        <p className="text-xs text-gray-500">Role: {role}</p>
      </div>

      <nav className="space-y-2">
        <Link 
          to="/dashboard" 
          className={`flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 
            hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 
            ${isActive('/dashboard') ? 'bg-gray-700' : ''}`}
        >
          <FaHome className="text-lg" />
          <span>Dashboard</span>
        </Link>

        {renderNavLinks()}

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 p-2 rounded-lg transition-colors duration-200 
            hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
});

Sidebar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
  }),
}; 