import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setCurrentUser(JSON.parse(user));
      // Set default authorization header for axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentUser(userData);
    // Set default authorization header for axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const register = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentUser(userData);
    // Set default authorization header for axios
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Google Sign-In function
  const googleLogin = async (googleData) => {
    try {
      const response = await axios.post(
        "https://organic-food-backend.onrender.com/api/auth/google",
        {
          token: googleData.credential
        }
      );
      
      const { user, token } = response.data;
      login(user, token);
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Google authentication failed' 
      };
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    googleLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};