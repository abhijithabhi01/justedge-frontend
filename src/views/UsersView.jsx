import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import UserCard from '../components/UserCard.jsx';
import PermissionsPanel from '../components/PermissionsPanel.jsx';
import Drawer from '../components/Drawer.jsx';
import UserForm from '../components/UserForm.jsx';

export default function UsersView() {
  const { users, sensors } = useData();
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [drawer, setDrawer] = useState(null); // { mode: 'add'|'edit', userId }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      String(u.role || 'User').toLowerCase().includes(q)
    );
  }, [users, query]);

  const editingUser = drawer?.mode === 'edit' ? users.find(u => u.id === drawer.userId) : null;

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input type="text" placeholder="Search by name, email, or role…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <button className="btn btn-amber" onClick={() => setDrawer({ mode: 'add' })}><svg><use href="#i-plus" /></svg>Create user</button>
      </div>

      <div className="users-layout">
        <div>
          <div className="section-header">
            <div>
              <div className="card-title">Platform users</div>
              <div className="card-title-sub">{filtered.length} user{filtered.length !== 1 ? 's' : ''} · click a card to manage permissions</div>
            </div>
          </div>
          {filtered.length ? (
            <div className="entity-grid">
              {filtered.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  selected={u.id === selectedUserId}
                  sensorCount={sensors.filter(s => s.assignedUserId === u.id).length}
                  onSelect={setSelectedUserId}
                  onEdit={(id) => setDrawer({ mode: 'edit', userId: id })}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state"><svg><use href="#i-search" /></svg><p>No users match "{query}"</p></div>
          )}
        </div>
        <PermissionsPanel userId={selectedUserId} />
      </div>

      <Drawer
        open={!!drawer}
        title={drawer?.mode === 'add' ? 'Create user' : 'Edit user'}
        sub={drawer?.mode === 'add' ? 'Add a new person to the platform' : `${editingUser?.id} · update account details`}
        onClose={() => setDrawer(null)}
      >
        {drawer?.mode === 'add' && <UserForm onDone={() => setDrawer(null)} />}
        {drawer?.mode === 'edit' && editingUser && <UserForm user={editingUser} onDone={() => setDrawer(null)} />}
      </Drawer>
    </section>
  );
}
