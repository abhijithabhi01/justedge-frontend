import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/helpers.js';
import Modal from './Modal.jsx';

const TITLES = {
  boards: ['Board Catalog', 'Platform hardware types available to Admins'],
  dashboard: ['Dashboard', 'Fleet overview · updated live'],
  sensors: ['Sensors', 'Every board registered on the platform'],
  users: ['Users', 'People with access to this workspace'],
  assign: ['Assign Sensors', 'Change ownership of any sensor instantly'],
  admins: ['Admin Accounts', 'Who can sign in to this console, and what they hold'],
  activity: ['Activity Logs', 'Every admin and platform action, audited'],
  access: ['Access Control', 'Roles, permissions and account access for admins'],
  oversight: ['Oversight', 'Risk signals and account health beyond the raw logs'],
};

const SUPERADMIN_TITLES = {
  dashboard: ['Dashboard', 'Platform overview · admin accounts & licensing'],
};

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border-soft, var(--border))',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: 'var(--text-main)',
          fontWeight: 600,
          textAlign: 'right',
          wordBreak: 'break-word',
        }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

export default function Topbar({ view, onMenuClick }) {
  const { session, logout, isSuperadmin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [title, sub] =
    (isSuperadmin && SUPERADMIN_TITLES[view]) || TITLES[view] || TITLES.dashboard;

  const account = session?.account || {};
  const name = account.name || session?.name || 'Admin';
  const role = account.role || session?.role || 'Admin';
  const email = account.email || session?.email || '—';
  const phone = account.phone || '—';
  const company = account.companyName || account.company || '—';
  const status = account.status || 'active';
  const id = account.id || session?.adminId || session?.userId || '—';
  const lastLogin = account.lastLogin
    ? new Date(account.lastLogin).toLocaleString()
    : '—';


  return (
    <>
      <header className="topbar">
        <button
          type="button"
          className="icon-btn mobile-menu-btn"
          onClick={onMenuClick}
          title="Open menu"
        >
          <svg>
            <use href="#i-menu" />
          </svg>
        </button>
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{sub}</div>
        </div>
        <div className="topbar-spacer" />

        <button
          type="button"
          className="profile-btn"
          onClick={() => setProfileOpen(true)}
          title="Account & sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
          }}
        >
          
          <span className="profile-btn-name">
            {name}
            {role ? ` · ${role}` : ''}
          </span>
        </button>
      </header>

      <Modal
        open={profileOpen}
        title={name}
        sub={`${role} account`}
        onClose={() => setProfileOpen(false)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 8,
          }}
        >
          <div
            className="entity-avatar"
            style={{ width: 48, height: 48, fontSize: 16 }}
          >
            {initials(name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              {email}
            </div>
          </div>
        </div>

        <DetailRow label="Email" value={email} />
        <DetailRow label="Phone" value={phone} />
        <DetailRow label="Company" value={company} />
        <DetailRow label="Role" value={role} />
        <DetailRow
          label="Status"
          value={
            status === 'active'
              ? 'Active'
              : status === 'suspended'
                ? 'Suspended'
                : String(status)
          }
        />
        <DetailRow label="Account ID" value={String(id)} />
        <DetailRow label="Last login" value={lastLogin} />

        <div className="modal-profile-row" style={{ marginTop: 14 }}>
          <svg>
            <use href="#i-shield" />
          </svg>
          {isSuperadmin
            ? 'You have full platform access as Superadmin.'
            : 'Changes you make here apply to your company workspace.'}
        </div>

        <button
          type="button"
          className="btn btn-danger btn-block"
          onClick={logout}
          style={{ marginTop: 16 }}
        >
          <svg>
            <use href="#i-logout" />
          </svg>
          Sign out
        </button>
      </Modal>
    </>
  );
}