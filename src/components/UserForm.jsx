import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PERMISSION_DEFS, ADMIN_PERMISSION_DEFS } from '../lib/helpers.js';
import { updateUserPermissionsAPI } from '../api/allAPIs.js';

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

function defaultUserPermState() {
  const o = {};
  PERMISSION_DEFS.forEach((p) => {
    o[p.key] = p.locked ? true : p.key === 'exportData';
  });
  return o;
}

function defaultAdminPermState() {
  // Same privileges as a company Admin: users, sensors, fleet, logs, billing.
  // manageAdmins / manageAccessControl stay Superadmin-only.
  return {
    manageAdmins: false,
    manageAccessControl: false,
    viewActivityLogs: true,
    systemOversight: true,
    manageUsers: true,
    manageSensors: true,
    billingAccess: true,
    exportData: true,
  };
}

export default function UserForm({ user, onDone }) {
  const { addUser, updateUser, addAdmin } = useData();
  const { session, isSuperadmin } = useAuth();
  const token = session?.token;
  // Superadmin or Master Admin (manageAdmins) may invite admin accounts
  const canCreateAdmin =
    isSuperadmin ||
    !!session?.account?.permissions?.manageAdmins ||
    !!session?.permissions?.manageAdmins;

  const showToast = useToast();
  const editing = !!user;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(sanitizePhone(user?.phone || ''));
  // Create: User | Admin. Edit existing platform users stays as User account.
  const [accountType, setAccountType] = useState('User');
  // Superadmin → Master Admin company workspace fields
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [status, setStatus] = useState(user?.status || 'active');
  const [userPerms, setUserPerms] = useState(() => ({
    ...defaultUserPermState(),
    ...(user?.permissions || {}),
    monitor: true,
  }));
  const [adminPerms, setAdminPerms] = useState(() => defaultAdminPermState());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);

  const permDefs =
    accountType === 'Admin'
      ? isSuperadmin
        ? ADMIN_PERMISSION_DEFS
        : ADMIN_PERMISSION_DEFS.filter(
            (p) => p.key !== 'manageAdmins' && p.key !== 'manageAccessControl'
          )
      : PERMISSION_DEFS;
  const permState = accountType === 'Admin' ? adminPerms : userPerms;
  const setPermState = accountType === 'Admin' ? setAdminPerms : setUserPerms;

  const grantedCount = useMemo(
    () => permDefs.filter((p) => permState[p.key]).length,
    [permDefs, permState]
  );

  function togglePerm(key, locked) {
    if (locked) return;
    setPermState((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submit() {
    setError('');
    if (!name.trim()) {
      const msg = "Enter the person's full name.";
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
          status,
        });
        // Apply each permission that differs from the loaded user
        for (const p of PERMISSION_DEFS) {
          if (p.locked) continue;
          const desired = !!userPerms[p.key];
          const current = !!user?.permissions?.[p.key];
          if (desired !== current) {
            await updateUserPermissionsAPI(
              user.id,
              { key: p.key, value: desired },
              token
            );
          }
        }
        showToast(`${name.trim()} updated`, 'success');
        onDone();
      } else if (accountType === 'Admin') {
        if (!canCreateAdmin) {
          setError('Only a Master Admin can create admin accounts.');
          setBusy(false);
          return;
        }
        if (isSuperadmin && !companyNameInput.trim()) {
          setError('Company / organisation name is required for a Master Admin.');
          showToast('Enter the company name', 'error');
          setBusy(false);
          return;
        }
        const result = await addAdmin({
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
          role: 'Admin',
          companyName: isSuperadmin
            ? companyNameInput.trim()
            : (session?.companyName || session?.account?.companyName || ''),
          locationCity: isSuperadmin ? locationCity.trim() : undefined,
          locationState: isSuperadmin ? locationState.trim() : undefined,
          locationCountry: isSuperadmin ? locationCountry.trim() : undefined,
          companyAddress: isSuperadmin ? companyAddress.trim() : undefined,
          permissions: {
            manageAdmins: false,
            manageAccessControl: false,
            viewActivityLogs: true,
            systemOversight: true,
            manageUsers: true,
            manageSensors: true,
            billingAccess: true,
            exportData: true,
            ...adminPerms,
            ...(isSuperadmin ? {} : { manageAdmins: false, manageAccessControl: false }),
          },
        });
        showToast(`${name.trim()} admin created`, 'success');
        setCreatedCreds({
          name: name.trim(),
          email: email.trim(),
          tempPassword: result?.tempPassword || '',
          role: 'Admin',
          phone: phone || '—',
          kind: 'admin',
        });
      } else {
        const result = await addUser({
          name: name.trim(),
          email: email.trim(),
          phone: phone || '',
          permissions: { ...userPerms, monitor: true },
        });
        showToast(`${name.trim()} created`, 'success');
        setCreatedCreds({
          name: name.trim(),
          email: email.trim(),
          tempPassword: result?.tempPassword || '',
          role: 'User',
          phone: phone || '—',
          kind: 'user',
        });
      }
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.error ||
        'Could not save. Check the email and try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (createdCreds) {
    return (
      <div>
        <div className="form-error show" style={{ marginBottom: 12, borderColor: 'var(--good)', color: 'var(--good)' }}>
          Account created. Share these sign-in details — the password will not be shown again.
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
          <label>Account type</label>
          <input className="input" value={createdCreds.role} readOnly />
        </div>
        <div className="field">
          <label>Temporary password</label>
          <input
            className="input"
            value={createdCreds.tempPassword || '(sent by email if SMTP is configured)'}
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

      {!editing && (
        <div className="field">
          <label>
            Account type <span className="req">*</span>
          </label>
          <PrettySelect
            value={canCreateAdmin ? accountType : 'User'}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="User">User</option>
            {canCreateAdmin ? <option value="Admin">Admin</option> : null}
          </PrettySelect>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {!canCreateAdmin
              ? 'Creates an end-user login (My Sensors, alerts, automations).'
              : accountType === 'Admin'
                ? isSuperadmin
                  ? 'Creates a Master Admin for a company (can create & delete peer admins in that org).'
                  : 'Creates a peer Admin in your company (full ops except create/delete admins).'
                : 'Creates an end-user login (My Sensors, alerts, automations).'}
          </div>
        </div>
      )}

      {!editing && accountType === 'Admin' && isSuperadmin && (
        <>
          <div className="field">
            <label>
              Company / organisation <span className="req">*</span>
            </label>
            <input
              className="input"
              value={companyNameInput}
              onChange={(e) => setCompanyNameInput(e.target.value)}
              placeholder="Susima Smaart Solutions"
            />
          </div>
          <div className="field">
            <label>Company address</label>
            <input
              className="input"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Street, area"
            />
          </div>
          <div className="field">
            <label>City</label>
            <input
              className="input"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              placeholder="Bengaluru"
            />
          </div>
          <div className="field">
            <label>State / region</label>
            <input
              className="input"
              value={locationState}
              onChange={(e) => setLocationState(e.target.value)}
              placeholder="Karnataka"
            />
          </div>
          <div className="field">
            <label>Country</label>
            <input
              className="input"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              placeholder="India"
            />
          </div>
        </>
      )}

      {editing && (
        <div className="field">
          <label>Status</label>
          <PrettySelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </PrettySelect>
        </div>
      )}

      {/* Permissions */}
      <div
        style={{
          marginTop: 8,
          marginBottom: 16,
          padding: 14,
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-2, #f8fafc)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Permissions</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {grantedCount}/{permDefs.length} granted
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {permDefs.map((p) => {
            const on = !!permState[p.key];
            return (
              <label
                key={p.key}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  cursor: p.locked ? 'default' : 'pointer',
                  opacity: p.locked ? 0.85 : 1,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: on ? 'var(--amber-soft, rgba(245,158,11,.12))' : 'var(--surface, #fff)',
                  border: '1px solid var(--border)',
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={!!p.locked}
                  onChange={() => togglePerm(p.key, p.locked)}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--amber, #d97706)' }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, display: 'block' }}>
                    {p.label}
                    {p.locked ? ' · always on' : ''}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="btn btn-amber btn-block"
        onClick={submit}
        disabled={busy}
      >
        <svg>
          <use href={editing ? '#i-check' : '#i-plus'} />
        </svg>
        {busy ? 'Saving…' : editing ? 'Save changes' : accountType === 'Admin' ? 'Create admin' : 'Create user'}
      </button>
    </div>
  );
}
