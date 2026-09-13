import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MagicLogin() {
  const { verifyMagicLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const verify = async () => {
      try {
        await verifyMagicLink(token);
        // AuthContext handles the redirect to /dashboard on success
      } catch (err) {
        setError(err.message || 'Invalid or expired magic link');
      }
    };

    verify();
  }, [token, navigate, verifyMagicLink]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111113] p-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Login Failed</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <button 
          onClick={() => navigate('/?auth=login')}
          className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-sm"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111113] p-4">
      <span className="w-10 h-10 border-4 border-gray-200 border-t-[#ff4a00] rounded-full animate-spin mb-4" />
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verifying magic link...</h2>
    </div>
  );
}
