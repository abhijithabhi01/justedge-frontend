import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { initials, timeAgo } from '../lib/helpers.js';

const ROLE_CLASS = { Superadmin: 'owner', Admin: 'manager' };

export default function AdminCard({ admin, selected, onSelect, onEdit }) {
  const { adminAccounts, toggleAdminStatus, removeAdmin } = useData();
  const { session } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();

  const isSelf = session?.adminId === admin.id;
  const superadminCount = adminAccounts.filter(a => a.role === 'Superadmin' && a.status !== 'suspended').length;
  const isLastSuperadmin = admin.role === 'Superadmin' && superadminCount <= 1;

  async function handleToggleStatus(e) {
    e.stopPropagation();
    if (isSelf) {
      showToast('You can\u2019t change the status of your own account');
      return;
    }
    if (isLastSuperadmin && admin.status !== 'suspended') {
      showToast('Can\u2019t suspend the last active Superadmin');
      return;
    }
    const suspending = admin.status !== 'suspended';
    const ok = await confirm({
      title: suspending ? 'Suspend admin?' : 'Reactivate admin?',
      message: suspending
        ? `${admin.name} will lose access immediately and won't be able to sign in until reactivated. Users under this admin will also be suspended.`
        : `${admin.name} will regain access and be able to sign in again. Users under this admin will be reactivated.`,
      confirmLabel: suspending ? 'Suspend' : 'Reactivate',
      danger: suspending,
    });
    if (!ok) return;
    toggleAdminStatus(admin.id);
    showToast(
      suspending
        ? `${admin.name} suspended — users under this admin are suspended too`
        : `${admin.name} reactivated — users under this admin are active again`
    );
  }

  async function handleRemove(e) {
    e.stopPropagation();
    if (isSelf) {
      showToast('You can\u2019t remove your own account');
      return;
    }
    if (isLastSuperadmin) {
      showToast('Can\u2019t remove the last Superadmin account');
      return;
    }
    const ok = await confirm({
      title: 'Remove admin?',
      message: `This permanently removes ${admin.name}'s account. This can't be undone.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    removeAdmin(admin.id);
    showToast(`${admin.name} removed`);
  }

  return (
    <div className={`entity-card${selected ? ' selected' : ''}`} onClick={() => onSelect(admin.id)}>
      <div className="entity-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div className="entity-avatar">{initials(admin.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="entity-card-name">{admin.name}{isSelf ? ' (you)' : ''}</div>
            <div className="entity-card-sub">{admin.id} · {admin.role}</div>
          </div>
        </div>
        {admin.status === 'active' && <span className="pill pill-good"><svg style={{ width: 9, height: 9 }}><use href="#i-check" /></svg>Active</span>}
        {admin.status === 'invited' && <span className="pill pill-warn">Invited</span>}
        {admin.status === 'suspended' && <span className="pill pill-bad">Suspended</span>}
      </div>
      <div className="entity-card-body">
        <div className="entity-meta-row"><span className="k">Company</span><span className="v">{admin.companyName || 'Unassigned'}</span></div>
        <div className="entity-meta-row"><span className="k">Users</span><span className="v">{admin.userCount || 0}</span></div>
        <div className="entity-meta-row"><span className="k">Subscriptions</span><span className="v">{admin.subscriptionCount || 0}</span></div>
        <div className="entity-meta-row"><span className="k">Email</span><span className="v">{admin.email}</span></div>
        <div className="entity-meta-row"><span className="k">Phone</span><span className="v">{admin.phone || '—'}</span></div>
        <div className="entity-meta-row">
          <span className="k">2FA</span>
          <span className="v">
            {admin.twoFactor
              ? <span className="pill pill-good">Enabled</span>
              : <span className="pill pill-warn">Off</span>}
          </span>
        </div>
        <div className="entity-meta-row"><span className="k">Last sign-in</span><span className="v">{timeAgo(admin.lastLogin)}</span></div>
      </div>
      <div className="entity-card-foot">
        <span className={`pill role-pill ${ROLE_CLASS[admin.role] || 'viewer'}`}>{admin.role}</span>
        <div className="entity-card-actions">
          <button
            className="icon-btn-sm"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(admin.id);
            }}
          >
            <svg><use href="#i-edit" /></svg>
          </button>
          <button
            className="icon-btn-sm"
            title={
              isSelf
                ? "You can't change your own status"
                : admin.status === 'suspended'
                  ? 'Reactivate admin (allow sign-in)'
                  : 'Suspend admin (block sign-in)'
            }
            disabled={isSelf}
            onClick={handleToggleStatus}
            style={
              admin.status === 'suspended'
                ? { color: 'var(--good)' }
                : { color: 'var(--warn)' }
            }
          >
            <svg>
              <use
                href={
                  admin.status === 'suspended' ? '#i-check' : '#i-shield'
                }
              />
            </svg>
          </button>
          <button
            className="icon-btn-sm"
            title={isSelf ? "You can't remove your own account" : 'Remove admin'}
            disabled={isSelf}
            onClick={handleRemove}
          >
            <svg><use href="#i-trash" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}