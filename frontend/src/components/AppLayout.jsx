import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';
import { useToast } from './Overlays';
import { AnimatePresence, motion } from 'framer-motion';

const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

/* ─── Dark Mode Toggle ────────────────────────── */
function DarkToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:text-white/50 dark:hover:text-white/80"
      aria-label="Toggle theme"
    >
      <Icon className="text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</Icon>
    </button>
  );
}

/* ─── Nav Item ─────────────────────────────────── */
function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <li>
      <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-label text-[11px] font-semibold uppercase tracking-widest transition-all duration-200 ${
          active
            ? 'bg-primary/10 text-[#ff4a00]'
            : 'text-gray-500 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Icon className={`text-[20px] shrink-0 ${active ? 'text-[#ff4a00]' : ''}`}>{icon}</Icon>
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    </li>
  );
}

/* ─── Profile Dropdown ────────────────────────── */
function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initial = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full text-white flex items-center justify-center font-headline font-bold text-sm shrink-0 shadow-sm ring-2 ring-[#ff4a00]/20 group-hover:ring-[#ff4a00]/40 transition-all" style={{ background: 'linear-gradient(135deg,#ff4a00,#e04200)' }}>
          {initial}
        </div>
        <div className="hidden sm:block text-left leading-tight max-w-36">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Workspace user'}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>
        <Icon className={`text-[18px] text-gray-500 dark:text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</Icon>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0d0d14] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3.5 border-b border-gray-200 dark:border-white/10">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user?.email}</p>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors font-label">
                <Icon className="text-[18px]">manage_accounts</Icon>
                Account settings
              </button>
              <div className="my-1 border-t border-gray-200 dark:border-white/10" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors font-label mt-1"
              >
                <Icon className="text-[18px]">logout</Icon>
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sidebar ──────────────────────────────────── */
function AppSidebar({ onCreateWorkflow, extra }) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path) => navigate(path);

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', exact: true },
    { icon: 'account_tree', label: 'Workflows', path: '/workflows' },
    { icon: 'receipt_long', label: 'Action Logs', path: '/logs' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen bg-white/40 dark:bg-black/20 backdrop-blur-xl border-r border-gray-200/50 dark:border-white/5 overflow-y-auto z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200 dark:border-white/10">
        <img src="/logo/automataX.png" alt="automataX" className="h-6 w-auto object-contain dark:brightness-200" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-3 font-label text-[9px] uppercase tracking-[.18em] font-bold text-gray-500 dark:text-gray-400/60">Navigation</p>
        <ul className="space-y-1">
          {navItems.map(({ icon, label, path, exact }) => (
            <NavItem
              key={path}
              icon={icon}
              label={label}
              active={exact ? location.pathname === path : location.pathname.startsWith(path)}
              onClick={() => go(path)}
            />
          ))}
        </ul>

        {extra && <div className="mt-6">{extra}</div>}
      </nav>

      {/* Create Workflow CTA */}
      {onCreateWorkflow && (
        <div className="px-3 pb-4 border-t border-gray-200 dark:border-white/10 dark:border-white/10 pt-4">
          <button
            onClick={onCreateWorkflow}
            className="w-full py-3 rounded-xl font-label text-[11px] font-bold text-white uppercase tracking-widest shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all flex justify-center items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#ff4a00,#e04200)', boxShadow: '0 0 15px rgba(255,74,0,0.2)' }}
          >
            <Icon className="text-[18px]">add</Icon>
            New Workflow
          </button>
        </div>
      )}
      {/* Theme toggle at bottom of sidebar */}
      <div className="px-4 pb-5 flex items-center gap-2">
        <DarkToggle />
        <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-white/30 font-mono uppercase tracking-widest">Theme</span>
      </div>
    </aside>
  );
}

/* ─── Mobile nav drawer ──────────────────────────── */
function MobileNav({ open, onClose, onCreateWorkflow }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const go = (path) => { navigate(path); onClose(); };

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', exact: true },
    { icon: 'account_tree', label: 'Workflows', path: '/workflows' },
    { icon: 'receipt_long', label: 'Action Logs', path: '/logs' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-scrim/30 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed top-0 left-0 h-full w-72 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl flex flex-col shadow-2xl border-r border-gray-200/50 dark:border-white/5 md:hidden"
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200 dark:border-white/10">
              <img src="/logo/automataX.png" alt="automataX" className="h-6 w-auto object-contain dark:brightness-200" />
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200 dark:bg-[#222230] transition-colors">
                <Icon className="text-[20px] text-gray-500 dark:text-gray-400">close</Icon>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map(({ icon, label, path, exact }) => (
                  <NavItem
                    key={path}
                    icon={icon}
                    label={label}
                    active={exact ? location.pathname === path : location.pathname.startsWith(path)}
                    onClick={() => go(path)}
                  />
                ))}
              </ul>
            </nav>
            <div className="px-3 pb-5 space-y-2 border-t border-gray-200 dark:border-white/10 pt-4">
              {onCreateWorkflow && (
                <button
                  onClick={() => { onCreateWorkflow(); onClose(); }}
                  className="w-full py-3 rounded-xl font-label text-[11px] font-bold text-white uppercase tracking-widest flex justify-center items-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#ff4a00,#e04200)', boxShadow: '0 0 15px rgba(255,74,0,0.2)' }}
                >
                  <Icon className="text-[18px]">add</Icon>
                  New Workflow
                </button>
              )}
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-error hover:bg-error/5 transition-all text-[10px] uppercase font-semibold tracking-wider flex justify-center items-center gap-1.5"
              >
                <Icon className="text-[18px]">logout</Icon>
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── AppLayout ───────────────────────────────────── */
export default function AppLayout({ children, title, subtitle, extra }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toast = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleCreateWorkflow = async () => {
    try {
      const newWf = await apiClient('/workflows', {
        method: 'POST',
        body: JSON.stringify({ name: `New Workflow ${Date.now()}`, description: 'Auto-generated workflow' }),
      });
      navigate(`/editor/${newWf.workflow._id}`);
    } catch (err) {
      toast.error('Failed to create workflow: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFF8F3] dark:bg-gray-950 font-body text-gray-900 dark:text-white transition-colors duration-200">
      {/* Desktop Sidebar */}
      <AppSidebar onCreateWorkflow={handleCreateWorkflow} extra={extra} />

      {/* Mobile Drawer */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onCreateWorkflow={handleCreateWorkflow}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white/40 dark:bg-black/20 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-between px-4 sm:px-6 h-14 shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 -ml-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Open navigation"
            >
              <Icon className="text-[22px]">menu</Icon>
            </button>
            {title && (
              <div>
                <h1 className="font-headline text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{title}</h1>
                {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DarkToggle />
            <ProfileDropdown user={user} onLogout={logout} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 lg:p-9 pb-16">
          <div className="max-w-6xl mx-auto space-y-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
