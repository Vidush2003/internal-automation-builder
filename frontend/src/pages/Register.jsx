import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body min-h-screen flex items-center justify-center p-6 antialiased relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(circle at 10% 20%, theme('colors.surface-container') 0%, transparent 40%), radial-gradient(circle at 90% 80%, theme('colors.surface-container-high') 0%, transparent 40%)" }}></div>
      
      <main className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-12 text-center">
          <h1 className="font-headline font-bold text-4xl text-on-background tracking-tight">automataX</h1>
          <p className="font-label text-on-surface-variant mt-2 text-sm tracking-wide">Create your account to get started</p>
        </div>

        {/* Register Card */}
        <div className="w-full bg-surface p-8 sm:p-10 rounded-xl flex flex-col gap-8 relative border border-outline-variant/35 shadow-sm">
          {error && (
            <div className="p-3 bg-error/10 text-error text-xs rounded-lg flex items-center gap-1.5 font-label">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              {error}
            </div>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-sm text-on-surface" htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-sm text-on-surface" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label className="font-label text-sm text-on-surface" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 px-4 font-body outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Actions */}
            <div className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-label py-3.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
                {!loading && <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>}
              </button>
            </div>
          </form>

          <div className="text-center mt-2">
            <p className="font-body text-sm text-on-surface-variant">
              Already have an account? <button onClick={() => navigate('/login')} className="text-primary hover:underline underline-offset-4 decoration-primary/50 font-medium">Sign In</button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center font-label text-xs text-outline">
          © 2024 automataX. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
