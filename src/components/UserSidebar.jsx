import React, { useState } from 'react';
import { initials } from '../lib/helpers.js';
import Drawer from './Drawer.jsx';
import ProfilePanel from './ProfilePanel.jsx';

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'i-grid' },
  { id: 'sensors', label: 'My Sensors', icon: 'i-cpu' },
  { id: 'alerts', label: 'Alerts', icon: 'i-wifi' },
  { id: 'automations', label: 'Automations', icon: 'i-zap' },
];

export default function UserSidebar({ view, onNavigate, user, mySensors, mobileOpen, onClose }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const online = mySensors.filter(s => s.status === 'online').length;

  function navigate(id) {
    onNavigate(id);
    onClose?.();
  }

  return (
    <>
    {mobileOpen && <div className="sidebar-overlay open" onClick={onClose}></div>}
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div><div className="brand-name">JustEdge</div><div className="brand-sub">User dashboard</div></div>
      </div>
      <button className="sidebar-status sidebar-profile-trigger" onClick={() => setProfileOpen(true)} title="View your profile & permissions">
        <div className="entity-avatar" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 9 }}>{initials(user?.name || '')}</div>
        {user?.name || 'Guest'}
        <svg className="sidebar-profile-chev"><use href="#i-chev" /></svg>
      </button>

      <div className="sidebar-section-label">Navigate</div>
      <ul className="nav-list">
        {NAV.map(item => (
          <li className="nav-item" key={item.id}>
            <a
              className={`nav-link${view === item.id ? ' active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <svg><use href={`#${item.icon}`} /></svg>{item.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="sidebar-foot">
        <div className="mini-card">
          <div><div className="label">Your sensors online</div><div className="val">{online}/{mySensors.length}</div></div>
          <svg style={{ width: 18, height: 18, color: 'var(--good)' }}><use href="#i-wifi" /></svg>
        </div>
      </div>
    </aside>

    <Drawer open={profileOpen} title="Your profile" sub="Account details & permissions" onClose={() => setProfileOpen(false)}>
      <ProfilePanel user={user} />
    </Drawer>
    </>
  );
}