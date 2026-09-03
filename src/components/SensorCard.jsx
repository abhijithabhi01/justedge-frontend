import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { boardById, planById, userById, battColor, daysUntil, timeAgo } from '../lib/helpers.js';

export default function SensorCard({ sensor, onView, onEdit, canEdit = true, canRemove = true }) {
  const { boardCatalog, subscriptionPlans, users, removeSensor } = useData();
  const confirm = useConfirm();
  const showToast = useToast();
  const board = boardById(boardCatalog, sensor.boardId);
  const plan = planById(subscriptionPlans, sensor.subscriptionPlan);
  const owner = userById(users, sensor.assignedUserId);
  const dLeft = daysUntil(sensor.subscriptionExpiry);
  const expPill = dLeft < 0
    ? <span className="pill pill-bad">Expired</span>
    : dLeft <= 30
      ? <span className="pill pill-warn">{dLeft}d left</span>
      : <span className="mono-faint">{sensor.subscriptionExpiry}</span>;

  return (
    <div className={`entity-card${sensor.status !== 'online' ? ' is-offline' : ''}`} onClick={() => onView(sensor.id)}>
      <div className="entity-card-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div className="entity-avatar sensor"><svg style={{ width: 18, height: 18 }}><use href="#i-cpu" /></svg></div>
          <div style={{ minWidth: 0 }}>
            <div className="entity-card-name">{sensor.name}</div>
            <div className="entity-card-sub">{sensor.id} · {board.name}</div>
          </div>
        </div>
        {sensor.status === 'online'
          ? <span className="pill pill-good"><svg style={{ width: 9, height: 9 }}><use href="#i-check" /></svg>Online</span>
          : <span className="pill pill-bad">Offline</span>}
      </div>
      <div className="entity-card-body">
        <div className="entity-meta-row">
          <span className="k">Battery</span>
          <span className="v" style={{ color: battColor(sensor.battery) }}>
            {sensor.battery != null ? `${sensor.battery}%` : '—'}
          </span>
        </div>
        {((sensor.latitude != null && sensor.longitude != null) || (sensor.lat != null && sensor.lng != null)) && (
          <div className="entity-meta-row">
            <span className="k">Location</span>
            <span className="v" style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {Number(sensor.latitude ?? sensor.lat).toFixed(4)}, {Number(sensor.longitude ?? sensor.lng).toFixed(4)}
            </span>
          </div>
        )}
        <div className="entity-meta-row"><span className="k">Subscription</span><span className="v">{plan.name} · {expPill}</span></div>
        <div className="entity-meta-row"><span className="k">Assigned to</span><span className="v">{owner ? owner.name : 'Unassigned'}</span></div>
        {(sensor.site || sensor.tag) && (
          <div className="entity-meta-row">
            <span className="k">Site</span>
            <span className="v">{sensor.site || sensor.tag}</span>
          </div>
        )}
        <div className="entity-meta-row">
          <span className="k">Last seen</span>
          <span className="v" style={{ color: sensor.status === 'online' ? 'var(--text)' : 'var(--danger, #b91c1c)' }}>
            {sensor.status === 'online'
              ? (sensor.lastSeen || sensor.lastPing
                  ? timeAgo(sensor.lastSeen || sensor.lastPing)
                  : 'Just now')
              : (sensor.lastSeen
                  ? timeAgo(sensor.lastSeen)
                  : 'No report')}
          </span>
        </div>
      </div>
      <div className="entity-card-foot">
        <span className="board-chip"><svg><use href="#i-cpu" /></svg>{board.conn}</span>
        <div className="entity-card-actions">
          <button className="icon-btn-sm" title="View detail" onClick={(e) => { e.stopPropagation(); onView(sensor.id); }}><svg><use href="#i-chev" /></svg></button>
          {canEdit && (
            <button className="icon-btn-sm" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(sensor.id); }}><svg><use href="#i-edit" /></svg></button>
          )}
          {canRemove && (
            <button
              className="icon-btn-sm"
              title="Remove"
              onClick={async (e) => {
                e.stopPropagation();
                const ok = await confirm({
                  title: 'Remove sensor?',
                  message: `This permanently removes "${sensor.name || sensor.id}" from the fleet. This cannot be undone.`,
                  confirmLabel: 'Remove',
                });
                if (!ok) return;
                try {
                  await removeSensor(sensor.id);
                  showToast(`${sensor.name || sensor.id} removed`, 'success');
                } catch (err) {
                  showToast(err.message || 'Could not remove sensor', 'error');
                }
              }}
            >
              <svg><use href="#i-trash" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}