import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

const ToastContext = createContext(null);

const MAX_VISIBLE = 3;
const BASE_DURATION = 2200;
const MIN_DURATION = 900;

/**
 * Global toast — top center via CSS.
 *
 *   showToast('Saved');
 *   showToast('Select a board type.', 'error');
 *   showToast('Sensor added', 'success');
 *
 * Stack rules:
 * - Same message replaces the existing toast (no spam stack)
 * - At most MAX_VISIBLE toasts
 * - Older toasts get shorter remaining lifetime when new ones arrive
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());

  const clearTimer = useCallback((id) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id) => {
      clearTimer(id);
      setToasts((list) => list.filter((x) => x.id !== id));
    },
    [clearTimer]
  );

  const scheduleDismiss = useCallback(
    (id, ms) => {
      clearTimer(id);
      const handle = setTimeout(() => dismiss(id), ms);
      timersRef.current.set(id, handle);
    },
    [clearTimer, dismiss]
  );

  const showToast = useCallback(
    (messageOrOpts, type = 'info') => {
      let message = messageOrOpts;
      let toastType = type;
      let duration = BASE_DURATION;

      if (messageOrOpts && typeof messageOrOpts === 'object') {
        message = messageOrOpts.message || '';
        toastType = messageOrOpts.type || 'info';
        duration = messageOrOpts.duration ?? BASE_DURATION;
      }

      if (!message) return;
      const text = String(message);

      setToasts((list) => {
        // Replace existing toast with the same message (resets timer)
        const existing = list.find((t) => t.message === text);
        if (existing) {
          scheduleDismiss(existing.id, duration);
          return list.map((t) =>
            t.id === existing.id ? { ...t, type: toastType } : t
          );
        }

        const id = ++idRef.current;
        let next = [...list, { id, message: text, type: toastType }];

        // Drop oldest beyond max
        while (next.length > MAX_VISIBLE) {
          const removed = next.shift();
          clearTimer(removed.id);
        }

        // Newer toast: full duration. Older ones: shrink so they clear faster.
        next.forEach((t, index) => {
          const ageFromNewest = next.length - 1 - index;
          const ms =
            ageFromNewest === 0
              ? duration
              : Math.max(MIN_DURATION, duration - ageFromNewest * 700);
          scheduleDismiss(t.id, ms);
        });

        return next;
      });
    },
    [clearTimer, scheduleDismiss]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div
            className={`toast toast-${t.type || 'info'}`}
            key={t.id}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}