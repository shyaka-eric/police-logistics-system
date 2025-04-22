import axios from 'axios';

export const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No token found');
  }

  try {
    const response = await axios.get('http://localhost:5000/api/user/current', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // If the user is inactive, clear the session
    if (response.data.user.status === 'inactive') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Account deactivated');
    }

    return response.data.user;
  } catch (error) {
    // If we get a 403 with isDeactivated flag, the account is deactivated
    if (error.response?.status === 403 && error.response.data?.isDeactivated) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Account deactivated');
    }
    
    // For other errors, clear the session as well
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
}; 