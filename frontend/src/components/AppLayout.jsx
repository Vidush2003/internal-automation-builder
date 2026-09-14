import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';
import { useToast } from './Overlays';
import { AnimatePresence, motion } from 'framer-motion';
import CommandPalette from './CommandPalette';

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
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white/80"
      aria-label="Toggle theme"
    >
      <Icon className="text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</Icon>
    </button>
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
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm" style={{ background: 'linear-gradient(135deg,#ff4a00,#c73800)' }}>
          {initial}
        </div>
        <Icon className={`text-[16px] text-gray-400 dark:text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>expand_more</Icon>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#111115] border border-black/5 dark:border-white/10 rounded-xl shadow-premium overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Icon className="text-[18px]">manage_accounts</Icon>
                Account settings
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Icon className="text-[18px]">credit_card</Icon>
                Billing
              </button>
              <div className="my-1 border-t border-black/5 dark:border-white/5" />
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
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

/* ─── Nav Item ─────────────────────────────────── */
function NavItem({ icon, label, active, onClick, collapsed = false }) {
  return (
    <li>
      <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-[#ff4a00]/10 text-[#ff4a00]'
            : 'text-gray-500 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white hover:text-gray-900'
        }`}
      >
        <Icon className={`text-[18px] shrink-0 ${active ? 'text-[#ff4a00]' : ''}`}>{icon}</Icon>
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    </li>
  );
}

/* ─── Sidebar ──────────────────────────────────── */
function AppSidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const go = (path) => navigate(path);
  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <aside className={`hidden md:flex flex-col shrink-0 h-screen bg-background-light dark:bg-[#0a0a0f] border-r border-black/5 dark:border-white/10 overflow-y-auto z-20 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Brand */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5 px-5'} py-4 border-b border-black/5 dark:border-white/5 min-h-[56px]`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden relative flex items-center justify-center">
            <img src="/logo/automataX.png" alt="X" className="absolute left-1 h-6 w-auto max-w-none object-cover object-left dark:brightness-200" />
          </div>
        ) : (
          <img src="/logo/automataX.png" alt="automataX" className="h-6 w-auto object-contain dark:brightness-200" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-x-hidden">
        
        {/* WORKSPACE */}
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Workspace</p>}
          <ul className="space-y-0.5">
            <NavItem icon="dashboard" label="Dashboard" active={isActive('/dashboard', true)} onClick={() => go('/dashboard')} collapsed={collapsed} />
            <NavItem icon="account_tree" label="Workflows" active={isActive('/workflows')} onClick={() => go('/workflows')} collapsed={collapsed} />
            <NavItem icon="receipt_long" label="Executions" active={isActive('/logs')} onClick={() => go('/logs')} collapsed={collapsed} />
          </ul>
        </div>

        {/* TOOLS */}
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">Tools</p>}
          <ul className="space-y-0.5">
            <NavItem icon="description" label="Resume Analyzer" active={isActive('/resume-analyzer')} onClick={() => go('/resume-analyzer')} collapsed={collapsed} />
            <NavItem icon="extension" label="Integrations" active={isActive('/integrations')} onClick={() => go('/integrations')} collapsed={collapsed} />
            <NavItem icon="view_quilt" label="Templates" active={isActive('/templates')} onClick={() => go('/templates')} collapsed={collapsed} />
          </ul>
        </div>

        {/* SYSTEM */}
        <div>
          {!collapsed && <p className="px-3 mb-2 text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-500">System</p>}
          <ul className="space-y-0.5">
            <NavItem icon="settings" label="Settings" active={isActive('/settings')} onClick={() => go('/settings')} collapsed={collapsed} />
            <NavItem icon="help" label="Help" active={isActive('/help')} onClick={() => go('/help')} collapsed={collapsed} />
          </ul>
        </div>

      </nav>
    </aside>
  );
}

/* ─── AppLayout ───────────────────────────────────── */
export default function AppLayout({ children, extra }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background font-body text-gray-900 dark:text-white transition-colors duration-200">
      
      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />

      {/* Desktop Sidebar */}
      <AppSidebar collapsed={sidebarCollapsed} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        
        {/* Top bar */}
        <header className="bg-background-light/80 dark:bg-background/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 sm:px-6 h-14 shrink-0 z-30 transition-all">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Icon className="text-[20px]">menu_open</Icon>
            </button>
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Open navigation"
            >
              <Icon className="text-[20px]">menu</Icon>
            </button>
            
            {/* Search / Command Palette Trigger */}
            <button 
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm text-gray-400 hover:border-black/10 dark:hover:border-white/20 transition-all max-w-xs w-full"
            >
              <Icon className="text-[16px]">search</Icon>
              <span className="flex-1 text-left">Search...</span>
              <div className="flex items-center gap-1 text-[10px] font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                <span>Ctrl</span><span>K</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => toast.info('No new notifications')} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <Icon className="text-[18px]">notifications</Icon>
            </button>
            <button onClick={() => navigate('/help')} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <Icon className="text-[18px]">help</Icon>
            </button>
            <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
            <DarkToggle />
            <ProfileDropdown user={user} onLogout={logout} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50/30 dark:bg-transparent">
          <div className="h-full w-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
