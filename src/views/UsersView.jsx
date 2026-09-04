import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import UserCard from '../components/UserCard.jsx';
import PermissionsPanel from '../components/PermissionsPanel.jsx';
import Drawer from '../components/Drawer.jsx';
import UserForm from '../components/UserForm.jsx';

export default function UsersView() {
  const { users, sensors } = useData();
  const [query, setQuery] = useState('');
  // drawer: { mode: 'add' | 'edit' | 'detail', userId? }
  const [drawer, setDrawer] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        String(u.role || 'User').toLowerCase().includes(q)
    );
  }, [users, query]);

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

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="filter-search">
          <svg>
            <use href="#i-search" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
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

      <div className="section-header">
        <div>
          <div className="card-title">Platform users</div>
          <div className="card-title-sub">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''} · click a
            card for account details
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="entity-grid">
          {filtered.map((u) => (
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
        {drawer?.mode === 'add' && (
          <UserForm onDone={() => setDrawer(null)} />
        )}
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
              <label>Account ID</label>
              <input className="input" value={String(detailUser.id)} readOnly />
            </div>
            <div className="field">
              <label>Sensors assigned</label>
              <input className="input" value={String(detailSensorCount)} readOnly />
            </div>
            <div className="field">
              <label>Last login</label>
              <input
                className="input"
                value={
                  detailUser.lastLogin
                    ? new Date(detailUser.lastLogin).toLocaleString()
                    : 'Never'
                }
                readOnly
              />
            </div>
            <div className="field">
              <label>Created</label>
              <input
                className="input"
                value={
                  detailUser.createdAt
                    ? new Date(detailUser.createdAt).toLocaleString()
                    : '—'
                }
                readOnly
              />
            </div>

            <PermissionsPanel userId={detailUser.id} />

            <button
              type="button"
              className="btn btn-amber btn-block"
              style={{ marginTop: 12 }}
              onClick={() =>
                setDrawer({ mode: 'edit', userId: detailUser.id })
              }
            >
              Edit account details
            </button>
          </div>
        )}
      </Drawer>
    </section>
  );
}