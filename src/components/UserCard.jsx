import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { initials } from '../lib/helpers.js';

export default function UserCard({ user, selected, onSelect, onEdit, sensorCount }) {
  const { toggleUserStatus, removeUser } = useData();
  const showToast = useToast();
  const confirm = useConfirm();

  async function handleToggleStatus(e) {
    e.stopPropagation();
    const suspending = user.status === 'active';
    const ok = await confirm({
      title: suspending ? 'Suspend user?' : 'Reactivate user?',
      message: suspending
        ? `${user.name} will lose access immediately and won't be able to sign in until reactivated.`
        : `${user.name} will regain access and be able to sign in again.`,
      confirmLabel: suspending ? 'Suspend' : 'Reactivate',
      danger: suspending,
    });
    if (!ok) return;
    toggleUserStatus(user.id);
    showToast(`${user.name} ${suspending ? 'suspended' : 'reactivated'}`);
  }

  async function handleRemove(e) {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Remove user?',
      message: `This permanently removes ${user.name}'s account and unassigns their sensors. This can't be undone.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    removeUser(user.id);
    showToast(`${user.name} removed`);
  }

  return (
    <div className={`entity-card${selected ? ' selected' : ''}`} onClick={() => onSelect(user.id)}>
      <div className="entity-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div className="entity-avatar">{initials(user.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="entity-card-name">{user.name}</div>
            <div className="entity-card-sub">{user.id} · {user.role}</div>
          </div>
        </div>
        {user.status === 'active'
          ? <span className="pill pill-good"><svg style={{ width: 9, height: 9 }}><use href="#i-check" /></svg>Active</span>
          : <span className="pill pill-warn">Invited</span>}
      </div>
      <div className="entity-card-body">
        <div className="entity-meta-row"><span className="k">Email</span><span className="v">{user.email}</span></div>
        <div className="entity-meta-row"><span className="k">Phone</span><span className="v">{user.phone || '—'}</span></div>
        <div className="entity-meta-row"><span className="k">Sensors</span><span className="v"><span className="pill pill-muted">{sensorCount} sensor{sensorCount !== 1 ? 's' : ''}</span></span></div>
      </div>
      <div className="entity-card-foot">
        <span className={`pill role-pill ${String(user.role || 'User').toLowerCase()}`}>{user.role || 'User'}</span>
        <div className="entity-card-actions">
          <button className="icon-btn-sm" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(user.id); }}><svg><use href="#i-edit" /></svg></button>
          <button
            className="icon-btn-sm"
            title="Toggle status"
            onClick={handleToggleStatus}
          >
            <svg><use href="#i-refresh" /></svg>
          </button>
          <button
            className="icon-btn-sm"
            title="Remove user"
            onClick={handleRemove}
          >
            <svg><use href="#i-trash" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}