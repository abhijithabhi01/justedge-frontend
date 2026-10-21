import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  forgotPasswordAPI,
  resetPasswordAPI,
  forgotPasskeyAPI,
  resetPasskeyAPI,
  googleLoginAPI,
} from '../api/allAPIs.js';

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
        background: 'rgba(15, 23, 42, 0.35)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '3px solid rgba(148, 163, 184, 0.35)',
          borderTopColor: '#2563eb',
          animation: 'justedge-login-spin 0.7s linear infinite',
        }}
      />
      <div style={{ marginTop: 16, color: '#0f172a', fontWeight: 600, fontSize: 14 }}>
        {label || 'Signing in…'}
      </div>
      <style>{`@keyframes justedge-login-spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}

const fieldWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '0 12px',
  height: 48,
  background: '#fff',
};

const inputBare = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#0f172a',
  height: '100%',
  minWidth: 0,
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 6,
};

const primaryBtn = {
  width: '100%',
  height: 48,
  border: 'none',
  borderRadius: 10,
  background: '#2563eb',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const ghostBtn = {
  width: '100%',
  height: 44,
  border: 'none',
  borderRadius: 10,
  background: 'transparent',
  color: '#64748b',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  marginTop: 8,
};

const linkBtn = {
  border: 'none',
  background: 'none',
  color: '#2563eb',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  padding: 0,
};

export default function LoginPage({ onBack }) {
  const { login, verifyPasskey, setupPasskey, skipPasskeySetup, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(session?.needsPasskeySetup ? 'setup' : 'credentials');
  const [pendingToken, setPendingToken] = useState('');
  const [passkey, setPasskey] = useState('');
  const [passkeyConfirm, setPasskeyConfirm] = useState('');
  const [adminHint, setAdminHint] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPasskey, setShowPasskey] = useState(false);
  const [recovery, setRecovery] = useState(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (session?.needsPasskeySetup) setStep('setup');
  }, [session?.needsPasskeySetup]);

  async function submitCredentials(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim()) return setError('Enter your email address.');
    if (!password.trim()) return setError('Enter your password.');
    setBusy(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.requiresPasskey) {
        setPendingToken(result.pendingToken);
        setAdminHint(result.admin);
        setPasskey('');
        setRecovery(null);
        setStep('verify');
        return;
      }
      if (result?.needsPasskeySetup) {
        setStep('setup');
        setPasskey('');
        setPasskeyConfirm('');
        setRecovery(null);
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
    if (!/^\d{6}$/.test(passkey)) return setError('Enter your 6-digit passkey.');
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
    if (!/^\d{6}$/.test(passkey)) return setError('Passkey must be 6 digits.');
    if (passkey !== passkeyConfirm) return setError('Passkey confirmation does not match.');
    setBusy(true);
    try {
      await setupPasskey(passkey, passkeyConfirm);
    } catch (err) {
      setError(err.message || 'Could not save passkey.');
    } finally {
      setBusy(false);
    }
  }

  function ErrorBox() {
    if (!error) return null;
    return (
      <div
        style={{
          background: '#fef2f2',
          color: '#b91c1c',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {error}
      </div>
    );
  }

  function InfoBox() {
    if (!info) return null;
    return (
      <div
        style={{
          background: '#eff6ff',
          color: '#1d4ed8',
          border: '1px solid #bfdbfe',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {info}
      </div>
    );
  }

  function EyeToggle({ show, onToggle }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 4,
          cursor: 'pointer',
          display: 'flex',
          color: '#94a3b8',
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    );
  }


  async function handleGoogleCredential(idToken) {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const result = await googleLoginAPI(idToken);
      // Mirror password-login flow via AuthContext by reusing session paths:
      // AuthContext login sets session; for Google we need similar handling.
      // Call through a custom path: if requiresPasskey, same as password login.
      if (result?.requiresPasskey) {
        setPendingToken(result.pendingToken);
        setAdminHint(result.admin);
        setPasskey('');
        setRecovery(null);
        setStep('verify');
        return;
      }
      // Persist session like AuthContext would — dispatch via window event or use login-like storage
      // Prefer: expose loginWithGoogle from context. For now apply same localStorage shape.
      const account = result.admin || result.user;
      const type = result.admin ? 'admin' : 'user';
      const sessionPayload = {
        type,
        token: result.token,
        name: account?.name,
        role: account?.role,
        account,
        needsPasskeySetup: !!result.needsPasskeySetup,
        adminId: type === 'admin' ? account?.id : undefined,
        userId: type === 'user' ? account?.id : undefined,
      };
      localStorage.setItem('justedge-session-v2', JSON.stringify(sessionPayload));
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  function startGoogleSignIn() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google sign-in is not configured (VITE_GOOGLE_CLIENT_ID).');
      return;
    }

    function removeOverlay() {
      document.getElementById('justedge-google-overlay')?.remove();
    }

    function showGoogleButtonOverlay() {
      removeOverlay();
      const wrap = document.createElement('div');
      wrap.id = 'justedge-google-overlay';
      wrap.style.cssText =
        'position:fixed;inset:0;background:rgba(15,23,42,0.4);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)';
      wrap.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:28px 24px 20px;width:100%;max-width:360px;box-shadow:0 20px 50px rgba(15,23,42,0.2);border:1px solid #e2e8f0;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px">Sign in with Google</div>
          <div style="font-size:13px;color:#64748b;margin-bottom:20px;line-height:1.45">Use a Google account that already has a JustEdge login</div>
          <div id="google-btn-mount" style="display:flex;justify-content:center;min-height:44px"></div>
          <button type="button" id="google-cancel" style="
            margin-top:16px;width:100%;height:44px;border-radius:10px;border:1px solid #e2e8f0;
            background:#f8fafc;color:#475569;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer
          ">Cancel</button>
        </div>
      `;
      wrap.addEventListener('click', (e) => {
        if (e.target === wrap) removeOverlay();
      });
      document.body.appendChild(wrap);
      document.getElementById('google-cancel').onclick = removeOverlay;
      window.google.accounts.id.renderButton(document.getElementById('google-btn-mount'), {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with',
        shape: 'pill',
      });
    }

    function ensureGis(cb) {
      if (window.google?.accounts?.id) return cb();
      const existing = document.querySelector('script[data-google-gis]');
      if (existing) {
        existing.addEventListener('load', () => cb());
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.dataset.googleGis = '1';
      s.onload = () => cb();
      document.head.appendChild(s);
    }

    ensureGis(() => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          removeOverlay();
          if (response?.credential) handleGoogleCredential(response.credential);
          else setError('Google sign-in was cancelled.');
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // Always use the styled overlay + official Google button (avoids unstyled One Tap fallback)
      showGoogleButtonOverlay();
    });
  }


  const card = {
    width: '100%',
    maxWidth: 420,
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e2e8f0',
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
    padding: '28px 28px 24px',
  };

  const titleMap = {
    credentials: !recovery
      ? 'Sign in to JustEdge'
      : recovery === 'forgot-password'
        ? 'Reset password'
        : 'Enter code',
    verify: !recovery
      ? 'Enter passkey'
      : recovery === 'forgot-passkey'
        ? 'Reset passkey'
        : 'Enter code',
    setup: 'Create admin passkey',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f8fafc',
      }}
    >
      {busy && <FullScreenLoader label={step === 'verify' ? 'Verifying…' : 'Please wait…'} />}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <img
            src="/brand/justedge-logo.png"
            alt="JustEdge"
            style={{ height: 40, width: 'auto', maxWidth: 180, objectFit: 'contain' }}
          />
        </div>
        {onBack && !recovery && step === 'credentials' && (
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            style={{
              ...linkBtn,
              color: '#64748b',
              marginBottom: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Back to home
          </button>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {titleMap[step] || 'Sign in'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
            {step === 'credentials' && !recovery && 'Manage your fleet, or view sensors assigned to you'}
            {step === 'credentials' && recovery === 'forgot-password' &&
              'Enter your email. If an account exists, we send a 6-digit code (admins and users).'}
            {step === 'credentials' && recovery === 'reset-password' &&
              'Use the code from your email and choose a new password.'}
            {step === 'verify' && !recovery &&
              (adminHint?.name
                ? `Welcome back, ${adminHint.name}. Enter your 6-digit admin passkey.`
                : 'Enter your 6-digit admin passkey to continue.')}
            {step === 'verify' && recovery === 'forgot-passkey' &&
              'We email a code to remove your admin passkey so you can sign in with password only.'}
            {step === 'verify' && recovery === 'reset-passkey' &&
              'Enter the 6-digit code to remove your admin passkey.'}
            {step === 'setup' &&
              'Protect your admin console with a 6-digit passkey. You can skip and set this up later.'}
          </div>
        </div>

        {step === 'credentials' && !recovery && (
          <form onSubmit={submitCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ErrorBox />
            <InfoBox />
            <div>
              <label style={labelStyle} htmlFor="login-email">Email</label>
              <div style={fieldWrap}>
                <Mail size={18} color="#94a3b8" />
                <input
                  id="login-email"
                  style={inputBare}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={busy}
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle} htmlFor="login-password">Password</label>
              <div style={fieldWrap}>
                <Lock size={18} color="#94a3b8" />
                <input
                  id="login-password"
                  style={inputBare}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={busy}
                  autoComplete="current-password"
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: 15, height: 15 }}
                />
                Remember me
              </label>
              <button
                type="button"
                style={linkBtn}
                disabled={busy}
                onClick={() => {
                  setRecovery('forgot-password');
                  setError('');
                  setInfo('');
                  setResetCode('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" style={primaryBtn} disabled={busy}>
              Sign In
            </button>

            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => startGoogleSignIn()}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 999,
                border: 'none',
                background: '#3c4043',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  width={16}
                  height={16}
                />
              </span>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Accounts are created by your administrator. There is no public sign-up.
            </p>
          </form>
        )}

        {step === 'credentials' && recovery === 'forgot-password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ErrorBox />
            <InfoBox />
            <div>
              <label style={labelStyle}>Email</label>
              <div style={fieldWrap}>
                <Mail size={18} color="#94a3b8" />
                <input
                  style={inputBare}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={busy}
                />
              </div>
            </div>
            <button
              type="button"
              style={primaryBtn}
              disabled={busy}
              onClick={async () => {
                setError('');
                setInfo('');
                if (!email.trim()) return setError('Enter your email.');
                setBusy(true);
                try {
                  const res = await forgotPasswordAPI(email.trim());
                  setInfo(res?.message || 'If an account exists, a code was sent.');
                  setRecovery('reset-password');
                } catch (err) {
                  setError(err.message || 'Could not send reset code.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Send reset code
            </button>
            <button
              type="button"
              style={ghostBtn}
              disabled={busy}
              onClick={() => {
                setRecovery(null);
                setError('');
                setInfo('');
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {step === 'credentials' && recovery === 'reset-password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ErrorBox />
            <InfoBox />
            <div>
              <label style={labelStyle}>Email</label>
              <div style={fieldWrap}>
                <Mail size={18} color="#94a3b8" />
                <input style={inputBare} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>6-digit code</label>
              <div style={fieldWrap}>
                <input
                  style={inputBare}
                  inputMode="numeric"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={busy}
                  autoFocus
                  placeholder="000000"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <div style={fieldWrap}>
                <Lock size={18} color="#94a3b8" />
                <input
                  style={inputBare}
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
                <EyeToggle show={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Confirm new password</label>
              <div style={fieldWrap}>
                <Lock size={18} color="#94a3b8" />
                <input
                  style={inputBare}
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                />
                <EyeToggle show={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)} />
              </div>
            </div>

            <button
              type="button"
              style={primaryBtn}
              disabled={busy}
              onClick={async () => {
                setError('');
                setInfo('');
                if (!/^\d{6}$/.test(resetCode)) return setError('Enter the 6-digit code.');
                if (newPassword.length < 8) return setError('Password must be at least 8 characters.');
                if (newPassword !== confirmNewPassword) return setError('Passwords do not match.');
                setBusy(true);
                try {
                  const res = await resetPasswordAPI({
                    email: email.trim(),
                    code: resetCode,
                    newPassword,
                  });
                  setInfo(res?.message || 'Password updated. Sign in with your new password.');
                  setRecovery(null);
                  setPassword('');
                  setResetCode('');
                  setNewPassword('');
                } catch (err) {
                  setError(err.message || 'Could not reset password.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Update password
            </button>
            <button type="button" style={ghostBtn} disabled={busy} onClick={() => setRecovery('forgot-password')}>
              Resend code
            </button>
            <button
              type="button"
              style={{ ...ghostBtn, marginTop: 0 }}
              disabled={busy}
              onClick={() => {
                setRecovery(null);
                setError('');
                setInfo('');
                setResetCode('');
                setNewPassword('');
              }}
            >
              Back to sign in
            </button>
          </div>
        )}

        {step === 'verify' && !recovery && (
          <form onSubmit={submitVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ErrorBox />
            <InfoBox />
            <div>
              <label style={labelStyle}>6-digit passkey</label>
              <div style={fieldWrap}>
                <Lock size={18} color="#94a3b8" />
                <input
                  style={inputBare}
                  type={showPasskey ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  disabled={busy}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <EyeToggle show={showPasskey} onToggle={() => setShowPasskey((v) => !v)} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                style={linkBtn}
                disabled={busy}
                onClick={() => {
                  setRecovery('forgot-passkey');
                  setError('');
                  setInfo('');
                  setResetCode('');
                  if (adminHint?.email) setEmail(adminHint.email);
                }}
              >
                Forgot passkey?
              </button>
            </div>
            <button type="submit" style={primaryBtn} disabled={busy}>
              Verify & continue
            </button>
            <button
              type="button"
              style={ghostBtn}
              disabled={busy}
              onClick={() => {
                setStep('credentials');
                setPendingToken('');
                setPasskey('');
                setError('');
                setInfo('');
                setRecovery(null);
              }}
            >
              Back to sign in
            </button>
          </form>
        )}

        {step === 'verify' && recovery === 'forgot-passkey' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ErrorBox />
            <InfoBox />
            <div>
              <label style={labelStyle}>Admin email</label>
              <div style={fieldWrap}>
                <Mail size={18} color="#94a3b8" />
                <input style={inputBare} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
              </div>
            </div>
            <button
              type="button"
              style={primaryBtn}
              disabled={busy}
              onClick={async () => {
                setError('');
                setInfo('');
                if (!email.trim()) return setError('Enter your admin email.');
                setBusy(true);
                try {
                  const res = await forgotPasskeyAPI(email.trim());
                  setInfo(res?.message || 'If an admin passkey exists, a code was sent.');
                  setRecovery('reset-passkey');
                } catch (err) {
                  setError(err.message || 'Could not send passkey reset code.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Send passkey reset code
            </button>
            <button
              type="button"
              style={ghostBtn}
              disabled={busy}
              onClick={() => {
                setRecovery(null);
                setError('');
                setInfo('');
              }}
            >
              Back to passkey
            </button>
          </div>
        )}

        {step === 'verify' && recovery === 'reset-passkey' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ErrorBox />
            <InfoBox />
            <div>
              <label style={labelStyle}>Email</label>
              <div style={fieldWrap}>
                <Mail size={18} color="#94a3b8" />
                <input style={inputBare} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>6-digit code</label>
              <div style={fieldWrap}>
                <input
                  style={inputBare}
                  inputMode="numeric"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={busy}
                  autoFocus
                />
              </div>
            </div>
            <button
              type="button"
              style={primaryBtn}
              disabled={busy}
              onClick={async () => {
                setError('');
                setInfo('');
                if (!/^\d{6}$/.test(resetCode)) return setError('Enter the 6-digit code.');
                setBusy(true);
                try {
                  const res = await resetPasskeyAPI({ email: email.trim(), code: resetCode });
                  setInfo(res?.message || 'Passkey removed. Sign in with your password.');
                  setRecovery(null);
                  setResetCode('');
                  setStep('credentials');
                  setPendingToken('');
                  setPasskey('');
                } catch (err) {
                  setError(err.message || 'Could not reset passkey.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Remove passkey
            </button>
            <button type="button" style={ghostBtn} disabled={busy} onClick={() => setRecovery('forgot-passkey')}>
              Resend code
            </button>
            <button
              type="button"
              style={{ ...ghostBtn, marginTop: 0 }}
              disabled={busy}
              onClick={() => {
                setRecovery(null);
                setError('');
                setInfo('');
              }}
            >
              Back to passkey
            </button>
          </div>
        )}

        {step === 'setup' && (
          <form onSubmit={submitSetup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ErrorBox />
            <div>
              <label style={labelStyle}>Passkey</label>
              <div style={fieldWrap}>
                <input
                  style={inputBare}
                  type={showPasskey ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={busy}
                  placeholder="6 digits"
                />
                <EyeToggle show={showPasskey} onToggle={() => setShowPasskey((v) => !v)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirm passkey</label>
              <div style={fieldWrap}>
                <input
                  style={inputBare}
                  type={showPasskey ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={passkeyConfirm}
                  onChange={(e) => setPasskeyConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={busy}
                  placeholder="Repeat 6 digits"
                />
              </div>
            </div>
            <button type="submit" style={primaryBtn} disabled={busy}>
              Save passkey
            </button>
            <button
              type="button"
              style={ghostBtn}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await skipPasskeySetup();
                } catch (err) {
                  setError(err.message || 'Could not skip.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Skip for now
            </button>
          </form>
        )}
      </div>
    </div>
  );
}