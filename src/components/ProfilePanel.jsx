import React from 'react';
import { PERMISSION_DEFS, initials } from '../lib/helpers.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePanel({ user }) {
  const { logout } = useAuth();
  if (!user) return null;

  return (
    <>
      <div className="profile-head">
        <div className="entity-avatar">{initials(user.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="profile-name">{user.name}</div>
          <div className="profile-role">{user.role} · {user.id}</div>
        </div>
      </div>

      <div className="profile-contact">
        <div className="profile-contact-row"><svg><use href="#i-mail" /></svg>{user.email}</div>
        <div className="profile-contact-row"><svg><use href="#i-phone" /></svg>{user.phone || '—'}</div>
        <div className="profile-contact-row">
          <svg><use href="#i-check" /></svg>
          {user.status === 'active' ? 'Active account' : 'Invitation pending'}
        </div>
      </div>

      <div className="drawer-section">Your permissions</div>
      {PERMISSION_DEFS.map(p => {
        const granted = !!user.permissions?.[p.key];
        return (
          <div className="perm-summary-row" key={p.key}>
            <div className={`perm-summary-icon ${granted ? 'granted' : 'revoked'}`}>
              <svg><use href={`#${granted ? 'i-check' : 'i-shield'}`} /></svg>
            </div>
            <div className="perm-summary-text">
              <div className="perm-summary-label">{p.label}</div>
              <div className="perm-summary-desc">{p.desc}</div>
            </div>
            <span className={`perm-summary-tag ${granted ? 'granted' : 'revoked'}`}>{granted ? 'Granted' : 'Off'}</span>
          </div>
        );
      })}
      <div className="locked-banner" style={{ marginTop: 16 }}>
        <svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
        Only an admin can change your permissions.
      </div>

      <button className="btn btn-danger btn-block" onClick={logout} style={{ marginTop: 20 }}>
        <svg><use href="#i-logout" /></svg>Sign out
      </button>
    </>
  );
}