import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, planById, userById, initials } from '../lib/helpers.js';

export default function AssignView({ presetQuery, onConsumePreset }) {
  const { sensors, users, boardCatalog, subscriptionPlans, reassignSensor } = useData();
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (presetQuery) {
      setQuery(presetQuery);
      onConsumePreset?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetQuery]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = sensors.filter(r =>
      r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) ||
      userById(users, r.assignedUserId)?.name.toLowerCase().includes(q)
    );
    if (statusFilter === 'assigned') list = list.filter(r => r.assignedUserId);
    if (statusFilter === 'unassigned') list = list.filter(r => !r.assignedUserId);
    return list;
  }, [sensors, users, query, statusFilter]);

  function handleReassign(sensorId, userId) {
    reassignSensor(sensorId, userId);
    const owner = userById(users, userId);
    showToast(owner ? `${sensorId} assigned to ${owner.name}` : `${sensorId} set to Unassigned`);
  }

  return (
    <section className="view active">
      <div className="grid grid-3 section-gap">
        <div className="card"><div className="kpi-label">Total sensors</div><div className="kpi-value">{sensors.length}</div></div>
        <div className="card"><div className="kpi-label">Assigned</div><div className="kpi-value">{sensors.filter(r => r.assignedUserId).length}</div></div>
        <div className="card"><div className="kpi-label">Unassigned</div><div className="kpi-value">{sensors.filter(r => !r.assignedUserId).length}</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input type="text" placeholder="Search sensors or users…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="plain-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All sensors</option>
          <option value="assigned">Assigned only</option>
          <option value="unassigned">Unassigned only</option>
        </select>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Assign sensors to users</div>
            <div className="card-title-sub">Change the dropdown to reassign a sensor instantly</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Sensor</th><th>Board</th><th>Location</th><th>Subscription</th><th>Currently assigned</th><th>Reassign to</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(r => {
                const board = boardById(boardCatalog, r.boardId);
                const plan = planById(subscriptionPlans, r.subscriptionPlan);
                const owner = userById(users, r.assignedUserId);
                return (
                  <tr key={r.id}>
                    <td><b>{r.id}</b><div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600 }}>{r.name}</div></td>
                    <td><span className="board-chip"><svg><use href="#i-cpu" /></svg>{board.name}</span></td>
                    <td>{r.name}</td>
                    <td>{plan.name}</td>
                    <td>{owner
                      ? <div className="user-cell"><div className="avatar-sm">{initials(owner.name)}</div>{owner.name}</div>
                      : <span className="pill pill-muted">Unassigned</span>}</td>
                    <td>
                      <select className="row-select" value={r.assignedUserId || ''} onChange={e => handleReassign(r.id, e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6}><div className="empty-state"><svg><use href="#i-search" /></svg><p>No sensors match "{query}"</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
