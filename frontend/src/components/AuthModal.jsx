import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Helper for strength meter
const checkStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0 to 4
};

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode); // 'login', 'register', 'forgot', 'magic'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [forgotEmail, setForgotEmail] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, register, forgotPassword, requestMagicLink } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) { setMode(defaultMode); setError(''); setSuccess(''); }
  }, [isOpen, defaultMode]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { await login(loginEmail, loginPassword); onClose(); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { await register(regName, regEmail, regPassword); onClose(); navigate('/dashboard'); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { await forgotPassword(forgotEmail); setSuccess('If the email exists, a reset link was sent.'); setForgotEmail(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleMagic = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try { await requestMagicLink(magicEmail); setSuccess('Magic link sent to your email.'); setMagicEmail(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOAuth = (provider) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${baseUrl}/auth/${provider}`;
  };

  const inputCls = 'w-full rounded-xl py-3.5 px-4 text-[15px] outline-none transition-all bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#ff4a00]/70 focus:bg-white dark:focus:bg-black/50 focus:ring-4 focus:ring-[#ff4a00]/15';

  const renderSocials = () => (
    <div className="flex flex-col gap-3 mb-5">
      <button type="button" onClick={() => handleOAuth('google')} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white dark:bg-[#202024] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold text-[15px] hover:bg-gray-50 dark:hover:bg-[#2a2a2f] transition-all">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
        Continue with Google
      </button>
      <button type="button" onClick={() => handleOAuth('github')} className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white dark:bg-[#202024] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold text-[15px] hover:bg-gray-50 dark:hover:bg-[#2a2a2f] transition-all">
        <img src="https://www.svgrepo.com/show/512317/github-142.svg" className="w-5 h-5 dark:invert" alt="GitHub" />
        Continue with GitHub
      </button>
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">OR</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/25 dark:bg-black/60"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 30 }}
            className="relative w-full max-w-md z-10 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,74,0,0.05), inset 0 1px 0 rgba(255,255,255,1)',
            }}
          >
            <div className="hidden dark:block absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'rgba(22, 22, 26, 0.85)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff4a00] to-transparent" />
            
            <div className="relative z-10 p-8 sm:p-10 flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              
              <div className="text-center pt-1">
                <h2 className="font-black text-2xl text-gray-900 dark:text-white tracking-tight">AutomataX</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                  {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your free account' : mode === 'forgot' ? 'Reset Password' : 'Magic Link'}
                </p>
              </div>

              {(mode === 'login' || mode === 'register') && (
                <div className="flex rounded-xl bg-black/5 dark:bg-white/5 p-1 gap-1">
                  {[['login', 'Sign In'], ['register', 'Sign Up']].map(([m, label]) => (
                    <button key={m} type="button" onClick={() => { setMode(m); setError(''); setSuccess(''); }} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{label}</button>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 py-3 bg-red-500/10 border border-red-400/25 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span> {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 py-3 bg-green-500/10 border border-green-400/25 text-green-600 dark:text-green-400 text-xs rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}>
                  {renderSocials()}
                  <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <input type="email" className={inputCls} placeholder="name@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5 relative">
                      <div className="flex justify-between items-end">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }} className="text-xs text-[#ff4a00] hover:underline font-medium">Forgot?</button>
                      </div>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} className={inputCls} placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="mt-1 w-full py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-sm shadow-lg shadow-[#ff4a00]/30 hover:bg-[#e04200] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <span className="material-symbols-outlined text-[16px]">arrow_forward</span></>}
                    </button>
                    <div className="text-center mt-2">
                      <button type="button" onClick={() => { setMode('magic'); setError(''); setSuccess(''); }} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-4">Log in without password (Magic Link)</button>
                    </div>
                  </form>
                </motion.div>
              )}

              {mode === 'register' && (
                <motion.div key="register" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}>
                  {renderSocials()}
                  <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                      <input type="text" className={inputCls} placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <input type="email" className={inputCls} placeholder="name@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} className={inputCls} placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      {/* Strength Meter */}
                      {regPassword.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4].map((level) => {
                            let color = 'bg-gray-200 dark:bg-white/10';
                            const score = checkStrength(regPassword);
                            if (score >= level) {
                              if (score <= 2) color = 'bg-red-500';
                              else if (score === 3) color = 'bg-yellow-500';
                              else color = 'bg-green-500';
                            }
                            return <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${color}`} />
                          })}
                        </div>
                      )}
                      <p className="text-[11px] text-gray-500 dark:text-gray-500 text-right">At least 8 chars, 1 number, 1 special</p>
                    </div>
                    <button type="submit" disabled={loading} className="mt-1 w-full py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-sm shadow-lg shadow-[#ff4a00]/30 hover:bg-[#e04200] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <span className="material-symbols-outlined text-[16px]">arrow_forward</span></>}
                    </button>
                  </form>
                </motion.div>
              )}

              {mode === 'forgot' && (
                <motion.form key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4" onSubmit={handleForgot}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enter your email and we'll send you a secure link to reset your password.</p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" className={inputCls} placeholder="name@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="mt-2 w-full py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-black rounded-full animate-spin" /> : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mt-2">Back to login</button>
                </motion.form>
              )}

              {mode === 'magic' && (
                <motion.form key="magic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4" onSubmit={handleMagic}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enter your email to receive a secure, one-time link that instantly logs you in.</p>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" className={inputCls} placeholder="name@example.com" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} required />
                  </div>
                  <button type="submit" disabled={loading} className="mt-2 w-full py-3.5 rounded-xl bg-[#ff4a00] text-white font-bold text-sm shadow-lg shadow-[#ff4a00]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Magic Link'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mt-2">Back to login</button>
                </motion.form>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
