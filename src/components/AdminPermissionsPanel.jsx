import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ADMIN_PERMISSION_DEFS, initials } from '../lib/helpers.js';

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

function CollapsibleSection({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        border: '1px solid var(--border-soft, var(--border))',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        background: 'var(--surface, #fff)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
          {title}
          {typeof count === 'number' && (
            <span style={{ marginLeft: 8, fontWeight: 600, opacity: 0.85 }}>
              ({count})
            </span>
          )}
        </span>
        <svg
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            opacity: 0.6,
          }}
        >
          <use href="#i-chev" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            padding: '0 16px 14px',
            borderTop: '1px solid var(--border-soft, var(--border))',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminPermissionsPanel({ adminId }) {
  const { adminAccounts, users, toggleAdminPermission } = useData();
  const { session } = useAuth();
  const showToast = useToast();
  const admin = adminAccounts.find((a) => String(a.id) === String(adminId));

  const teamUsers = useMemo(() => {
    if (!admin) return [];

    // Prefer teamUsers from listAdmins API
    if (Array.isArray(admin.teamUsers) && admin.teamUsers.length > 0) {
      return admin.teamUsers;
    }

    // Fallback: match users by createdBy
    const adminIdStr = String(admin.id);
    return (users || []).filter(
      (u) => u.createdBy && String(u.createdBy) === adminIdStr
    );
  }, [admin, users]);

  if (!admin) {
    return (
      <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>
        Admin account not found.
      </p>
    );
  }

  const isSelf = session?.adminId === admin.id;

  return (
    <>
      <div
        className="perm-user-head"
        style={{ marginBottom: 16, alignItems: 'center' }}
      >
        <div className="entity-avatar">{initials(admin.name)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="entity-card-name">
            {admin.name}
            {isSelf ? ' (you)' : ''}
          </div>
          <div className="entity-card-sub">
            {admin.role} · {admin.companyName || '—'}
          </div>
        </div>
        <StatusPill status={admin.status} />
      </div>

      <div className="profile-contact" style={{ marginBottom: 16 }}>
        <div className="profile-contact-row">
          <svg><use href="#i-mail" /></svg>
          {admin.email}
        </div>
        <div className="profile-contact-row">
          <svg><use href="#i-phone" /></svg>
          {admin.phone || '—'}
        </div>
        <div className="profile-contact-row">
          <svg><use href="#i-users" /></svg>
          {admin.userCount ?? teamUsers.length} user
          {(admin.userCount ?? teamUsers.length) === 1 ? '' : 's'} under this admin
        </div>
      </div>

      {isSelf && (
        <div
          className="form-error show"
          style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
        >
          Editing your own access can lock you out of this page.
        </div>
      )}

      {admin.status === 'suspended' && (
        <div
          className="form-error show"
          style={{
            background: 'var(--danger-soft)',
            color: 'var(--danger)',
            marginBottom: 12,
          }}
        >
          This admin is suspended. Their users are suspended too and cannot
          sign in until the admin is reactivated.
        </div>
      )}

      <CollapsibleSection
        title="Console permissions"
        count={ADMIN_PERMISSION_DEFS.length}
        
      >
        {ADMIN_PERMISSION_DEFS.map((p) => {
          const on = !!admin.permissions?.[p.key];
          const locked = p.locked && admin.role !== 'Superadmin';
          return (
            <div className="perm-row" key={p.key}>
              <div>
                <div className="perm-row-label">{p.label}</div>
                <div className="perm-row-desc">{p.desc}</div>
              </div>
              <div
                className={`switch${on ? ' on' : ''}${locked ? ' locked' : ''}`}
                title={
                  locked
                    ? 'Only Superadmins can manage other admin accounts'
                    : ''
                }
                onClick={() => {
                  if (locked) return;
                  toggleAdminPermission(admin.id, p.key);
                  showToast(
                    `${!on ? 'Granted' : 'Revoked'} "${p.label}" for ${admin.name}`
                  );
                }}
              />
            </div>
          );
        })}
      </CollapsibleSection>

      <CollapsibleSection
        title="Users under this admin"
        count={teamUsers.length}
        
      >
        {teamUsers.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-sub)',
              margin: '12px 0 4px',
            }}
          >
            No users linked to this admin yet. Users created by this admin will
            appear here.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: '8px 0 0' }}>
            {teamUsers.map((u) => (
              <li
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 0',
                  borderBottom:
                    '1px solid var(--border-soft, var(--border))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <div
                    className="entity-avatar"
                    style={{ width: 32, height: 32, fontSize: 12 }}
                  >
                    {initials(u.name)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {u.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-sub)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {u.email}
                    </div>
                  </div>
                </div>
                <StatusPill status={u.status} />
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </>
  );
}