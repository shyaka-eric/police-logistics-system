import '@styles/custom.css';
import '@styles/tailwind.css';
import Dashboard from './Dashboard';
import Profile from './Profile';
import  React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import RequestForm from "./MakeRequest";
import Requests from "./Requests";
import EditRequestShow from "./EditRequestShow";
import EditUserShow from "./EditUserShow";
import MyRequests from "./components/MyRequests";
import StockManagement from "./components/StockManagement";
import Reports from "./components/Reports";
import NewInStock from "./components/NewInStock";
import NewCategory from "./components/NewCategory";
import UserLogs from "./UserLogs";
import Users from "./Users";

function App() {
  const [user, setUser] = useState(null); // Manage user state
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
}, []);

  return (
    <StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/login" element={<Login setUser={setUser} />} /> {/* Pass setUser to Login */}
          <Route path="/dashboard" element={<Dashboard user={user} />} /> {/* Pass user to Dashboard */}
          <Route path="/profile" element={<Profile />} /> {/* Profile route */}
          <Route path="/request-form" element={user ? <RequestForm /> : <Navigate to="/" />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/edit-request/:requestId" element={<EditRequestShow />} />
          <Route path="/edit-user/:requestId" element={<EditUserShow />} />

          <Route path="/my-requests" element={<MyRequests />} />
          <Route path="/stock-management" element={<StockManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/new-item" element={<NewInStock />} />
          <Route path="/new-category" element={<NewCategory />} />
          <Route path="/user-logs" element={<UserLogs />} />
          <Route path="/users" element={<Users />} />

        </Routes>
      </Router>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<App />);
