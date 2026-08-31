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
  const [drawer, setDrawer] = useState(null);
  // drawer: { mode: 'add' | 'edit' | 'detail', adminId? }

  // Superadmin accounts are platform operators — not managed in this list.
  const managedAdmins = useMemo(
    () => adminAccounts.filter((a) => a.role !== 'Superadmin'),
    [adminAccounts]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return managedAdmins.filter((a) => {
      const matchesQuery =
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.companyName?.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q);
      const matchesRole = !roleFilter || a.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [managedAdmins, query, roleFilter]);

  const editingAdmin =
    drawer?.mode === 'edit'
      ? managedAdmins.find((a) => a.id === drawer.adminId)
      : null;

  const detailAdmin =
    drawer?.mode === 'detail'
      ? managedAdmins.find((a) => a.id === drawer.adminId)
      : null;

  const active = managedAdmins.filter((a) => a.status === 'active').length;
  const suspended = managedAdmins.filter((a) => a.status === 'suspended').length;
  const without2fa = managedAdmins.filter((a) => !a.twoFactor).length;

  const roleOptions = (accessControl?.roles || []).filter(
    (role) => role !== 'Superadmin'
  );

  function openDetail(id) {
    setDrawer({ mode: 'detail', adminId: id });
  }

  return (
    <section className="view active">
      <div className="grid grid-4 section-gap">
        <div className="card">
          <div className="kpi-label">Total admins</div>
          <div className="kpi-value">{managedAdmins.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Active</div>
          <div className="kpi-value">{active}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Suspended</div>
          <div
            className="kpi-value"
            style={{ color: suspended ? 'var(--danger)' : undefined }}
          >
            {suspended}
          </div>
        </div>
        <div className="card">
          <div className="kpi-label">Without 2FA</div>
          <div
            className="kpi-value"
            style={{ color: without2fa ? 'var(--danger)' : undefined }}
          >
            {without2fa}
          </div>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input
            type="text"
            placeholder="Search by name, email, or company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="plain-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          className="btn btn-amber"
          onClick={() => setDrawer({ mode: 'add' })}
        >
          <svg><use href="#i-plus" /></svg>Add admin
        </button>
      </div>

      <div className="section-header">
        <div>
          <div className="card-title">Admin accounts</div>
          <div className="card-title-sub">
            {filtered.length} account{filtered.length !== 1 ? 's' : ''} ·
            click a card for permissions &amp; users · suspend to block sign-in
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="entity-grid">
          {filtered.map((a) => (
            <AdminCard
              key={a.id}
              admin={a}
              selected={drawer?.adminId === a.id}
              onSelect={openDetail}
              onEdit={(id) => setDrawer({ mode: 'edit', adminId: id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg><use href="#i-search" /></svg>
          <p>
            {query
              ? `No admin accounts match "${query}"`
              : 'No company admin accounts yet. Add an admin to grant console access.'}
          </p>
        </div>
      )}

      {/* Add / Edit drawer */}
      <Drawer
        open={drawer?.mode === 'add' || drawer?.mode === 'edit'}
        title={drawer?.mode === 'add' ? 'Add admin' : 'Edit admin'}
        sub={
          drawer?.mode === 'add'
            ? 'Grant someone access to this console'
            : `${editingAdmin?.id || ''} · update account details`
        }
        onClose={() => setDrawer(null)}
      >
        {drawer?.mode === 'add' && (
          <AdminForm onDone={() => setDrawer(null)} />
        )}
        {drawer?.mode === 'edit' && editingAdmin && (
          <AdminForm admin={editingAdmin} onDone={() => setDrawer(null)} />
        )}
      </Drawer>

      {/* Detail drawer — same chrome as Edit admin */}
      <Drawer
        open={drawer?.mode === 'detail'}
        title={detailAdmin ? detailAdmin.name : 'Admin access'}
        sub={
          detailAdmin
            ? `${detailAdmin.role} · permissions & users`
            : 'Review access'
        }
        onClose={() => setDrawer(null)}
      >
        {drawer?.mode === 'detail' && drawer.adminId && (
          <>
            <AdminPermissionsPanel adminId={drawer.adminId} />
            <button
              className="btn btn-amber btn-block"
              style={{ marginTop: 8 }}
              onClick={() =>
                setDrawer({ mode: 'edit', adminId: drawer.adminId })
              }
            >
              <svg><use href="#i-edit" /></svg>
              Edit account details
            </button>
          </>
        )}
      </Drawer>
    </section>
  );
}