import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/helpers.js';
import { useSearchParams } from 'react-router-dom';

function SensorTicker() {
  const { sensors } = useData();
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (!sensors.length) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((v) => (v + 1) % sensors.length);
        setVisible(true);
      }, 260);
    }, 2600);
    return () => clearInterval(id);
  }, [sensors.length]);

  if (!sensors.length) return null;
  const s = sensors[i];

  return (
    <div className="login-ticker">
      <div className="login-ticker-label">Live from the fleet</div>
      <div className={`login-ticker-row${visible ? ' show' : ''}`}>
        <span className={`login-ticker-dot${s.status === 'online' ? ' on' : ''}`}></span>
        <span className="login-ticker-name">{s.name}</span>
        <span className="login-ticker-sep">·</span>
        <span className="login-ticker-val">{s.temp}°C</span>
        <span className="login-ticker-sep">·</span>
        <span className="login-ticker-val">{s.battery}% batt</span>
        <span className="login-ticker-sep">·</span>
        <span className={`login-ticker-status ${s.status}`}>{s.status}</span>
      </div>
      <div className="login-ticker-bar">
        <div className="login-ticker-bar-fill" key={i}></div>
      </div>
    </div>
  );
}

const BRAND_POINTS = [
  { icon: 'i-cpu', text: 'Monitor every sensor across every site, live' },
  { icon: 'i-shield', text: 'Fine-grained, per-user permissions' },
  { icon: 'i-zap', text: 'Automations that watch your fleet for you' },
];

export default function LoginPage({ onBack }) {
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter your email address.');
    if (!password.trim()) return setError('Enter your password.');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    }
  }

  function enterDemo(type) {
    setError('');
    loginDemo(type);
  }

  return (
    <div className="login-screen">
      <div className="login-panel-brand">
        <div className="login-brand-title">JustEdge</div>
        <div className="login-brand-byline">
          by JustEmbedded · a Susima Smaart Solutions company
        </div>
        <div className="login-brand-sub">
          IoT sensor monitoring for cold storage, offices, warehouses and
          everything in between.
        </div>
        <div className="login-brand-points">
          {BRAND_POINTS.map((p) => (
            <div className="login-brand-point" key={p.text}>
              <svg><use href={`#${p.icon}`} /></svg>
              {p.text}
            </div>
          ))}
        </div>
        <SensorTicker />
      </div>

      <div className="login-panel-form">
        {onBack && (
          <button type="button" className="login-back" onClick={onBack}>
            <svg style={{ width: 13, height: 13, transform: 'rotate(180deg)' }}>
              <use href="#i-chev" />
            </svg>
            Back to home
          </button>
        )}

        <div className="login-title">Sign in to JustEdge</div>
        <div className="login-sub">
          Manage your fleet, or view the sensors assigned to you
        </div>

        <form onSubmit={submit}>
          {error && <div className="form-error show">{error}</div>}
          <div className="field">
            <label>Email <span className="req">*</span></label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@justedge.io"
            />
          </div>
          <div className="field">
            <label>Password <span className="req">*</span></label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-amber btn-block" type="submit">
            <svg><use href="#i-check" /></svg>
            Sign in
          </button>
        </form>

        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid var(--border-soft, #e5e7eb)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-sub, #6b7280)',
              marginBottom: 12,
            }}
          >
            Try a demo
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-sub, #6b7280)',
              margin: '0 0 12px',
              lineHeight: 1.45,
            }}
          >
            Explore the console with sample data. Nothing is saved to the live
            system.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => enterDemo('admin')}
              style={{ justifyContent: 'flex-start', gap: 10 }}
            >
              <span
                className="entity-avatar"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                {initials('Demo Admin')}
              </span>
              <span style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: 13 }}>Demo Admin</strong>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  Fleet, users, sensors &amp; map
                </span>
              </span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => enterDemo('user')}
              style={{ justifyContent: 'flex-start', gap: 10 }}
            >
              <span
                className="entity-avatar"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                {initials('Demo User')}
              </span>
              <span style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: 13 }}>Demo User</strong>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                  Assigned sensors &amp; live GPS
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}