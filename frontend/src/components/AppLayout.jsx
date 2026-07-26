import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { useToast } from './Overlays';
import { AnimatePresence, motion } from 'framer-motion';

/* ─── Icon helper ─────────────────────────────── */
const Icon = ({ children, className = '' }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{children}</span>
);

/* ─── Nav Item ─────────────────────────────────── */
function NavItem({ icon, label, active, onClick, collapsed }) {
  return (
    <li>
      <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-label text-[11px] font-semibold uppercase tracking-widest transition-all duration-200 ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-background'
        }`}
      >
        <Icon className={`text-[20px] shrink-0 ${active ? 'text-primary' : ''}`}>{icon}</Icon>
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
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-container-highest transition-colors group"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline font-bold text-sm shrink-0 shadow-sm ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
          {initial}
        </div>
        <div className="hidden sm:block text-left leading-tight max-w-36">
          <p className="text-sm font-semibold text-on-background truncate">{user?.name || 'Workspace user'}</p>
          <p className="text-[10px] text-on-surface-variant truncate">{user?.email}</p>
        </div>
        <Icon className={`text-[18px] text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</Icon>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3.5 border-b border-outline-variant/10">
              <p className="text-sm font-semibold text-on-background truncate">{user?.name}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">{user?.email}</p>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors font-label">
                <Icon className="text-[18px]">manage_accounts</Icon>
                Account settings
              </button>
              <div className="my-1 border-t border-outline-variant/10" />
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-error hover:bg-error/8 transition-colors font-label font-semibold"
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
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-outline-variant/10">
        <span className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline font-bold shadow-sm">A</span>
        <span className="font-headline text-lg font-bold tracking-tight text-on-background">
          automata<span className="text-primary">X</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-3 font-label text-[9px] uppercase tracking-[.18em] font-bold text-on-surface-variant/60">Navigation</p>
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
        <div className="px-3 pb-4 border-t border-outline-variant/10 pt-4">
          <button
            onClick={onCreateWorkflow}
            className="btn-primary w-full py-3 rounded-xl font-label text-[11px] font-bold uppercase tracking-widest shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all flex justify-center items-center gap-2"
          >
            <Icon className="text-[18px]">add</Icon>
            New Workflow
          </button>
        </div>
      )}
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
            className="fixed top-0 left-0 h-full w-72 z-50 bg-surface flex flex-col shadow-2xl md:hidden"
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-outline-variant/10">
              <span className="font-headline font-bold text-lg text-on-background">
                automata<span className="text-primary">X</span>
              </span>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-container-highest transition-colors">
                <Icon className="text-[20px] text-on-surface-variant">close</Icon>
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
            <div className="px-3 pb-5 space-y-2 border-t border-outline-variant/10 pt-4">
              {onCreateWorkflow && (
                <button
                  onClick={() => { onCreateWorkflow(); onClose(); }}
                  className="btn-primary w-full py-3 rounded-xl font-label text-[11px] font-bold uppercase tracking-widest flex justify-center items-center gap-2"
                >
                  <Icon className="text-[18px]">add</Icon>
                  New Workflow
                </button>
              )}
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full py-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:text-error hover:bg-error/5 transition-all text-[10px] uppercase font-semibold tracking-wider flex justify-center items-center gap-1.5"
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
    <div className="flex h-screen overflow-hidden bg-background font-body text-on-background">
      {/* Desktop Sidebar */}
      <AppSidebar onCreateWorkflow={handleCreateWorkflow} extra={extra} />

      {/* Mobile Drawer */}
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onCreateWorkflow={handleCreateWorkflow}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/10 flex items-center justify-between px-4 sm:px-6 py-3 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 -ml-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              aria-label="Open navigation"
            >
              <Icon className="text-[22px]">menu</Icon>
            </button>
            {title && (
              <div>
                <h1 className="font-headline text-lg font-bold text-on-background tracking-tight leading-tight">{title}</h1>
                {subtitle && <p className="text-[11px] text-on-surface-variant hidden sm:block">{subtitle}</p>}
              </div>
            )}
          </div>

          <ProfileDropdown user={user} onLogout={logout} />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-9 pb-16">
          <div className="max-w-6xl mx-auto space-y-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
