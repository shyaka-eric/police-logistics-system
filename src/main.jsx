import '@styles/custom.css';
import '@styles/tailwind.css';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Profile from './Profile';
import RequestForm from "./MakeRequest";
import Requests from "./Requests";
import EditRequestShow from "./EditRequestShow";
import EditUserShow from "./EditUserShow";
import MyRequests from "./components/MyRequests";
import StockManagement from "./components/StockManagement";
import Reports from "./components/Reports";
import NewCategory from "./components/NewCategory";
import UserLogs from "./UserLogs";
import Users from "./Users";
import ManageUsers from "./components/ManageUsers";
import CategoryManagement from "./components/CategoryManagement";
import RequestAssessment from "./components/RequestAssessment";
import ApprovedRequests from "./components/ApprovedRequests";
import IssueItems from "./components/IssueItems";
import StockAvailability from './components/StockAvailability';
import ManageApprovals from './components/ManageApprovals';
import ViewReports from './components/ViewReports';
import { RequestItem } from './components/RequestItem';
import { TrackItems } from './components/TrackItems';
import { RequestRepair } from './components/RequestRepair';
import { AssessRequests } from './components/AssessRequests';

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // Helper function to check if user is System Admin
  const isSystemAdmin = () => {
    return user?.role === 'SystemAdmin';
  };

  // Helper function to check if user is Admin or higher
  const isAdminOrHigher = () => {
    return ['Admin', 'SystemAdmin'].includes(user?.role);
  };

  const isLogisticsOfficer = () => {
    return user?.role === 'LogisticsOfficer';
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/request-form" element={<RequestForm />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/edit-request/:requestId" element={<EditRequestShow />} />
      <Route path="/edit-user/:requestId" element={<EditUserShow />} />
      <Route path="/my-requests" element={<MyRequests />} />
      <Route path="/stock-management" element={<StockManagement />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/new-item" element={<NewCategory />} />
      <Route path="/new-category" element={<NewCategory />} />
      <Route path="/user-logs" element={<UserLogs />} />
      <Route path="/users" element={<Users />} />
      
      {/* System Admin Routes */}
      <Route 
        path="/manage-users" 
        element={isSystemAdmin() ? <ManageUsers /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/manage-categories" 
        element={isSystemAdmin() ? <CategoryManagement /> : <Navigate to="/dashboard" />} 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/assess-requests" 
        element={isAdminOrHigher() ? <AssessRequests /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/stock-availability" 
        element={isAdminOrHigher() ? <StockAvailability /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/manage-approvals" 
        element={isAdminOrHigher() ? <ManageApprovals /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/view-reports" 
        element={isAdminOrHigher() ? <ViewReports /> : <Navigate to="/dashboard" />} 
      />
      
      {/* Logistics Officer Routes */}
      <Route 
        path="/approved-requests" 
        element={isLogisticsOfficer() ? <ApprovedRequests /> : <Navigate to="/dashboard" />} 
      />
      <Route 
        path="/issue-items" 
        element={isLogisticsOfficer() ? <IssueItems /> : <Navigate to="/dashboard" />} 
      />
      
      {/* Unit Leader Routes */}
      <Route path="/request-item" element={<RequestItem />} />
      <Route path="/track-items" element={<TrackItems />} />
      <Route path="/request-repair" element={<RequestRepair />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/logistics">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
