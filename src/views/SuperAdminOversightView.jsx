import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { severityPillClass, timeAgo } from '../lib/helpers.js';

export default function SuperAdminOversightView() {
  const { adminAccounts, sensors, activityLogs, securityFlags, resolveSecurityFlag } = useData();
  const showToast = useToast();
  const [showResolved, setShowResolved] = useState(false);

  const flags = securityFlags || [];
  const visibleFlags = useMemo(
    () => flags.filter(f => showResolved || !f.resolved).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [flags, showResolved]
  );

  const openFlags = flags.filter(f => !f.resolved).length;
  const criticalOpen = flags.filter(f => !f.resolved && f.severity === 'critical').length;
  const without2fa = adminAccounts.filter(a => !a.twoFactor && a.status !== 'suspended');
  const inactive30d = adminAccounts.filter(a => a.lastLogin && Date.now() - new Date(a.lastLogin).getTime() > 30 * 86400000);
  const suspended = adminAccounts.filter(a => a.status === 'suspended');
  const onlinePct = sensors.length ? Math.round((sensors.filter(s => s.status === 'online').length / sensors.length) * 100) : 100;
  const failedSignins7d = (activityLogs || []).filter(l => l.action.toLowerCase().includes('failed') && Date.now() - new Date(l.timestamp).getTime() < 7 * 86400000).length;

  function handleResolve(id, title) {
    resolveSecurityFlag(id);
    showToast(`Marked "${title}" as resolved`);
  }

  return (
    <section className="view active">
      <div className="grid grid-4 section-gap">
        <div className="card"><div className="kpi-label">Open flags</div><div className="kpi-value" style={{ color: openFlags ? 'var(--warn)' : undefined }}>{openFlags}</div></div>
        <div className="card"><div className="kpi-label">Critical &amp; open</div><div className="kpi-value" style={{ color: criticalOpen ? 'var(--danger)' : undefined }}>{criticalOpen}</div></div>
        <div className="card"><div className="kpi-label">Failed sign-ins (7d)</div><div className="kpi-value">{failedSignins7d}</div></div>
        <div className="card"><div className="kpi-label">Fleet online</div><div className="kpi-value">{onlinePct}%</div></div>
      </div>

      <div className="card section-gap">
        <div className="card-head">
          <div>
            <div className="card-title">Oversight flags</div>
            <div className="card-title-sub">Risk signals surfaced from account, access and sign-in patterns</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.3, fontWeight: 700, color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} />
            Show resolved
          </label>
        </div>
        {visibleFlags.length ? (
          <div>
            {visibleFlags.map(f => (
              <div className="perm-summary-row" key={f.id}>
                <div className={`perm-summary-icon ${f.resolved ? 'revoked' : 'granted'}`} style={!f.resolved && f.severity === 'critical' ? { background: 'var(--danger-soft)', color: 'var(--danger)' } : undefined}>
                  <svg><use href="#i-alert" /></svg>
                </div>
                <div className="perm-summary-text">
                  <div className="perm-summary-label">{f.title}</div>
                  <div className="perm-summary-desc">{f.description}</div>
                  <div className="perm-summary-desc" style={{ marginTop: 3 }}>{timeAgo(f.createdAt)}</div>
                </div>
                <span className={`pill ${severityPillClass(f.severity)}`}>{f.severity}</span>
                {!f.resolved && (
                  <button className="btn btn-ghost" style={{ marginLeft: 10 }} onClick={() => handleResolve(f.id, f.title)}>
                    <svg><use href="#i-check" /></svg>Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><svg><use href="#i-shield" /></svg><p>No open oversight flags</p></div>
        )}
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-title">Missing 2FA</div>
          <div className="card-title-sub" style={{ marginBottom: 12 }}>{without2fa.length} admin{without2fa.length !== 1 ? 's' : ''} without two-factor</div>
          {without2fa.length ? without2fa.map(a => (
            <div className="entity-meta-row" key={a.id}><span className="k">{a.name}</span><span className="v">{a.role}</span></div>
          )) : <div className="entity-meta-row"><span className="k">All admins covered</span></div>}
        </div>
        <div className="card">
          <div className="card-title">Inactive 30+ days</div>
          <div className="card-title-sub" style={{ marginBottom: 12 }}>{inactive30d.length} account{inactive30d.length !== 1 ? 's' : ''} gone quiet</div>
          {inactive30d.length ? inactive30d.map(a => (
            <div className="entity-meta-row" key={a.id}><span className="k">{a.name}</span><span className="v">{timeAgo(a.lastLogin)}</span></div>
          )) : <div className="entity-meta-row"><span className="k">Everyone's been active</span></div>}
        </div>
        <div className="card">
          <div className="card-title">Suspended accounts</div>
          <div className="card-title-sub" style={{ marginBottom: 12 }}>{suspended.length} currently locked out</div>
          {suspended.length ? suspended.map(a => (
            <div className="entity-meta-row" key={a.id}><span className="k">{a.name}</span><span className="v">{a.role}</span></div>
          )) : <div className="entity-meta-row"><span className="k">No suspensions</span></div>}
        </div>
      </div>
    </section>
  );
}
