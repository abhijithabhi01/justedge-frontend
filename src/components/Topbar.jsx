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

// Superadmins manage Admin accounts and billing, not the sensor fleet
// directly — the Dashboard KPIs already reflect that (see DashboardView),
// this just keeps the header copy consistent with what's actually shown.
const SUPERADMIN_TITLES = {
  dashboard: ['Dashboard', 'Platform overview · admin accounts & licensing'],
};

export default function Topbar({ view, onMenuClick }) {
  const { session, logout, isSuperadmin } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [title, sub] = (isSuperadmin && SUPERADMIN_TITLES[view]) || TITLES[view] || TITLES.dashboard;

  return (
    <>
      <header className="topbar">
        <button className="icon-btn mobile-menu-btn" onClick={onMenuClick} title="Open menu">
          <svg><use href="#i-menu" /></svg>
        </button>
        <div><div className="page-title">{title}</div><div className="page-sub">{sub}</div></div>
        <div className="topbar-spacer"></div>

        <button className="profile-btn" onClick={() => setProfileOpen(true)} title="Account & sign out">
          <div className="entity-avatar">{initials(session?.name || 'Admin')}</div>
          <span className="profile-btn-name">{session?.name || 'Admin'}{session?.role ? ` · ${session.role}` : ''}</span>
        </button>

      </header>

      <Modal
        open={profileOpen}
        title={session?.name || 'Admin'}
        sub={session?.role ? `${session.role} account` : 'Admin account'}
        onClose={() => setProfileOpen(false)}
      >
        <div className="modal-profile-row">
          <svg><use href="#i-shield" /></svg>
          Changes you make here are visible to every admin on this workspace.
        </div>
        <button className="btn btn-danger btn-block" onClick={logout} style={{ marginTop: 16 }}>
          <svg><use href="#i-logout" /></svg>Sign out
        </button>
      </Modal>
    </>
  );
}