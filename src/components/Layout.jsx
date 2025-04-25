import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notifications } from './Notifications';

export const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Logistics System</h1>
              <span className="ml-4 text-sm text-gray-600">Role: {user?.role}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Notifications />
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  );
};

export default Layout; 