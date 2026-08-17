import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function UserForm({ user, onDone }) {
  const { addUser, updateUser } = useData();
  const showToast = useToast();
  const editing = !!user;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState(user?.role || 'Viewer');
  const [status, setStatus] = useState(user?.status || 'invited');
  const [error, setError] = useState('');
  const [createdCreds, setCreatedCreds] = useState(null); // { email, tempPassword }

  async function submit() {
    setError('');
    if (!name.trim()) return setError("Enter the user's full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');

    if (editing) {
      updateUser(user.id, { name: name.trim(), email: email.trim(), phone: phone.trim(), role, status });
      showToast(`${name.trim()} updated`);
      onDone();
    } else {
      const result = await addUser({ name: name.trim(), email: email.trim(), phone: phone.trim(), role, status });
      showToast(`${name.trim()} created`);
      // Password is only ever returned on this one response — show it now
      // so the admin can pass it on, rather than closing the dialog.
      setCreatedCreds({ email: email.trim(), tempPassword: result?.tempPassword });
    }
  }

  if (createdCreds) {
    return (
      <>
        <div className="form-error show" style={{ background: '#e8f5e9', color: '#1b5e20', borderColor: '#a5d6a7' }}>
          User created. Share these sign-in details with them — the password won't be shown again.
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
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Meera Das" />
      </div>
      <div className="field"><label>Email <span className="req">*</span></label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" />
      </div>
      <div className="field"><label>Phone</label>
        <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 90000 00000" />
      </div>
      <div className="field-row2">
        <div className="field"><label>Role <span className="req">*</span></label>
          <select className="input" value={role} onChange={e => setRole(e.target.value)}>
            <option value="Owner">Owner</option>
            <option value="Manager">Manager</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
        <div className="field"><label>Status <span className="req">*</span></label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="invited">Invited</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>
      <button className="btn btn-amber btn-block" onClick={submit}>
        <svg><use href={editing ? '#i-check' : '#i-plus'} /></svg>{editing ? 'Save changes' : 'Create user'}
      </button>
    </>
  );
}