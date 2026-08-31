import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PERMISSION_DEFS, initials } from '../lib/helpers.js';

function StatusPill({ status }) {
  if (status === 'active') {
    return (
      <span className="pill pill-good">
        <svg style={{ width: 9, height: 9 }}><use href="#i-check" /></svg>
        Active
      </span>
    );
  }
  if (status === 'suspended') {
    return <span className="pill pill-bad">Suspended</span>;
  }
  if (status === 'invited') {
    return <span className="pill pill-warn">Invited</span>;
  }
  return <span className="pill">{status || '—'}</span>;
}

export default function PermissionsPanel({ userId }) {
  const { users, sensors, togglePermission } = useData();
  const showToast = useToast();
  const [permsOpen, setPermsOpen] = useState(true);
  const user = users.find((u) => String(u.id) === String(userId));

  const sensorCount = useMemo(() => {
    if (!user) return 0;
    return sensors.filter((s) => String(s.assignedUserId) === String(user.id))
      .length;
  }, [sensors, user]);

  if (!user) {
    return (
      <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>
        User not found.
      </p>
    );
  }

  const grantedCount = PERMISSION_DEFS.filter(
    (p) => !!user.permissions?.[p.key]
  ).length;

  return (
    <>
      <div
        className="perm-user-head"
        style={{ marginBottom: 16, alignItems: 'center' }}
      >
        <div className="entity-avatar">{initials(user.name)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="entity-card-name">{user.name}</div>
          <div className="entity-card-sub">
            {user.role || 'User'} · {user.id}
          </div>
        </div>
        <StatusPill status={user.status} />
      </div>

      <div className="profile-contact" style={{ marginBottom: 16 }}>
        <div className="profile-contact-row">
          <svg><use href="#i-mail" /></svg>
          {user.email}
        </div>
        <div className="profile-contact-row">
          <svg><use href="#i-phone" /></svg>
          {user.phone || '—'}
        </div>
        <div className="profile-contact-row">
          <svg><use href="#i-cpu" /></svg>
          {sensorCount} sensor{sensorCount === 1 ? '' : 's'} assigned
        </div>
      </div>

      <div
        style={{
          border: '1px solid var(--border-soft, var(--border))',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setPermsOpen((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '14px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              opacity: 0.75,
            }}
          >
            Permissions
            <span style={{ marginLeft: 8, fontWeight: 600, opacity: 0.85 }}>
              ({grantedCount}/{PERMISSION_DEFS.length})
            </span>
          </span>
          <svg
            style={{
              width: 16,
              height: 16,
              flexShrink: 0,
              transform: permsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
              opacity: 0.6,
            }}
          >
            <use href="#i-chev" />
          </svg>
        </button>

        {permsOpen && (
          <div
            style={{
              padding: '0 16px 12px',
              borderTop: '1px solid var(--border-soft, var(--border))',
            }}
          >
            {PERMISSION_DEFS.map((p) => {
              const on = !!user.permissions?.[p.key];
              return (
                <div className="perm-row" key={p.key}>
                  <div>
                    <div className="perm-row-label">{p.label}</div>
                    <div className="perm-row-desc">{p.desc}</div>
                  </div>
                  <div
                    className={`switch${on ? ' on' : ''}${p.locked ? ' locked' : ''}`}
                    title={
                      p.locked
                        ? 'Always on — required to sign in and use the platform'
                        : ''
                    }
                    onClick={() => {
                      if (p.locked) return;
                      togglePermission(user.id, p.key);
                      showToast(
                        `${!on ? 'Granted' : 'Revoked'} "${p.label}" for ${user.name}`
                      );
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}