import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { downloadCSV } from '../lib/csv.js';
import { formatDateTime, severityPillClass } from '../lib/helpers.js';

const CATEGORY_LABEL = { admin: 'Admin', access: 'Access', user: 'User', sensor: 'Sensor', data: 'Data', security: 'Security' };

export default function SuperAdminActivityView() {
  const { activityLogs } = useData();
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');

  const logs = activityLogs || [];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return logs
      .filter(l =>
        (!q || l.actorName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || String(l.target).toLowerCase().includes(q)) &&
        (!category || l.category === category) &&
        (!severity || l.severity === severity)
      )
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, query, category, severity]);

  const last24h = logs.filter(l => Date.now() - new Date(l.timestamp).getTime() < 86400000).length;
  const criticalCount = logs.filter(l => l.severity === 'critical').length;
  const distinctActors = new Set(logs.map(l => l.actorId || l.actorName)).size;

  function exportCsv() {
    downloadCSV(
      'hearth-activity-log.csv',
      ['Time', 'Actor', 'Role', 'Action', 'Target', 'Category', 'Severity', 'IP'],
      filtered.map(l => [formatDateTime(l.timestamp), l.actorName, l.actorRole, l.action, l.target, CATEGORY_LABEL[l.category] || l.category, l.severity, l.ip])
    );
    showToast(`Exported ${filtered.length} log entries`);
  }

  return (
    <section className="view active">
      <div className="grid grid-4 section-gap">
        <div className="card"><div className="kpi-label">Total events</div><div className="kpi-value">{logs.length}</div></div>
        <div className="card"><div className="kpi-label">Last 24h</div><div className="kpi-value">{last24h}</div></div>
        <div className="card"><div className="kpi-label">Critical events</div><div className="kpi-value" style={{ color: criticalCount ? 'var(--danger)' : undefined }}>{criticalCount}</div></div>
        <div className="card"><div className="kpi-label">Distinct actors</div><div className="kpi-value">{distinctActors}</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input type="text" placeholder="Search by actor, action, or target…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="plain-select" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="plain-select" value={severity} onChange={e => setSeverity(e.target.value)}>
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button className="btn btn-ghost" onClick={exportCsv}><svg><use href="#i-download" /></svg>Export CSV</button>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Audit trail</div>
            <div className="card-title-sub">{filtered.length} event{filtered.length !== 1 ? 's' : ''} · newest first</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Category</th><th>Severity</th><th>IP</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(l => (
                <tr key={l.id}>
                  <td className="mono-faint">{formatDateTime(l.timestamp)}</td>
                  <td><b>{l.actorName}</b><div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>{l.actorRole}</div></td>
                  <td>{l.action}</td>
                  <td>{l.target}</td>
                  <td><span className="pill pill-muted">{CATEGORY_LABEL[l.category] || l.category}</span></td>
                  <td><span className={`pill ${severityPillClass(l.severity)}`}>{l.severity}</span></td>
                  <td className="mono-faint">{l.ip}</td>
                </tr>
              )) : (
                <tr><td colSpan={7}><div className="empty-state"><svg><use href="#i-search" /></svg><p>No activity matches your filters</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
