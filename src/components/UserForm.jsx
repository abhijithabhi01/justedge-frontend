import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Keep digits only, max 10 (Indian mobile style). */
function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function isValidPhone(value) {
  if (!value) return true;
  return /^\d{10}$/.test(value);
}

const selectWrapStyle = {
  position: 'relative',
  width: '100%',
};

const selectStyle = {
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  border: '1.5px solid var(--border)',
  borderRadius: 10,
  padding: '11px 40px 11px 12px',
  fontSize: 13.5,
  fontFamily: 'inherit',
  color: 'var(--text-main)',
  background: 'var(--surface)',
  outline: 'none',
  cursor: 'pointer',
  lineHeight: 1.35,
  transition: 'border-color .15s, box-shadow .15s',
};

const chevronStyle = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  width: 16,
  height: 16,
  color: 'var(--text-muted)',
  display: 'block',
};

function PrettySelect({ value, onChange, children, id }) {
  return (
    <div style={selectWrapStyle}>
      <select
        id={id}
        className="input"
        value={value}
        onChange={onChange}
        style={selectStyle}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--amber)';
          e.target.style.boxShadow = '0 0 0 3px rgba(221,124,63,.12)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {children}
      </select>
      <svg style={chevronStyle} viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function UserForm({ user, onDone }) {
  const { addUser, updateUser } = useData();
  const showToast = useToast();
  const editing = !!user;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(sanitizePhone(user?.phone || ''));
  const [role, setRole] = useState(user?.role || 'Viewer');
  const [status, setStatus] = useState(user?.status || 'invited');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);

  async function submit() {
    setError('');
    if (!name.trim()) {
      const msg = "Enter the user's full name.";
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
    if (phone && !isValidPhone(phone)) {
      const msg = 'Phone must be exactly 10 digits.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await updateUser(user.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
          role,
          status,
        });
        showToast(`${name.trim()} updated`, 'success');
        onDone();
      } else {
        const result = await addUser({
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
          role,
          status,
        });
        showToast(`${name.trim()} created`, 'success');
        setCreatedCreds({
          name: name.trim(),
          email: email.trim(),
          tempPassword: result?.tempPassword || '',
          role,
          status,
          phone: phone || '—',
        });
      }
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.error ||
        'Could not save user. Check the email and try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (createdCreds) {
    return (
      <div>
        <div className="form-error show" style={{ marginBottom: 12 }}>
          User created. Share these sign-in details — the password will not be shown again.
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
          <label>Phone</label>
          <input className="input" value={createdCreds.phone} readOnly />
        </div>
        <div className="field">
          <label>Role · Status</label>
          <input
            className="input"
            value={`${createdCreds.role} · ${createdCreds.status}`}
            readOnly
          />
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
      {error ? <div className="form-error show">{error}</div> : null}

      <div className="field">
        <label>
          Full name <span className="req">*</span>
        </label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
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
          placeholder="jane@company.com"
          autoComplete="email"
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
          autoComplete="tel"
        />
      </div>

      <div className="field">
        <label>
          Role <span className="req">*</span>
        </label>
        <PrettySelect value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Viewer">Viewer</option>
          <option value="Operator">Operator</option>
          <option value="Manager">Manager</option>
        </PrettySelect>
      </div>

      <div className="field">
        <label>
          Status <span className="req">*</span>
        </label>
        <PrettySelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </PrettySelect>
      </div>

      <button
        type="button"
        className="btn btn-amber btn-block"
        onClick={submit}
        disabled={busy}
        style={{ marginTop: 4 }}
      >
        {busy ? 'Saving…' : editing ? 'Save changes' : '+ Create user'}
      </button>
    </div>
  );
}