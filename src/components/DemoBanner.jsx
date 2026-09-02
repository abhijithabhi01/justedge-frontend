import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';

export default function DemoBanner() {
  const { session, logout, loginDemo } = useAuth();
  const { resetDemo } = useData();

  if (!session?.isDemo) return null;

  const roleLabel = session.type === 'admin' ? 'Admin' : 'User';

  function handleReset() {
    try {
      sessionStorage.removeItem('justedge-demo-tutorial-done-admin');
      sessionStorage.removeItem('justedge-demo-tutorial-done-user');
    } catch {
      /* ignore */
    }
    if (typeof resetDemo === 'function') resetDemo();
    const type = session.type === 'admin' ? 'admin' : 'user';
    logout();
    setTimeout(() => loginDemo(type), 0);
  }

  return (
    <div
      role="status"
      style={{
        position: 'sticky',
        top: 0,
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
          Sample data only. Changes stay in this browser — other visitors still
          see the defaults. Nothing is written to the live fleet or AWS.
        </span>
      </div>
      <button
        type="button"
        onClick={handleReset}
        style={{
          border: '1px solid rgba(255,255,255,0.55)',
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Reset demo
      </button>
    </div>
  );
}