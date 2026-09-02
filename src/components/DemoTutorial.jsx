import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const STORAGE_KEY = 'justedge-demo-tutorial-done';

const ADMIN_STEPS = [
  {
    title: 'Welcome to the Admin demo',
    body: 'This is sample data only. Changes stay in your browser — other visitors still see the defaults. Nothing is saved to the live fleet or AWS.',
  },
  {
    title: 'Dashboard overview',
    body: 'Start on Dashboard for KPIs: boards, online status, and live location when GPS demo data is running. Use the sidebar to move between sections.',
  },
  {
    title: 'Sensors',
    body: 'Open Sensors to see demo boards (GPS tracker + temperature). Click a card for live readings and the map pointer. GPS moves along a sample highway path when the Mongo simulator is running.',
  },
  {
    title: 'Users & permissions',
    body: 'Under Users, open a person to review permissions in the drawer. Toggles work in this demo session only and reset when you leave or another person starts a fresh demo.',
  },
  {
    title: 'Assign sensors',
    body: 'Assign Sensors links boards to users. In demo mode you can try the flow; it will not change production assignments.',
  },
  {
    title: 'You are ready',
    body: 'Explore freely. Sign out when finished. Use “Demo User” on the login page to see the end-user dashboard instead.',
  },
];

const USER_STEPS = [
  {
    title: 'Welcome to the User demo',
    body: 'You are viewing the experience of someone with assigned sensors. Sample data only — edits stay local to this browser session.',
  },
  {
    title: 'Overview & live map',
    body: 'Overview shows your sensor count, online status, average temperature, and a live location map when the GPS demo board is updating.',
  },
  {
    title: 'My Sensors',
    body: 'Open My Sensors for boards assigned to you. Select one to see temperature, battery, and GPS details in the side panel.',
  },
  {
    title: 'Alerts & automations',
    body: 'Alerts and Automations show how notifications and rules appear. Demo data may be empty — that is expected.',
  },
  {
    title: 'Your profile',
    body: 'Click your name in the sidebar for permissions (read-only here) and Sign out. Only an admin can change real permissions.',
  },
  {
    title: 'You are ready',
    body: 'Try the map and sensor cards. Sign out anytime. “Demo Admin” on login shows the fleet console.',
  },
];

export default function DemoTutorial() {
  const { session } = useAuth();
  const isDemo = !!session?.isDemo;
  const type = session?.type;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const steps = type === 'admin' ? ADMIN_STEPS : USER_STEPS;
  const storageKey = `${STORAGE_KEY}-${type || 'user'}`;

  useEffect(() => {
    if (!isDemo) return;
    try {
      if (sessionStorage.getItem(storageKey) === '1') return;
    } catch {
      /* ignore */
    }
    setStep(0);
    setOpen(true);
  }, [isDemo, type, storageKey]);

  if (!isDemo || !open) {
    if (!isDemo) return null;
    return (
      <button
        type="button"
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        title="Demo tutorial"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 9998,
          border: 'none',
          borderRadius: 999,
          padding: '10px 16px',
          background: 'var(--amber, #e85d04)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          cursor: 'pointer',
        }}
      >
        Demo guide
      </button>
    );
  }

  const current = steps[step];
  const isLast = step >= steps.length - 1;

  function finish() {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-tutorial-title"
        style={{
          width: 'min(420px, 100%)',
          background: 'var(--surface, #fff)',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #0f766e, #e85d04)',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 600 }}>
            DEMO · {type === 'admin' ? 'Admin console' : 'User dashboard'}
          </div>
          <div
            id="demo-tutorial-title"
            style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}
          >
            {current.title}
          </div>
        </div>

        <div style={{ padding: '18px 18px 8px' }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text, #1f2937)',
            }}
          >
            {current.body}
          </p>

          <div
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 16,
              justifyContent: 'center',
            }}
          >
            {steps.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === step ? 18 : 8,
                  height: 8,
                  borderRadius: 99,
                  background:
                    i === step
                      ? 'var(--amber, #e85d04)'
                      : 'var(--border, #e5e7eb)',
                  transition: 'width 0.15s ease',
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '12px 18px 18px',
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={finish}
            style={{ fontSize: 13 }}
          >
            Skip
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="btn btn-amber"
              onClick={() => {
                if (isLast) finish();
                else setStep((s) => s + 1);
              }}
            >
              {isLast ? 'Start exploring' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}