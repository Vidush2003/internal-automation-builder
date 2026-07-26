import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * Shared toast + confirm-dialog system.
 * Replaces native alert()/confirm() calls, which are unstyled, block the JS
 * thread, and don't match the rest of the product's design language.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Workflow saved');
 *   toast.error('Save failed: ' + err.message);
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: 'Delete workflow?', description: '...', danger: true });
 *   if (!ok) return;
 */

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

export function OverlayProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolverRef = useRef(null);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, variant) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, variant }]);
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const toast = {
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
    info: (message) => push(message, 'info'),
  };

  const confirm = useCallback(({ title, description, confirmLabel = 'Confirm', danger = false } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmState({ title, description, confirmLabel, danger });
    });
  }, []);

  const resolveConfirm = (value) => {
    if (resolverRef.current) resolverRef.current(value);
    resolverRef.current = null;
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {/* Toast stack */}
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border font-body text-sm animate-toast-in ${
                t.variant === 'success'
                  ? 'bg-surface border-primary/20 text-on-surface'
                  : t.variant === 'error'
                  ? 'bg-surface border-error/30 text-on-surface'
                  : 'bg-surface border-outline-variant/30 text-on-surface'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[18px] mt-0.5 ${
                  t.variant === 'success' ? 'text-primary' : t.variant === 'error' ? 'text-error' : 'text-on-surface-variant'
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {t.variant === 'success' ? 'check_circle' : t.variant === 'error' ? 'error' : 'info'}
              </span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-on-surface-variant hover:text-on-surface"
                aria-label="Dismiss notification"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))}
        </div>

        {/* Confirm dialog */}
        {confirmState && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-scrim/40 backdrop-blur-[2px]"
              onClick={() => resolveConfirm(false)}
            />
            <div className="relative w-full max-w-sm bg-surface rounded-xl shadow-lg border border-outline-variant/20 p-6 flex flex-col gap-4">
              {confirmState.title && (
                <h3 className="font-headline text-lg font-semibold text-on-background">{confirmState.title}</h3>
              )}
              {confirmState.description && (
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">{confirmState.description}</p>
              )}
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => resolveConfirm(false)}
                  className="px-4 py-2 rounded-lg font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => resolveConfirm(true)}
                  autoFocus
                  className={`px-4 py-2 rounded-lg font-label text-sm font-semibold transition-colors ${
                    confirmState.danger
                      ? 'bg-error text-on-error hover:opacity-90'
                      : 'bg-primary text-on-primary hover:opacity-90'
                  }`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within OverlayProvider');
  return ctx;
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within OverlayProvider');
  return ctx;
}
