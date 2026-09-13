import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await apiClient('/auth/me');
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data && data.user) {
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const register = async (name, email, password, role = 'SUPER_ADMIN') => {
    try {
      const data = await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      if (data && data.user) {
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      navigate('/', { replace: true, state: {} });
      setTimeout(() => setUser(null), 10);
    }
  };

  const forgotPassword = async (email) => {
    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (err) {
      throw new Error(err.message || 'Failed to send reset link');
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
    } catch (err) {
      throw new Error(err.message || 'Failed to reset password');
    }
  };

  const requestMagicLink = async (email) => {
    try {
      await apiClient('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    } catch (err) {
      throw new Error(err.message || 'Failed to send magic link');
    }
  };

  const verifyMagicLink = async (token) => {
    try {
      const data = await apiClient('/auth/magic-link/verify', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
      if (data && data.user) {
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      throw new Error(err.message || 'Failed to verify magic link');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout, loading, checkAuth,
      forgotPassword, resetPassword, requestMagicLink, verifyMagicLink 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
