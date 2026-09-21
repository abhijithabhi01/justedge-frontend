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

/** Module-level defer so DataContext can pause toasts while the global loader is up. */
let deferToasts = false;
const pendingQueue = [];
let flushListeners = new Set();

export function setToastDefer(active) {
  deferToasts = !!active;
  if (!deferToasts) {
    // Notify providers to flush
    flushListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    });
  }
}

/**
 * Global toast — top center via CSS.
 *
 *   showToast('Saved');
 *   showToast('Select a board type.', 'error');
 *   showToast('Sensor added', 'success');
 *
 * While the global busy overlay is active, success/info toasts are queued and
 * shown only after loading ends. Errors still show immediately.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map());
  const showImmediateRef = useRef(null);

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

  const showImmediate = useCallback(
    (message, toastType = 'info', duration = BASE_DURATION) => {
      if (!message) return;
      const text = String(message);

      setToasts((list) => {
        const existing = list.find((t) => t.message === text);
        if (existing) {
          scheduleDismiss(existing.id, duration);
          return list.map((t) =>
            t.id === existing.id ? { ...t, type: toastType } : t
          );
        }

        const id = ++idRef.current;
        let next = [...list, { id, message: text, type: toastType }];

        while (next.length > MAX_VISIBLE) {
          const removed = next.shift();
          clearTimer(removed.id);
        }

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

  showImmediateRef.current = showImmediate;

  // Register flush when defer ends
  React.useEffect(() => {
    const flush = () => {
      const batch = pendingQueue.splice(0, pendingQueue.length);
      batch.forEach(({ message, type, duration }) => {
        showImmediateRef.current?.(message, type, duration);
      });
    };
    flushListeners.add(flush);
    return () => {
      flushListeners.delete(flush);
    };
  }, []);

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

      // Errors always show immediately; success/info wait for loader
      if (deferToasts && toastType !== 'error') {
        pendingQueue.push({ message: text, type: toastType, duration });
        return;
      }

      showImmediate(text, toastType, duration);
    },
    [showImmediate]
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
    return (msg) => {
      if (msg) console.info('[toast]', msg);
    };
  }
  return ctx;
}
