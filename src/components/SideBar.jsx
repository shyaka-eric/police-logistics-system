import React from "react";
import { FiHome, FiUser, FiSettings, FiLogOut, FiFileText } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };
  

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col p-5 min-h-screen">
      <h2 className="text-2xl font-bold text-center mb-6">Dashboard</h2>
      <nav className="flex-1">
        <ul>
          <li className="mb-3">
            <Link to="/dashboard" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiHome className="text-xl" />
              <span>Home</span>
            </Link>
          </li>

          {user && (user.role === "admin" || user.role === "LogisticsOfficer") && (
            <>

          <li className="mb-3">
            <Link to="/new-category" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiFileText className="text-xl" />
              <span>New Category</span>
            </Link>
          </li>

          <li className="mb-3">
            <Link to="/new-item" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiFileText className="text-xl" />
              <span>New Item</span>
            </Link>
          </li>
          </>
          )}

          <li className="mb-3">
            <Link to="/request-form" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiFileText className="text-xl" />
              <span>New Request</span>
            </Link>
          </li>

          
          <li className="mb-3">
            <Link to="/my-requests" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiFileText className="text-xl" />
              <span>My Request</span>
            </Link>
          </li>

          {user && (user.role === "admin" || user.role === "LogisticsOfficer") && (
            <>
          
          <li className="mb-3">
            <Link to="/reports" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiFileText className="text-xl" />
              <span>Report</span>
            </Link>
          </li>
          
          <li className="mb-3">
            <Link to="/stock-management" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiFileText className="text-xl" />
              <span>Stock</span>
            </Link>
          </li>

          
            
            <li className="mb-3">
              <Link to="/requests" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
                <FiFileText className="text-xl" />
                <span>Requests</span>
              </Link>
            </li>
            </>
          )}
          {user && user.role === "admin" && (
            <>
            <li className="mb-3">
              <Link to="/users" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
                <FiFileText className="text-xl" />
                <span>Users</span>
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/user-logs" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
                <FiUser className="text-xl" />
                <span>User logs</span>
              </Link>
            </li>
            </>
          )}

          
          {/* <li className="mb-3">
            <Link to="/settings" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiSettings className="text-xl" />
              <span>Settings</span>
            </Link>
          </li> */}
          
          <li className="mb-3">
            <Link to="/profile" className="flex items-center space-x-2 p-2 w-full hover:bg-gray-700 rounded">
              <FiUser className="text-xl" />
              <span>Profile</span>
            </Link>
          </li>

          <li className="mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 p-2 w-full bg-red-600 hover:bg-red-700 rounded"
            >
              <FiLogOut className="text-xl" />
              <span>Log Out</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
