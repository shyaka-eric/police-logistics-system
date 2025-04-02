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
  });
  const [error, setError] = useState("");

  const navigate = useNavigate(); // Get the navigate function from useNavigate

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          role: "UnitLeader", // Default role
        };

    const { data } = await axios.post(
      `http://localhost:5000/api/auth/${endpoint}`,
      payload
    );

    if (isLogin) {
      // ✅ Store token and full user data in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user)); // Save full user data

      // ✅ Update state with full user object instead of just role
      setUser(data.user);  // Make sure setUser is called here

      // ✅ Redirect to the dashboard after login
      navigate("/dashboard"); // Use navigate to redirect to "/dashboard"
      // navigate("/login");
    } else {
      alert("Registration successful! You can now log in.");
      setIsLogin(true);
    }
  } catch (error) {
    console.log("Error details:", error); // Logs the full error object
    console.log("Error response data:", error.response?.data); // Logs the response error data
    setError(error.response?.data?.error || "Something went wrong.");
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

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className="w-full rounded-lg border p-2"
                onChange={handleChange}
                required
              />
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
              className="w-full rounded-lg bg-cyan-600 p-2 text-white hover:bg-cyan-700"
            >
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              className="text-cyan-500 hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
