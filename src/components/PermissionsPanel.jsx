import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PERMISSION_DEFS, initials } from '../lib/helpers.js';

export default function PermissionsPanel({ userId }) {
  const { users, togglePermission } = useData();
  const showToast = useToast();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return (
      <div className="card perm-card">
        <div className="perm-empty">
          <svg><use href="#i-shield" /></svg>
          <p>Select a user card to view and edit<br />what they're allowed to do</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card perm-card">
      <div className="perm-user-head">
        <div className="entity-avatar">{initials(user.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="entity-card-name">{user.name}</div>
          <div className="entity-card-sub">{user.role} · {user.id}</div>
        </div>
      </div>
      <div className="perm-section-label">Permissions</div>
      {PERMISSION_DEFS.map(p => {
        const on = !!user.permissions?.[p.key];
        return (
          <div className="perm-row" key={p.key}>
            <div>
              <div className="perm-row-label">{p.label}</div>
              <div className="perm-row-desc">{p.desc}</div>
            </div>
            <div
              className={`switch${on ? ' on' : ''}${p.locked ? ' locked' : ''}`}
              title={p.locked ? 'Always on — required to sign in and use the platform' : ''}
              onClick={() => {
                if (p.locked) return;
                togglePermission(user.id, p.key);
                showToast(`${!on ? 'Granted' : 'Revoked'} "${p.label}" for ${user.name}`);
              }}
            ></div>
          </div>
        );
      })}
    </div>
  );
}
