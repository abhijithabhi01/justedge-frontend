import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';

const ConfirmContext = createContext(null);

// A single shared confirmation dialog for the whole app. Any component can
// call `const confirm = useConfirm(); const ok = await confirm({...})`
// instead of wiring up its own modal state — this keeps the "are you sure?"
// prompt consistent everywhere it's used (remove/suspend/resolve/etc).
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setState({
        title: options.title || 'Are you sure?',
        message: options.message || 'This action cannot be undone.',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        // Most confirmed actions here are destructive or access-changing,
        // so red/danger styling is the sane default; pass danger:false for
        // the rare reversible/positive one (e.g. "reactivate").
        danger: options.danger !== false,
      });
    });
  }, []);

  function settle(result) {
    setState(null);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} title={state?.title} onClose={() => settle(false)}>
        {state && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 20px' }}>
              {state.message}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => settle(false)}>{state.cancelLabel}</button>
              <button className={`btn ${state.danger ? 'btn-danger' : 'btn-amber'}`} onClick={() => settle(true)}>
                {state.confirmLabel}
              </button>
            </div>
          </>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}