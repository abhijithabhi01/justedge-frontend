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
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.role || 'User').toLowerCase().includes(q)
    );
  }, [users, query]);

  const editingUser =
    drawer?.mode === 'edit'
      ? users.find((u) => u.id === drawer.userId)
      : null;

  const detailUser =
    drawer?.mode === 'detail'
      ? users.find((u) => u.id === drawer.userId)
      : null;

  function openDetail(id) {
    setDrawer({ mode: 'detail', userId: id });
  }

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input
            type="text"
            placeholder="Search by name, email, or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="btn btn-amber"
          onClick={() => setDrawer({ mode: 'add' })}
        >
          <svg><use href="#i-plus" /></svg>Create user
        </button>
      </div>

      <div className="section-header">
        <div>
          <div className="card-title">Platform users</div>
          <div className="card-title-sub">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''} · click a
            card to manage permissions
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
                sensors.filter((s) => s.assignedUserId === u.id).length
              }
              onSelect={openDetail}
              onEdit={(id) => setDrawer({ mode: 'edit', userId: id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg><use href="#i-search" /></svg>
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
            : `${editingUser?.id || ''} · update account details`
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
        sub={
          detailUser
            ? `${detailUser.role || 'User'} · ${detailUser.id}`
            : 'Permissions & account'
        }
        onClose={() => setDrawer(null)}
      >
        {drawer?.mode === 'detail' && drawer.userId && (
          <>
            <PermissionsPanel userId={drawer.userId} />
            <button
              className="btn btn-amber btn-block"
              style={{ marginTop: 12 }}
              onClick={() =>
                setDrawer({ mode: 'edit', userId: drawer.userId })
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