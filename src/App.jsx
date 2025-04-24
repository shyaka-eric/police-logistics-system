import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { checkAuthStatus } from './utils/auth';
import Login from './Login';
import Dashboard from './Dashboard';
import Feature from '@components/Feature';
import Footer from '@components/Footer';
import logo from '@images/logo.png';
import axios from 'axios';
import { SystemLogs } from './components/SystemLogs';

const features = [
  {
    title: 'npm run start',
    description: 'Run the React app in development mode with live reloading.',
  },
  {
    title: 'npm run build',
    description: 'Bundles the React app for deployment in production environment.',
  },
  {
    title: 'npm run inline',
    description: 'Inline all CSS and JS in a single minfied file.',
  },
];

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      try {
        // Check if we have a stored user
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setIsLoading(false);
          return;
        }

        // Validate the session
        const validatedUser = await checkAuthStatus();
        setUser(validatedUser);
      } catch (error) {
        // If error is 'Account deactivated', show an alert
        if (error.message === 'Account deactivated') {
          alert('Your account has been deactivated. Please contact your system administrator.');
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  // Add an axios interceptor to handle 403 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 403 && error.response.data?.isDeactivated) {
          // Clear user data and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          alert('Your account has been deactivated. Please contact your system administrator.');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
    </div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />
        } />
        <Route path="/dashboard/*" element={
          user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
