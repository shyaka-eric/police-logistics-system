import  React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate from react-router-dom
import axios from "axios";
import logo from "@images/logo.png"; 

const Login = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "UnitLeader"
  });
  const [error, setError] = useState("");
  const [showRoleDescription, setShowRoleDescription] = useState(false);

  const navigate = useNavigate(); // Get the navigate function from useNavigate

  const roleDescriptions = {
    UnitLeader: "End User: Requests items and repairs, tracks in-use items",
    Admin: "Assesses requests, manages approvals, tracks stock availability",
    LogisticsOfficer: "Manages stock updates and issues approved items",
    SystemAdmin: "Manages users, oversees stock, generates reports, monitors system logs"
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'role') {
      setShowRoleDescription(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const endpoint = isLogin ? "login" : "register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          };

      const { data } = await axios.post(
        `http://localhost:5000/api/auth/${endpoint}`,
        payload
      );

      // Check user status before proceeding with login
      if (data.user?.status === 'inactive') {
        setError("Your account has been deactivated. Please contact your system administrator.");
        return;
      }

      if (isLogin) {
        // Only store data and redirect if user is active
        if (data.user?.status === 'active' || !data.user?.status) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user)); 
          setUser(data.user);  
          navigate("/dashboard"); 
        }
      } else {
        alert("Registration successful! You can now log in.");
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.response?.status === 403) {
        setError(error.response.data.message || "Your account has been deactivated. Please contact your system administrator.");
      } else if (error.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError(error.response?.data?.message || "An error occurred. Please try again.");
      }

      // Clear any stored data if there's an error
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-100 py-6 sm:py-12">
      <div className="relative py-3 sm:mx-auto sm:max-w-md">
        <div className="to-light-blue-500 absolute inset-0 -skew-y-6 transform bg-gradient-to-r from-cyan-400 shadow-lg sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl" />
        <div className="relative bg-white px-6 py-10 shadow-lg sm:rounded-3xl sm:p-14">
          <div className="text-center">
            <img src={logo} className="mx-auto h-10" alt="Logo" />
            <h2 className="mt-4 text-xl font-semibold text-cyan-600">
              {isLogin ? "Login to Your Account" : "Create an Account"}
            </h2>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  className="w-full rounded-lg border p-2"
                  onChange={handleChange}
                  required
                />
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-lg border p-2 bg-white appearance-none"
                    required
                  >
                    <option value="UnitLeader">Unit Leader</option>
                    <option value="Admin">Admin</option>
                    <option value="LogisticsOfficer">Logistics Officer</option>
                    <option value="SystemAdmin">System Admin</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                {showRoleDescription && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    {roleDescriptions[formData.role]}
                  </div>
                )}
              </>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full rounded-lg border p-2"
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full rounded-lg border p-2"
              onChange={handleChange}
              required
            />
            {!isLogin && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                className="w-full rounded-lg border p-2"
                onChange={handleChange}
                required
              />
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-cyan-600 py-2 text-white hover:bg-cyan-700 transition-colors duration-200"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-cyan-600 hover:text-cyan-800 transition-colors duration-200"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
