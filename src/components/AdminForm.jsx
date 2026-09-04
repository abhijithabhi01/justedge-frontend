import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function AdminForm({ admin, onDone }) {
  const { adminAccounts, addAdmin, updateAdmin } = useData();
  const showToast = useToast();
  const editing = !!admin;

  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [companyName, setCompanyName] = useState(admin?.companyName || '');
  const [status, setStatus] = useState(admin?.status || 'invited');
  const [twoFactor, setTwoFactor] = useState(admin?.twoFactor ?? false);
  const [error, setError] = useState('');
  const [createdCreds, setCreatedCreds] = useState(null); // { email, tempPassword }

  async function submit() {
    setError('');
    if (!name.trim()) return setError("Enter the admin's full name.");
    if (!companyName.trim()) return setError('Enter the company name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (!editing && adminAccounts.some(a => a.email.toLowerCase() === email.trim().toLowerCase())) {
      return setError('An admin account with that email already exists.');
    }

    if (editing) {
      updateAdmin(admin.id, { name: name.trim(), email: email.trim(), phone: phone.trim(), companyName: companyName.trim(), status, twoFactor });
      showToast(`${name.trim()} updated`);
      onDone();
    } else {
      const result = await addAdmin({ name: name.trim(), email: email.trim(), phone: phone.trim(), companyName: companyName.trim(), status, twoFactor });
      showToast(`${name.trim()} added for ${companyName.trim()}`);
      // Password is only ever returned on this one response — show it now
      // so the superadmin can pass it on, rather than closing the dialog.
      setCreatedCreds({ email: email.trim(), tempPassword: result?.tempPassword, emailSent: result?.emailSent, emailError: result?.emailError });
    }
  }

  if (createdCreds) {
    return (
      <>
        <div className="form-error show" style={{ background: '#e8f5e9', color: '#1b5e20', borderColor: '#a5d6a7' }}>
          Admin created. {createdCreds.emailSent
            ? 'A welcome email with login credentials was sent to this address.'
            : 'Share these sign-in details with them — the password wont be shown again.'}
          {!createdCreds.emailSent && createdCreds.emailError ? (
            <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: '#6b7280' }}>
              Email not sent ({createdCreds.emailError}). Configure SMTP on the server.
            </span>
          ) : null}
        </div>
        <div className="field"><label>Email</label>
          <input className="input" value={createdCreds.email} readOnly />
        </div>
        <div className="field"><label>Temporary password</label>
          <input className="input" value={createdCreds.tempPassword || '(not returned)'} readOnly />
        </div>
        <button className="btn btn-amber btn-block" onClick={onDone}>Done</button>
      </>
    );
  }

  return (
    <>
      {error && <div className="form-error show">{error}</div>}
      <div className="field"><label>Full name <span className="req">*</span></label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Nidhi Rao" />
      </div>
      <div className="field"><label>Email <span className="req">*</span></label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@justedge.io" />
      </div>
      <div className="field"><label>Phone</label>
        <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 90000 00000" />
      </div>
      <div className="field"><label>Company name <span className="req">*</span></label>
        <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Cold Storage" />
      </div>
      <div className="field-row2">
        <div className="field"><label>Role</label><input className="input" value="Admin" disabled /></div>
        <div className="field"><label>Status <span className="req">*</span></label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="invited">Invited</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>
      <div className="perm-row" style={{ padding: '11px 0' }}>
        <div>
          <div className="perm-row-label">Require two-factor authentication</div>
          <div className="perm-row-desc">Strongly recommended for Admin and Superadmin roles</div>
        </div>
        <div className={`switch${twoFactor ? ' on' : ''}`} onClick={() => setTwoFactor(v => !v)}></div>
      </div>
      <button className="btn btn-amber btn-block" onClick={submit}>
        <svg><use href={editing ? '#i-check' : '#i-plus'} /></svg>{editing ? 'Save changes' : 'Add admin'}
      </button>
    </>
  );
}