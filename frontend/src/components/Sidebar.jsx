import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavItem({ icon, label, active, onClick }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full px-4 py-3 flex items-center gap-3 font-label uppercase tracking-widest text-[10px] transition-all duration-300 rounded-xl ${
          active
            ? 'bg-secondary-container text-primary font-bold shadow-sm'
            : 'text-on-secondary-container hover:bg-gray-200 dark:bg-[#222230]'
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
          {icon}
        </span>
        {label}
      </button>
    </li>
  );
}

/**
 * Shared app navigation: brand header, primary nav links, Create Workflow,
 * Sign Out. Used verbatim on every authenticated screen (including the
 * workflow editor) so the user always has a way back to Dashboard/Workflows/
 * Logs and the sidebar never silently disappears.
 *
 * `extra` lets a page (e.g. the editor's node palette) append its own
 * section below the primary nav without duplicating the brand/nav/signout code.
 */
export default function Sidebar({ onCreateWorkflow, extra, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const go = (path) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex flex-col h-full p-6 pt-20">
      <div className="mb-7 px-4">
        <p className="font-label uppercase tracking-[0.18em] text-[10px] font-bold text-gray-500 dark:text-gray-400">Workspace navigation</p>
      </div>

      <ul className="space-y-2">
        <NavItem
          icon="dashboard"
          label="Dashboard"
          active={location.pathname === '/dashboard'}
          onClick={() => go('/dashboard')}
        />
        <NavItem
          icon="account_tree"
          label="Workflows"
          active={location.pathname.startsWith('/workflows') || location.pathname.startsWith('/editor')}
          onClick={() => go('/workflows')}
        />
        <NavItem
          icon="receipt_long"
          label="Action Logs"
          active={location.pathname.startsWith('/logs')}
          onClick={() => go('/logs')}
        />
      </ul>

      {extra && <div className="flex-1 min-h-0 mt-8 overflow-y-auto">{extra}</div>}
      {!extra && <div className="flex-1" />}

      <div className="space-y-3 pt-6">
        {onCreateWorkflow && (
          <button
            onClick={onCreateWorkflow}
            className="btn-primary w-full py-3 rounded-xl font-label uppercase tracking-widest text-[10px] font-semibold shadow-sm hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create Workflow
          </button>
        )}

        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:text-error hover:bg-error/5 transition-all text-[10px] uppercase font-semibold tracking-wider flex justify-center items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}
