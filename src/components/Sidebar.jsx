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
  FaCog 
} from 'react-icons/fa';
import { memo } from 'react';
import PropTypes from 'prop-types';

const navigationConfig = {
  UnitLeader: [
    { path: '/request-item', icon: FaClipboardList, label: 'Request Item' },
    { path: '/track-items', icon: FaBox, label: 'Track In-Use Items' },
    { path: '/my-requests', icon: FaEye, label: 'My Requests' },
    { path: '/request-repair', icon: FaWrench, label: 'Request Repair' },
    { path: '/profile', icon: FaUserCog, label: 'My Profile' },
  ],
  Admin: [
    { path: '/assess-requests', icon: FaClipboardList, label: 'Assess Requests' },
    { path: '/stock-availability', icon: FaBox, label: 'Stock Availability' },
    { path: '/manage-approvals', icon: FaCheckCircle, label: 'Manage Approvals' },
    { path: '/view-reports', icon: FaChartBar, label: 'View Reports' },
  ],
  LogisticsOfficer: [
    { path: '/approved-requests', icon: FaClipboardList, label: 'Approved Requests' },
    { path: '/stock-management', icon: FaBox, label: 'Manage Stock' },
    { path: '/issue-items', icon: FaBoxes, label: 'Issue Items' },
  ],
  SystemAdmin: [
    { path: '/assess-requests', icon: FaClipboardList, label: 'Assess Requests' },
    { path: '/stock-management', icon: FaBox, label: 'Stock Management' },
    { path: '/manage-users', icon: FaUsers, label: 'Manage Users' },
    { path: '/view-reports', icon: FaChartBar, label: 'View Reports' },
  ],
};

export const Sidebar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderNavLinks = () => {
    const userRole = user?.role;
    if (!userRole || !navigationConfig[userRole]) return null;

    return navigationConfig[userRole].map(({ path, icon: Icon, label }) => (
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
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4" role="navigation">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Logistics System</h2>
        <p className="text-sm text-gray-400">Welcome, {user?.name || 'User'}</p>
        <p className="text-xs text-gray-500">Role: {user?.role}</p>
      </div>

      <nav className="space-y-2">
        <Link
          to="/dashboard"
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 ${
            isActive('/dashboard') ? 'bg-gray-700' : ''
          }`}
        >
          <FaHome className="text-lg" />
          <span>Dashboard</span>
        </Link>

        {renderNavLinks()}

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 w-full mt-8 text-left"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
});

Sidebar.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
  }),
};

export default Sidebar; 