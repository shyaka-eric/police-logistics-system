import React from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-blue-600">User Profile</h1>
          <p className="mt-4 text-lg text-gray-700">This is your profile page.</p>
          <div className="mt-8">
            <button
              onClick={() => navigate("/dashboard")} // Navigate back to the dashboard
              className="w-full md:w-auto px-6 py-2 mt-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
