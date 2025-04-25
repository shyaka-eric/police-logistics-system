import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Layout } from "./components/Layout";
import { SystemLogs } from "./components/SystemLogs";
import { RequestItem } from "./components/RequestItem";
import { TrackItems } from "./components/TrackItems";
import { RequestRepair } from "./components/RequestRepair";
import AssessRequests from "./components/AssessRequests";
import { ManageRepairs } from "./components/ManageRepairs";
import ManageUsers from "./components/ManageUsers";
import ViewReports from "./components/ViewReports";
import StockManagement from "./components/StockManagement";
import ApprovedRequests from "./components/ApprovedRequests";
import IssueItems from "./components/IssueItems";
import StockAvailability from "./components/StockAvailability";
import ManageApprovals from "./components/ManageApprovals";
import MyRequests from "./components/MyRequests";
import { AssessRepairRequests } from "./components/AssessRepairRequests";
import { ViewRequests } from "./components/ViewRequests";

const DashboardHome = () => {
  return (
    <div className="p-8">
      <div className="grid grid-cols-2 gap-6">
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
    </div>
  );
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Layout>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route index element={<DashboardHome />} />
            
            {/* System Admin Routes */}
            {user?.role === 'SystemAdmin' && (
              <>
                <Route path="system-logs" element={<SystemLogs />} />
                <Route path="manage-users" element={<ManageUsers />} />
                <Route path="view-requests" element={<ViewRequests />} />
                <Route path="stock-availability" element={<StockAvailability />} />
                <Route path="view-reports" element={<ViewReports />} />
              </>
            )}
            
            {/* Admin Routes */}
            {['Admin', 'SystemAdmin'].includes(user?.role) && (
              <>
                <Route path="assess-requests" element={<AssessRequests />} />
                <Route path="assess-repair-requests" element={<AssessRepairRequests />} />
                <Route path="stock-availability" element={<StockAvailability />} />
                <Route path="manage-approvals" element={<ManageApprovals />} />
                <Route path="view-reports" element={<ViewReports />} />
              </>
            )}
            
            {/* Logistics Officer Routes */}
            {user?.role === 'LogisticsOfficer' && (
              <>
                <Route path="approved-requests" element={<ApprovedRequests />} />
                <Route path="stock-management" element={<StockManagement />} />
                <Route path="issue-items" element={<IssueItems />} />
              </>
            )}
            
            {/* Unit Leader Routes */}
            {user?.role === 'UnitLeader' && (
              <>
                <Route path="request-item" element={<RequestItem />} />
                <Route path="track-items" element={<TrackItems />} />
                <Route path="request-repair" element={<RequestRepair />} />
                <Route path="my-requests" element={<MyRequests />} />
              </>
            )}
            
            {/* Shared Routes */}
            {['Admin', 'LogisticsOfficer', 'UnitLeader'].includes(user?.role) && (
              <Route path="manage-repairs" element={<ManageRepairs />} />
            )}
          </Routes>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
