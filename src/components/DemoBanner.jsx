import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';

export default function DemoBanner() {
  const { session, logout, loginDemo } = useAuth();
  const { resetDemo } = useData();
  const navigate = useNavigate();
  const [switchOverlay, setSwitchOverlay] = useState(null); // 'admin' | 'user' | null

  const isAdmin = session?.type === 'admin';
  const roleLabel = isAdmin ? 'Admin' : 'User';

  const handleReset = useCallback(() => {
    try {
      sessionStorage.removeItem('justedge-demo-tutorial-done-admin');
      sessionStorage.removeItem('justedge-demo-tutorial-done-user');
    } catch {
      /* ignore */
    }
    if (typeof resetDemo === 'function') resetDemo();
    const type = session?.type === 'admin' ? 'admin' : 'user';
    loginDemo(type);
    navigate(type === 'admin' ? '/demo/admin/dashboard' : '/demo/user/overview', {
      replace: true,
    });
  }, [session?.type, loginDemo, navigate, resetDemo]);

  const switchDashboard = useCallback(() => {
    const next = session?.type === 'admin' ? 'user' : 'admin';
    setSwitchOverlay(next);
    // Hold the overlay ~5s, then switch role + route
    window.setTimeout(() => {
      loginDemo(next);
      navigate(
        next === 'admin' ? '/demo/admin/dashboard' : '/demo/user/overview',
        { replace: true }
      );
      setSwitchOverlay(null);
    },1500);
  }, [session?.type, loginDemo, navigate]);

  const exitDemo = useCallback(() => {
    navigate('/', { replace: true });
    queueMicrotask(() => logout());
  }, [logout, navigate]);

  if (!session?.isDemo) return null;

  return (
    <>
      <div className="demo-banner" role="status">
        <div className="demo-banner-info">
          <span className="demo-banner-badge">Demo · {roleLabel}</span>
          <span className="demo-banner-text">
            Sample data only — separate from real accounts. Nothing is written to
            the live fleet or AWS.
          </span>
        </div>
        <div className="demo-banner-actions">
          <button
            type="button"
            className="demo-banner-btn"
            onClick={switchDashboard}
            disabled={!!switchOverlay}
          >
            Switch to {isAdmin ? 'User' : 'Admin'}
          </button>
          <button type="button" className="demo-banner-btn" onClick={handleReset} disabled={!!switchOverlay}>
            Reset
          </button>
          <button type="button" className="demo-banner-btn" onClick={exitDemo} disabled={!!switchOverlay}>
            Exit
          </button>
        </div>
      </div>

      {switchOverlay && (
        <div className="demo-switch-overlay" role="alertdialog" aria-live="polite" aria-busy="true">
          <div className="demo-switch-card">
            <div className="demo-switch-spinner" aria-hidden="true" />
            <div className="demo-switch-title">
              {switchOverlay === 'admin'
                ? 'Loading admin dashboard…'
                : 'Loading user dashboard…'}
            </div>
            <div className="demo-switch-sub">Preparing sample data for the demo</div>
          </div>
        </div>
      )}
    </>
  );
}
