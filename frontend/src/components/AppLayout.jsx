import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export default function AppLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleCreateWorkflow = async () => {
    try {
      const newWf = await apiClient('/workflows', {
        method: 'POST',
        body: JSON.stringify({ name: `New Workflow ${Date.now()}`, description: 'Auto-generated workflow' })
      });
      navigate(`/editor/${newWf.workflow._id}`);
    } catch (err) {
      alert('Failed to create workflow: ' + err.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body text-on-background w-full select-none">
      {/* SideNavBar */}
      <nav className="hidden md:flex bg-surface-container-low docked left-0 h-screen w-64 fixed left-0 top-0 h-full flex-col p-6 z-40 border-r border-outline-variant/10">
        <div className="mb-12 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-headline font-bold text-xl shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'W'}
          </div>
          <div>
            <h1 className="font-headline text-lg font-semibold text-on-background leading-tight truncate max-w-[150px]">{user?.name || 'Workspace'}</h1>
            <p className="font-label uppercase tracking-widest text-[10px] text-on-secondary-container">Automata Suite</p>
          </div>
        </div>

        <ul className="flex-1 space-y-2">
          <li>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full px-4 py-3 flex items-center gap-3 font-label uppercase tracking-widest text-[10px] transition-all duration-300 rounded-xl ${
                location.pathname === '/dashboard'
                  ? 'bg-secondary-container text-primary font-bold shadow-sm'
                  : 'text-on-secondary-container hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === '/dashboard' ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/workflows')}
              className={`w-full px-4 py-3 flex items-center gap-3 font-label uppercase tracking-widest text-[10px] transition-all duration-300 rounded-xl ${
                location.pathname.startsWith('/workflows') || location.pathname.startsWith('/editor')
                  ? 'bg-secondary-container text-primary font-bold shadow-sm'
                  : 'text-on-secondary-container hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname.startsWith('/workflows') || location.pathname.startsWith('/editor') ? "'FILL' 1" : "'FILL' 0" }}>account_tree</span>
              Workflows
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate('/logs')}
              className={`w-full px-4 py-3 flex items-center gap-3 font-label uppercase tracking-widest text-[10px] transition-all duration-300 rounded-xl ${
                location.pathname.startsWith('/logs')
                  ? 'bg-secondary-container text-primary font-bold shadow-sm'
                  : 'text-on-secondary-container hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname.startsWith('/logs') ? "'FILL' 1" : "'FILL' 0" }}>receipt_long</span>
              Action Logs
            </button>
          </li>
        </ul>

        <div className="space-y-4">
          <button
            onClick={handleCreateWorkflow}
            className="btn-primary w-full py-3 rounded-xl font-label uppercase tracking-widest text-[10px] font-semibold shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Workflow
          </button>
          
          <button
            onClick={logout}
            className="w-full py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-error hover:bg-error/5 transition-all text-[10px] uppercase font-semibold tracking-wider flex justify-center items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden relative">
        {/* TopNavBar */}
        <header className="bg-surface text-primary font-headline font-display text-on-surface bg-surface-container-low border-b border-outline-variant/10 flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-display font-bold text-primary">automataX</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs text-on-surface-variant font-label uppercase tracking-wider">{user?.email}</span>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden cursor-pointer border border-outline-variant/20 flex items-center justify-center bg-primary/10 text-primary font-headline font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Canvas / Main Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 pb-24 w-full">
          <div className="max-w-5xl mx-auto space-y-10 w-full">
            {(title || subtitle) && (
              <header className="space-y-4">
                <h2 className="font-headline text-4xl text-on-background tracking-tight">{title}</h2>
                {subtitle && <p className="font-body text-on-surface-variant text-lg max-w-2xl">{subtitle}</p>}
              </header>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
