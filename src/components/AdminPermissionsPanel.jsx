import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ADMIN_PERMISSION_DEFS, initials } from '../lib/helpers.js';

export default function AdminPermissionsPanel({ adminId }) {
  const { adminAccounts, toggleAdminPermission } = useData();
  const { session } = useAuth();
  const showToast = useToast();
  const admin = adminAccounts.find(a => a.id === adminId);

  if (!admin) {
    return (
      <div className="card perm-card">
        <div className="perm-empty">
          <svg><use href="#i-lock" /></svg>
          <p>Select an admin card to view and edit<br />what they can access</p>
        </div>
      </div>
    );
  }

  const isSelf = session?.adminId === admin.id;

  return (
    <div className="card perm-card">
      <div className="perm-user-head">
        <div className="entity-avatar">{initials(admin.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="entity-card-name">{admin.name}{isSelf ? ' (you)' : ''}</div>
          <div className="entity-card-sub">{admin.role} · {admin.id}</div>
        </div>
      </div>
      {isSelf && <div className="form-error show" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>Editing your own access can lock you out of this page.</div>}
      <div className="perm-section-label">Console permissions</div>
      {ADMIN_PERMISSION_DEFS.map(p => {
        const on = !!admin.permissions?.[p.key];
        const locked = p.locked && admin.role !== 'Superadmin';
        return (
          <div className="perm-row" key={p.key}>
            <div>
              <div className="perm-row-label">{p.label}</div>
              <div className="perm-row-desc">{p.desc}</div>
            </div>
            <div
              className={`switch${on ? ' on' : ''}${locked ? ' locked' : ''}`}
              title={locked ? 'Only Superadmins can manage other admin accounts' : ''}
              onClick={() => {
                if (locked) return;
                toggleAdminPermission(admin.id, p.key);
                showToast(`${!on ? 'Granted' : 'Revoked'} "${p.label}" for ${admin.name}`);
              }}
            ></div>
          </div>
        );
      })}
    </div>
  );
}
