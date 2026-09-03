import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';

export default function DemoBanner() {
  const { session, logout, loginDemo } = useAuth();
  const { resetDemo } = useData();
  const navigate = useNavigate();

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
    loginDemo(next);
    navigate(
      next === 'admin' ? '/demo/admin/dashboard' : '/demo/user/overview',
      { replace: true }
    );
  }, [session?.type, loginDemo, navigate]);

  const exitDemo = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  if (!session?.isDemo) return null;

  const btnStyle = {
    border: '1px solid rgba(255,255,255,0.55)',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div
      role="status"
      style={{
        position: 'relative',
        flex: '0 0 auto',
        width: '100%',
        zIndex: 9000,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '8px 14px',
        background: 'linear-gradient(90deg, #0f766e, #c2410c)',
        color: '#fff',
        fontSize: 13,
        lineHeight: 1.4,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            flexShrink: 0,
            fontWeight: 700,
            letterSpacing: '0.04em',
            fontSize: 11,
            textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: 999,
          }}
        >
          Demo · {roleLabel}
        </span>
        <span style={{ opacity: 0.95 }}>
          Sample data only — separate from real accounts. Nothing is written to
          the live fleet or AWS.
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" onClick={switchDashboard} style={btnStyle}>
          Switch to {isAdmin ? 'User' : 'Admin'} dashboard
        </button>
        <button type="button" onClick={handleReset} style={btnStyle}>
          Reset demo
        </button>
        <button type="button" onClick={exitDemo} style={btnStyle}>
          Exit demo
        </button>
      </div>
    </div>
  );
}
