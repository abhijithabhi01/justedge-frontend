import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import UserCard from '../components/UserCard.jsx';
import PermissionsPanel from '../components/PermissionsPanel.jsx';
import Drawer from '../components/Drawer.jsx';
import UserForm from '../components/UserForm.jsx';
import { initials } from '../lib/helpers.js';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';


export default function UsersView() {
  const { users, sensors, adminAccounts, removeAdmin } = useData();
  const { session } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(null);

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users.filter(
      (u) =>
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.role || 'User').toLowerCase().includes(q)
    );
  }, [users, query]);

  const filteredAdmins = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (adminAccounts || []).filter(
      (a) =>
        !q ||
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.companyName || '').toLowerCase().includes(q) ||
        String(a.role || '').toLowerCase().includes(q)
    );
  }, [adminAccounts, query]);

  const editingUser =
    drawer?.mode === 'edit'
      ? users.find((u) => String(u.id) === String(drawer.userId))
      : null;

  const detailUser =
    drawer?.mode === 'detail'
      ? users.find((u) => String(u.id) === String(drawer.userId))
      : null;

  const detailSensorCount = detailUser
    ? sensors.filter((s) => String(s.assignedUserId) === String(detailUser.id)).length
    : 0;

  function openDetail(id) {
    setDrawer({ mode: 'detail', userId: id });
  }

  const meAdmin = (adminAccounts || []).find(
    (a) => String(a.id) === String(session?.adminId || session?.account?.id)
  );
  const canDeleteAdmins =
    session?.role === 'Superadmin' ||
    !!meAdmin?.permissions?.manageAdmins ||
    !!session?.account?.permissions?.manageAdmins;

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="filter-search" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <svg>
            <use href="#i-search" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingRight: query ? 36 : undefined }}
          />
          {query ? (
            <button
              type="button"
              title="Clear search"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg style={{ width: 16, height: 16 }}>
                <use href="#i-x" />
              </svg>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-amber"
          onClick={() => setDrawer({ mode: 'add' })}
        >
          <svg>
            <use href="#i-plus" />
          </svg>
          Create user
        </button>
      </div>

      {/* ── Company admins (highlighted, separate) ── */}
      {session?.role !== 'Superadmin' && filteredAdmins.length > 0 && (
        <>
          <div className="section-header" style={{ marginTop: 4 }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#4f46e5',
                  }}
                >
                  <svg style={{ width: 14, height: 14 }}>
                    <use href="#i-shield" />
                  </svg>
                </span>
                Admin accounts
              </div>
              <div className="card-title-sub">
                {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''} in this company
                workspace · shared sensors &amp; users
              </div>
            </div>
          </div>
          <div className="entity-grid" style={{ marginBottom: 28 }}>
            {filteredAdmins.map((a) => {
              const isMe = String(a.id) === String(session?.adminId || session?.account?.id);
              return (
                <div
                  key={a.id}
                  className="entity-card"
                  style={{
                    border: '1.5px solid rgba(99, 102, 241, 0.35)',
                    background:
                      'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, var(--surface, #fff) 55%)',
                    boxShadow: '0 1px 0 rgba(99,102,241,0.08)',
                  }}
                >
                  <div className="entity-card-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div
                        className="entity-avatar"
                        style={{ background: '#4f46e5', color: '#fff' }}
                      >
                        {initials(a.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="entity-card-name">
                          {a.name}
                          {isMe ? (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#4f46e5',
                              }}
                            >
                              (you)
                            </span>
                          ) : null}
                        </div>
                        <div className="entity-card-sub">
                          {a.companyName || '—'} · {a.role}
                        </div>
                      </div>
                    </div>
                    {a.status === 'active' ? (
                      <span className="pill pill-good">
                        <svg style={{ width: 9, height: 9 }}>
                          <use href="#i-check" />
                        </svg>
                        Active
                      </span>
                    ) : (
                      <span className="pill pill-warn">Invited</span>
                    )}
                  </div>
                  <div className="entity-card-body">
                    <div className="entity-meta-row">
                      <span className="k">Email</span>
                      <span className="v">{a.email}</span>
                    </div>
                    <div className="entity-meta-row">
                      <span className="k">Phone</span>
                      <span className="v">{a.phone || '—'}</span>
                    </div>
                    <div className="entity-meta-row">
                      <span className="k">Company</span>
                      <span className="v">{a.companyName || '—'}</span>
                    </div>
                    {(a.locationCity || a.locationState || a.locationCountry) ? (
                      <div className="entity-meta-row">
                        <span className="k">Location</span>
                        <span className="v">
                          {[a.locationCity, a.locationState, a.locationCountry].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="entity-card-foot">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        className="pill"
                        style={{
                          background: a.role === 'Superadmin' ? 'rgba(124,58,237,0.12)' : 'rgba(99,102,241,0.12)',
                          color: a.role === 'Superadmin' ? '#6d28d9' : '#4338ca',
                          fontWeight: 700,
                        }}
                      >
                        {a.role === 'Superadmin' ? 'Superadmin' : 'Admin'}
                      </span>
                      {a.role === 'Superadmin' ? (
                        <span
                          className="pill"
                          style={{
                            background: 'rgba(124,58,237,0.15)',
                            color: '#6d28d9',
                            fontWeight: 700,
                          }}
                        >
                          Superadmin
                        </span>
                      ) : a.permissions?.manageAdmins ? (
                        <span
                          className="pill"
                          style={{
                            background: 'rgba(217,119,6,0.15)',
                            color: '#b45309',
                            fontWeight: 700,
                          }}
                        >
                          Master
                        </span>
                      ) : null}
                    </div>
                    {canDeleteAdmins && !isMe && !a.permissions?.manageAdmins && a.role !== 'Superadmin' ? (
                      <button
                        type="button"
                        className="icon-btn-sm"
                        title="Remove admin"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm({
                            title: 'Remove admin?',
                            message: `Permanently remove ${a.name}? They will lose console access.`,
                            confirmLabel: 'Remove',
                            danger: true,
                          });
                          if (!ok) return;
                          try {
                            await removeAdmin(a.id);
                            showToast(`${a.name} removed`);
                          } catch (err) {
                            showToast(err?.message || 'Could not remove admin', 'error');
                          }
                        }}
                      >
                        <svg><use href="#i-trash" /></svg>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Platform users ── */}
      <div className="section-header">
        <div>
          <div className="card-title">Platform users</div>
          <div className="card-title-sub">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} · click a card for
            account details
          </div>
        </div>
      </div>

      {filteredUsers.length ? (
        <div className="entity-grid">
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              selected={drawer?.userId === u.id}
              sensorCount={
                sensors.filter((s) => String(s.assignedUserId) === String(u.id)).length
              }
              onSelect={openDetail}
              onEdit={(id) => setDrawer({ mode: 'edit', userId: id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg>
            <use href="#i-search" />
          </svg>
          <p>
            {query
              ? `No users match "${query}"`
              : 'No users yet. Create a user to get started.'}
          </p>
        </div>
      )}

      <Drawer
        open={drawer?.mode === 'add' || drawer?.mode === 'edit'}
        title={drawer?.mode === 'add' ? 'Create user' : 'Edit user'}
        sub={
          drawer?.mode === 'add'
            ? 'Add a new person to the platform'
            : 'Update account details'
        }
        onClose={() => setDrawer(null)}
      >
        {drawer?.mode === 'add' && <UserForm onDone={() => setDrawer(null)} />}
        {drawer?.mode === 'edit' && editingUser && (
          <UserForm user={editingUser} onDone={() => setDrawer(null)} />
        )}
      </Drawer>

      <Drawer
        open={drawer?.mode === 'detail'}
        title={detailUser ? detailUser.name : 'User'}
        sub={detailUser ? detailUser.email : 'Account details'}
        onClose={() => setDrawer(null)}
      >
        {detailUser && (
          <div>
            <div className="field">
              <label>Name</label>
              <input className="input" value={detailUser.name || ''} readOnly />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={detailUser.email || ''} readOnly />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" value={detailUser.phone || '—'} readOnly />
            </div>
            <div className="field">
              <label>Role</label>
              <input className="input" value={detailUser.role || 'User'} readOnly />
            </div>
            <div className="field">
              <label>Status</label>
              <input className="input" value={detailUser.status || '—'} readOnly />
            </div>
            <div className="field">
              <label>Assigned sensors</label>
              <input className="input" value={`${detailSensorCount}`} readOnly />
            </div>
            <PermissionsPanel user={detailUser} />
          </div>
        )}
      </Drawer>
    </section>
  );
}
