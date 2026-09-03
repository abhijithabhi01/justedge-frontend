import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = {
  overview: [{ id: 'dashboard', label: 'Dashboard', icon: 'i-grid' }],
  manage: [
    { id: 'sensors', label: 'Sensors', icon: 'i-cpu' },
    { id: 'users', label: 'Users', icon: 'i-users' },
    { id: 'assign', label: 'Assign Sensors', icon: 'i-link' },
    { id: 'boards', label: 'Board Catalog', icon: 'i-cpu' },
  ],
  superAdmin: [
    { id: 'admins', label: 'Admin Accounts', icon: 'i-user-plus' },
    { id: 'plans', label: 'Subscription Plans', icon: 'i-receipt' },
    { id: 'revenue', label: 'Revenue & Business', icon: 'i-chart' },
    { id: 'fleet-health', label: 'Fleet & Device Health', icon: 'i-wifi' },
  ],
};

export default function Sidebar({ view, onNavigate, mobileOpen, onClose }) {
  const { sensors } = useData();
  const { isSuperadmin } = useAuth();
  const online = sensors.filter(s => s.status === 'online').length;

  const manageItems = NAV.manage.filter((item) => {
    // Assign is admin-operations only; board catalog is superadmin-only
    if (item.id === 'assign' && isSuperadmin) return false;
    if (item.id === 'boards' && !isSuperadmin) return false;
    return true;
  });

  function navigate(id) {
    onNavigate(id);
    onClose?.();
  }

  return (
    <>
    {mobileOpen && <div className="sidebar-overlay open" onClick={onClose}></div>}
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div>
          <div className="brand-name">JustEdge</div>
          <div className="brand-sub">
            {isSuperadmin ? 'Superadmin console' : 'Admin console'}
          </div>
        </div>
      </div>
      <div className="sidebar-status"><div className="pulse-dot"></div>Fleet live · syncing</div>

      <div className="sidebar-section-label">Overview</div>
      <ul className="nav-list">
        {NAV.overview.map(item => (
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

      <>
        <div className="sidebar-section-label">Manage</div>
        <ul className="nav-list">
          {manageItems.map(item => (
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
      </>

      {isSuperadmin && (
        <>
          <div className="sidebar-section-label">Super Admin</div>
          <ul className="nav-list">
            {NAV.superAdmin.map(item => (
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
        </>
      )}

      <div className="sidebar-foot">
        <a
          href="https://justembedded.in/contact/"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
          style={{ marginBottom: 10, fontSize: 12, opacity: 0.85 }}
        >
          <svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
          Support / contact
        </a>
        <div className="mini-card">
          <div><div className="label">Boards online</div><div className="val">{online}/{sensors.length}</div></div>
          <svg style={{ width: 18, height: 18, color: 'var(--good)' }}><use href="#i-wifi" /></svg>
        </div>
      </div>
    </aside>
    </>
  );
}