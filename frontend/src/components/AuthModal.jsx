import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Reset state when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setError('');
    }
  }, [isOpen, defaultMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Glassmorphic Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 bg-white dark:bg-[#0d0d14]/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0a0a0f] p-8 sm:p-10 rounded-xl flex flex-col gap-8 border border-gray-200 dark:border-white/10/35 shadow-2xl z-10"
            layout
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:bg-[#222230] transition-colors z-20"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Brand Header */}
            <motion.div layout className="text-center mt-2">
              <h2 className="font-headline font-bold text-3xl text-gray-900 dark:text-white tracking-tight">automataX</h2>
              <p className="font-label text-gray-500 dark:text-gray-400 mt-2 text-sm tracking-wide">
                {mode === 'login' ? 'Enter your credentials to continue' : 'Create your account to get started'}
              </p>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-error/10 text-error text-xs rounded-lg flex items-center gap-1.5 font-label overflow-hidden"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {mode === 'login' ? (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6" 
                  onSubmit={handleLogin}
                >
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-sm text-gray-700 dark:text-gray-200" htmlFor="login-email">Email Address</label>
                    <input
                      type="email"
                      id="login-email"
                      className="w-full bg-white dark:bg-[#0d0d14] border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                      placeholder="name@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-sm text-gray-700 dark:text-gray-200" htmlFor="login-password">Password</label>
                    <input
                      type="password"
                      id="login-password"
                      className="w-full bg-white dark:bg-[#0d0d14] border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-label py-3.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-sm"
                    >
                      <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                      {!loading && <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>}
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                      Don't have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => { setMode('register'); setError(''); }} 
                        className="text-primary hover:underline underline-offset-4 decoration-primary/50 font-medium"
                      >
                        Request Access
                      </button>
                    </p>
                  </div>
                </motion.form>
              ) : (
                <motion.form 
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6" 
                  onSubmit={handleRegister}
                >
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-sm text-gray-700 dark:text-gray-200" htmlFor="reg-name">Full Name</label>
                    <input
                      type="text"
                      id="reg-name"
                      className="w-full bg-white dark:bg-[#0d0d14] border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-sm text-gray-700 dark:text-gray-200" htmlFor="reg-email">Email Address</label>
                    <input
                      type="email"
                      id="reg-email"
                      className="w-full bg-white dark:bg-[#0d0d14] border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                      placeholder="name@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label text-sm text-gray-700 dark:text-gray-200" htmlFor="reg-password">Password</label>
                    <input
                      type="password"
                      id="reg-password"
                      className="w-full bg-white dark:bg-[#0d0d14] border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-label py-3.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-sm"
                    >
                      <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                      {!loading && <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>}
                    </button>
                  </div>
                  <div className="text-center">
                    <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                      Already have an account?{' '}
                      <button 
                        type="button" 
                        onClick={() => { setMode('login'); setError(''); }} 
                        className="text-primary hover:underline underline-offset-4 decoration-primary/50 font-medium"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
