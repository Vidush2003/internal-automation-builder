import React, { useEffect } from 'react';

/**
 * Slide-over nav drawer for screens below the `md` breakpoint.
 * Previously, the sidebar was `hidden md:flex` with no fallback at all —
 * mobile users had no way to navigate between Dashboard/Workflows/Logs,
 * no Create Workflow, no Sign Out. This is that fallback.
 */
export default function MobileDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] transition-opacity duration-300 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-scrim/40" onClick={onClose} />
      <div
        className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-surface-container-low shadow-2xl border-r border-outline-variant/15 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute top-4 right-4 p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        {children}
      </div>
    </div>
  );
}
