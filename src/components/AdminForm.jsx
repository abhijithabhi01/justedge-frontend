import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

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
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3.5px solid rgba(255,255,255,0.25)',
          borderTopColor: '#dd7c3f',
          animation: 'justedge-spin 0.75s linear infinite',
        }}
      />
      <div
        style={{
          marginTop: 16,
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: '0.02em',
        }}
      >
        {label || 'Please wait…'}
      </div>
      <style>{`@keyframes justedge-spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}

export default function AdminForm({ admin, onDone }) {
  const { adminAccounts, addAdmin, updateAdmin } = useData();
  const showToast = useToast();
  const editing = !!admin;

  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(sanitizePhone(admin?.phone || ''));
  const [companyName, setCompanyName] = useState(admin?.companyName || '');
  const [status, setStatus] = useState(admin?.status || 'invited');
  const [twoFactor, setTwoFactor] = useState(admin?.twoFactor ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);

  async function submit() {
    setError('');
    if (!name.trim()) {
      const msg = "Enter the admin's full name.";
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    if (!companyName.trim()) {
      const msg = 'Enter the company name.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      const msg = 'Enter a valid email address.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      const msg = 'Phone must be exactly 10 digits.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }
    if (
      !editing &&
      adminAccounts.some(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase()
      )
    ) {
      const msg = 'An admin account with that email already exists.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await updateAdmin(admin.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
          companyName: companyName.trim(),
          status,
          twoFactor,
        });
        showToast(`${name.trim()} updated`, 'success');
        onDone();
      } else {
        const result = await addAdmin({
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
          companyName: companyName.trim(),
          status,
          twoFactor,
        });
        showToast(
          `${name.trim()} account created for ${companyName.trim()}`,
          'success'
        );
        setCreatedCreds({
          name: name.trim(),
          email: email.trim(),
          companyName: companyName.trim(),
          tempPassword: result?.tempPassword || '',
          emailNote: result?.emailNote,
        });
      }
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.error ||
        'Could not save admin. Check the details and try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (createdCreds) {
    return (
      <div>
        <div
          className="form-error show"
          style={{
            background: '#e8f5e9',
            color: '#1b5e20',
            borderColor: '#a5d6a7',
            marginBottom: 12,
          }}
        >
          Admin account created. Share these sign-in details — the password
          will not be shown again.
          {createdCreds.emailNote ? (
            <div style={{ marginTop: 6, fontWeight: 500, opacity: 0.9 }}>
              Welcome email is sent in the background (may take a moment if SMTP
              is slow).
            </div>
          ) : null}
        </div>
        <div className="field">
          <label>Name</label>
          <input className="input" value={createdCreds.name} readOnly />
        </div>
        <div className="field">
          <label>Email / login</label>
          <input className="input" value={createdCreds.email} readOnly />
        </div>
        <div className="field">
          <label>Company</label>
          <input className="input" value={createdCreds.companyName} readOnly />
        </div>
        <div className="field">
          <label>Temporary password</label>
          <input
            className="input"
            value={createdCreds.tempPassword || '(not returned)'}
            readOnly
          />
        </div>
        <button type="button" className="btn btn-amber btn-block" onClick={onDone}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div>
      {busy && <FullScreenLoader label="Creating admin account…" />}
      {error ? <div className="form-error show">{error}</div> : null}

      <div className="field">
        <label>
          Full name <span className="req">*</span>
        </label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Doe"
        />
      </div>
      <div className="field">
        <label>
          Email <span className="req">*</span>
        </label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@company.com"
        />
      </div>
      <div className="field">
        <label>Phone (10 digits)</label>
        <input
          className="input"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={phone}
          onChange={(e) => setPhone(sanitizePhone(e.target.value))}
          placeholder="9876543210"
        />
      </div>
      <div className="field">
        <label>
          Company name <span className="req">*</span>
        </label>
        <input
          className="input"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Acme Cold Storage"
        />
      </div>
      <div className="field-row2">
        <div className="field">
          <label>Role</label>
          <input className="input" value="Admin" disabled />
        </div>
        <div className="field">
          <label>
            Status <span className="req">*</span>
          </label>
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div className="perm-row" style={{ padding: '11px 0' }}>
        <div>
          <div className="perm-row-label">Require two-factor authentication</div>
          <div className="perm-row-desc">
            Strongly recommended for Admin and Superadmin roles
          </div>
        </div>
        <div
          className={`switch${twoFactor ? ' on' : ''}`}
          onClick={() => setTwoFactor((v) => !v)}
          role="switch"
          aria-checked={twoFactor}
        />
      </div>

      <button
        type="button"
        className="btn btn-amber btn-block"
        onClick={submit}
        disabled={busy}
        style={{
          transition: 'transform .15s ease, box-shadow .15s ease, filter .15s ease',
        }}
        onMouseEnter={(e) => {
          if (busy) return;
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(221,124,63,.35)';
          e.currentTarget.style.filter = 'brightness(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.filter = '';
        }}
      >
        <svg>
          <use href={editing ? '#i-check' : '#i-plus'} />
        </svg>
        {busy ? 'Saving…' : editing ? 'Save changes' : 'Add admin'}
      </button>
    </div>
  );
}