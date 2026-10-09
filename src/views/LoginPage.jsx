import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function FullScreenLoader({ label }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(6, 13, 24, 0.72)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '3.5px solid rgba(148, 163, 184, 0.25)',
          borderTopColor: '#3b82f6',
          animation: 'justedge-login-spin 0.7s linear infinite',
        }}
      />
      <div
        style={{
          marginTop: 18,
          color: '#e2e8f0',
          fontWeight: 600,
          fontSize: 14.5,
          letterSpacing: '0.02em',
        }}
      >
        {label || 'Signing in…'}
      </div>
      <style>{`@keyframes justedge-login-spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}

function SensorTicker() {
  const { sensors } = useData();
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!sensors.length) return undefined;
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
        <span className={`login-ticker-dot${s.status === 'online' ? ' on' : ''}`} />
        <span className="login-ticker-name">{s.name}</span>
        <span className="login-ticker-sep">·</span>
        <span className="login-ticker-val">{s.temp}°C</span>
        <span className="login-ticker-sep">·</span>
        <span className="login-ticker-val">{s.battery}% batt</span>
        <span className="login-ticker-sep">·</span>
        <span className={`login-ticker-status ${s.status}`}>{s.status}</span>
      </div>
      <div className="login-ticker-bar">
        <div className="login-ticker-bar-fill" key={i} />
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
  const { login, verifyPasskey, setupPasskey, skipPasskeySetup, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // credentials | verify | setup
  const [step, setStep] = useState(session?.needsPasskeySetup ? 'setup' : 'credentials');
  const [pendingToken, setPendingToken] = useState('');
  const [passkey, setPasskey] = useState('');
  const [passkeyConfirm, setPasskeyConfirm] = useState('');
  const [adminHint, setAdminHint] = useState(null);

  // If session arrives with needsPasskeySetup (e.g. refresh), show setup
  useEffect(() => {
    if (session?.needsPasskeySetup) setStep('setup');
  }, [session?.needsPasskeySetup]);

  async function submitCredentials(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Enter your email address.');
    if (!password.trim()) return setError('Enter your password.');
    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.requiresPasskey) {
        setPendingToken(result.pendingToken);
        setAdminHint(result.admin);
        setPasskey('');
        setStep('verify');
        return;
      }
      if (result?.needsPasskeySetup || result?.type === 'admin') {
        // Admin without passkey — offer setup (users go straight in via LoginRoute)
        if (result?.needsPasskeySetup) {
          setStep('setup');
          setPasskey('');
          setPasskeyConfirm('');
          return;
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setBusy(false);
    }
  }

  async function submitVerify(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(passkey)) {
      return setError('Enter your 6-digit passkey.');
    }
    setBusy(true);
    try {
      await verifyPasskey(pendingToken, passkey);
    } catch (err) {
      setError(err.message || 'Incorrect passkey.');
    } finally {
      setBusy(false);
    }
  }

  async function submitSetup(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(passkey)) {
      return setError('Passkey must be exactly 6 digits.');
    }
    if (passkey !== passkeyConfirm) {
      return setError('Passkeys do not match.');
    }
    setBusy(true);
    try {
      await setupPasskey(passkey, passkeyConfirm);
    } catch (err) {
      setError(err.message || 'Could not save passkey.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSkipSetup() {
    setBusy(true);
    setError('');
    try {
      await skipPasskeySetup();
    } catch (err) {
      setError(err.message || 'Could not skip.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      {busy && (
        <FullScreenLoader
          label={
            step === 'verify'
              ? 'Verifying passkey…'
              : step === 'setup'
                ? 'Saving passkey…'
                : 'Signing in…'
          }
        />
      )}

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
              <svg>
                <use href={`#${p.icon}`} />
              </svg>
              {p.text}
            </div>
          ))}
        </div>
        <SensorTicker />
      </div>

      <div className="login-panel-form">
        {onBack && step === 'credentials' && (
          <button type="button" className="login-back" onClick={onBack} disabled={busy}>
            <svg style={{ width: 13, height: 13, transform: 'rotate(180deg)' }}>
              <use href="#i-chev" />
            </svg>
            Back to home
          </button>
        )}

        {step === 'credentials' && (
          <>
            <div className="login-title">Sign in to JustEdge</div>
            <div className="login-sub">
              Manage your fleet, or view the sensors assigned to you
            </div>
            <form onSubmit={submitCredentials}>
              {error && <div className="form-error show">{error}</div>}
              <div className="field">
                <label>
                  Email <span className="req">*</span>
                </label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@justedge.io"
                  disabled={busy}
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label>
                  Password <span className="req">*</span>
                </label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy}
                  autoComplete="current-password"
                />
              </div>
              <button className="btn btn-amber btn-block" type="submit" disabled={busy}>
                <svg>
                  <use href="#i-check" />
                </svg>
                Sign in
              </button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="login-title">Enter passkey</div>
            <div className="login-sub">
              {adminHint?.name
                ? `Welcome back, ${adminHint.name}. Enter your 6-digit admin passkey.`
                : 'Enter your 6-digit admin passkey to continue.'}
            </div>
            <form onSubmit={submitVerify}>
              {error && <div className="form-error show">{error}</div>}
              <div className="field">
                <label>
                  6-digit passkey <span className="req">*</span>
                </label>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={passkey}
                  onChange={(e) =>
                    setPasskey(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="••••••"
                  disabled={busy}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              <button className="btn btn-amber btn-block" type="submit" disabled={busy}>
                Verify &amp; continue
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 10 }}
                disabled={busy}
                onClick={() => {
                  setStep('credentials');
                  setPendingToken('');
                  setPasskey('');
                  setError('');
                }}
              >
                Back to sign in
              </button>
            </form>
          </>
        )}

        {step === 'setup' && (
          <>
            <div className="login-title">Create admin passkey</div>
            <div className="login-sub">
              Protect your admin console with a 6-digit passkey. You can skip
              and set this up later.
            </div>
            <form onSubmit={submitSetup}>
              {error && <div className="form-error show">{error}</div>}
              <div className="field">
                <label>
                  New 6-digit passkey <span className="req">*</span>
                </label>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={passkey}
                  onChange={(e) =>
                    setPasskey(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="e.g. 482913"
                  disabled={busy}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div className="field">
                <label>
                  Confirm passkey <span className="req">*</span>
                </label>
                <input
                  className="input"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={passkeyConfirm}
                  onChange={(e) =>
                    setPasskeyConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="Re-enter 6 digits"
                  disabled={busy}
                  autoComplete="new-password"
                />
              </div>
              <button className="btn btn-amber btn-block" type="submit" disabled={busy}>
                Save passkey
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                style={{ marginTop: 10 }}
                disabled={busy}
                onClick={handleSkipSetup}
              >
                Skip for now
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
