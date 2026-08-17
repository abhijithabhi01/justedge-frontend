import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import AdminCard from '../components/AdminCard.jsx';
import AdminPermissionsPanel from '../components/AdminPermissionsPanel.jsx';
import Drawer from '../components/Drawer.jsx';
import AdminForm from '../components/AdminForm.jsx';

export default function SuperAdminAdminsView() {
  const { adminAccounts, accessControl } = useData();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [drawer, setDrawer] = useState(null); // { mode: 'add'|'edit', adminId }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return adminAccounts.filter(a => {
      const matchesQuery = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.companyName?.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchesRole = !roleFilter || a.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [adminAccounts, query, roleFilter]);

  const editingAdmin = drawer?.mode === 'edit' ? adminAccounts.find(a => a.id === drawer.adminId) : null;

  const superadmins = adminAccounts.filter(a => a.role === 'Superadmin').length;
  const active = adminAccounts.filter(a => a.status === 'active').length;
  const without2fa = adminAccounts.filter(a => !a.twoFactor).length;

  return (
    <section className="view active">
      <div className="grid grid-4 section-gap">
        <div className="card"><div className="kpi-label">Total admins</div><div className="kpi-value">{adminAccounts.length}</div></div>
        <div className="card"><div className="kpi-label">Active</div><div className="kpi-value">{active}</div></div>
        <div className="card"><div className="kpi-label">Superadmins</div><div className="kpi-value">{superadmins}</div></div>
        <div className="card"><div className="kpi-label">Without 2FA</div><div className="kpi-value" style={{ color: without2fa ? 'var(--danger)' : undefined }}>{without2fa}</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input type="text" placeholder="Search by name, email, or role…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="plain-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {(accessControl?.roles || []).map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <button className="btn btn-amber" onClick={() => setDrawer({ mode: 'add' })}><svg><use href="#i-plus" /></svg>Add admin</button>
      </div>

      <div className="users-layout">
        <div>
          <div className="section-header">
            <div>
              <div className="card-title">Admin accounts</div>
              <div className="card-title-sub">{filtered.length} account{filtered.length !== 1 ? 's' : ''} · click a card to review access</div>
            </div>
          </div>
          {filtered.length ? (
            <div className="entity-grid">
              {filtered.map(a => (
                <AdminCard
                  key={a.id}
                  admin={a}
                  selected={a.id === selectedId}
                  onSelect={setSelectedId}
                  onEdit={(id) => setDrawer({ mode: 'edit', adminId: id })}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state"><svg><use href="#i-search" /></svg><p>No admin accounts match "{query}"</p></div>
          )}
        </div>
        <AdminPermissionsPanel adminId={selectedId} />
      </div>

      <Drawer
        open={!!drawer}
        title={drawer?.mode === 'add' ? 'Add admin' : 'Edit admin'}
        sub={drawer?.mode === 'add' ? 'Grant someone access to this console' : `${editingAdmin?.id} · update account details`}
        onClose={() => setDrawer(null)}
      >
        {drawer?.mode === 'add' && <AdminForm onDone={() => setDrawer(null)} />}
        {drawer?.mode === 'edit' && editingAdmin && <AdminForm admin={editingAdmin} onDone={() => setDrawer(null)} />}
      </Drawer>
    </section>
  );
}
