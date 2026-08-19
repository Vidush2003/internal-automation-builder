import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) { setMode(defaultMode); setError(''); }
  }, [isOpen, defaultMode]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(loginEmail, loginPassword); onClose(); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await register(regName, regEmail, regPassword); onClose(); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputCls = 'w-full rounded-xl py-3.5 px-4 text-[15px] outline-none transition-all bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:border-[#ff4a00]/70 focus:bg-white dark:focus:bg-black/50 focus:ring-4 focus:ring-[#ff4a00]/15';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/25 dark:bg-black/60"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.5 }}
            className="absolute w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(255,74,0,0.18) 0%, transparent 65%)', filter: 'blur(50px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 30 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300, delay: 0.05 }}
            className="relative w-full max-w-md z-10 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,74,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            <div
              className="hidden dark:block absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background: 'rgba(22, 22, 26, 0.85)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.08)'
              }}
            />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff4a00] to-transparent" />
            <div className="relative z-10 p-8 sm:p-10 flex flex-col gap-6">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <div className="text-center pt-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#ff4a00] shadow-lg shadow-[#ff4a00]/35 mb-4">
                  <span className="material-symbols-outlined text-white text-[22px]">bolt</span>
                </div>
                <h2 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">AutomataX</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                  {mode === 'login' ? 'Welcome back — sign in to continue' : 'Create your free account'}
                </p>
              </div>
              <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-1 gap-1">
                {[['login', 'Sign In'], ['register', 'Sign Up']].map(([m, label]) => (
                  <button key={m} type="button"
                    onClick={() => { setMode(m); setError(''); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >{label}</button>
                ))}
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 bg-red-500/10 border border-red-400/25 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait" initial={false}>
                {mode === 'login' ? (
                  <motion.form key="login"
                    initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
                    transition={{ duration: 0.16 }}
                    className="flex flex-col gap-4" onSubmit={handleLogin}
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="login-email">Email</label>
                      <input type="email" id="login-email" className={inputCls} placeholder="name@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="login-password">Password</label>
                      <input type="password" id="login-password" className={inputCls} placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={loading}
                      className="mt-1 w-full py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-sm shadow-lg shadow-[#ff4a00]/30 hover:bg-[#e04200] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><span>Sign In</span><span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
                      }
                    </button>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                      No account?{' '}
                      <button type="button" onClick={() => { setMode('register'); setError(''); }} className="text-[#ff4a00] font-semibold hover:underline underline-offset-4">Sign up free</button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form key="register"
                    initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.16 }}
                    className="flex flex-col gap-4" onSubmit={handleRegister}
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reg-name">Full Name</label>
                      <input type="text" id="reg-name" className={inputCls} placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reg-email">Email</label>
                      <input type="email" id="reg-email" className={inputCls} placeholder="name@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="reg-password">Password</label>
                      <input type="password" id="reg-password" className={inputCls} placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={loading}
                      className="mt-1 w-full py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-sm shadow-lg shadow-[#ff4a00]/30 hover:bg-[#e04200] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><span>Create Account</span><span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
                      }
                    </button>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                      Have an account?{' '}
                      <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[#ff4a00] font-semibold hover:underline underline-offset-4">Sign in</button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
