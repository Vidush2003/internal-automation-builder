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

  const register = async (name, email, password, role = 'Super Admin') => {
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
