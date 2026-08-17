import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import AdminPermissionsPanel from '../components/AdminPermissionsPanel.jsx';
import { ADMIN_PERMISSION_DEFS, initials, timeAgo } from '../lib/helpers.js';

export default function SuperAdminAccessControlView() {
  const { adminAccounts, accessControl } = useData();
  const [selectedId, setSelectedId] = useState(adminAccounts[0]?.id || null);
  const roles = accessControl?.roles || [];
  const matrix = accessControl?.matrix || {};

  useEffect(() => {
    if (!selectedId && adminAccounts[0]) {
      setSelectedId(adminAccounts[0].id);
    }
  }, [adminAccounts, selectedId]);

  return (
    <section className="view active">
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <div className="card-title">Role defaults</div>
            <div className="card-title-sub">What each role can do out of the box — override per account below</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                {roles.map(r => <th key={r}>{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {ADMIN_PERMISSION_DEFS.map(p => (
                <tr key={p.key}>
                  <td><b>{p.label}</b><div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>{p.desc}</div></td>
                  {roles.map(r => {
                    const on = matrix[r]?.[p.key];
                    return (
                      <td key={r}>
                        {on
                          ? <span className="pill pill-good"><svg style={{ width: 9, height: 9 }}><use href="#i-check" /></svg>Yes</span>
                          : <span className="pill pill-muted">No</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="users-layout">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Admin accounts</div>
              <div className="card-title-sub">Select an account to view or override its permissions</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Admin</th><th>Role</th><th>Status</th><th>Last seen</th><th></th></tr>
              </thead>
              <tbody>
                {adminAccounts.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer', background: a.id === selectedId ? 'var(--surface-2)' : undefined }} onClick={() => setSelectedId(a.id)}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-sm">{initials(a.name)}</div>
                        <div>
                          <div className="user-cell-name">{a.name}</div>
                          <div className="user-cell-sub">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`pill role-pill ${a.role === 'Superadmin' ? 'owner' : a.role === 'Admin' ? 'manager' : 'viewer'}`}>{a.role}</span></td>
                    <td>
                      {a.status === 'active' && <span className="pill pill-good">Active</span>}
                      {a.status === 'invited' && <span className="pill pill-warn">Invited</span>}
                      {a.status === 'suspended' && <span className="pill pill-bad">Suspended</span>}
                    </td>
                    <td className="mono-faint">{timeAgo(a.lastLogin)}</td>
                    <td><button className="icon-btn-sm" title="Manage access" onClick={(e) => { e.stopPropagation(); setSelectedId(a.id); }}><svg><use href="#i-lock" /></svg></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AdminPermissionsPanel adminId={selectedId} />
      </div>
    </section>
  );
}
