import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess('Password has been successfully reset. You can now log in.');
      setTimeout(() => navigate('/?auth=login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#111113] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1f] rounded-2xl p-8 border border-gray-200 dark:border-white/10 shadow-xl">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">Reset Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Enter your new password below.</p>
        
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl">
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 bg-green-500/10 text-green-600 dark:text-green-400 text-sm rounded-xl">
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <input 
              type="password" 
              className="w-full rounded-xl py-3 px-4 outline-none bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="mt-2 w-full py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-sm shadow-lg shadow-[#ff4a00]/30 hover:bg-[#e04200] transition-colors"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
