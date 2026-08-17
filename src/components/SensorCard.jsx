import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, planById, userById, battColor, daysUntil } from '../lib/helpers.js';

export default function SensorCard({ sensor, onView, onEdit, canEdit = true, canRemove = true }) {
  const { boardCatalog, subscriptionPlans, users, removeSensor } = useData();
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
    <div className="entity-card" onClick={() => onView(sensor.id)}>
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
        <div className="entity-meta-row"><span className="k">Battery</span><span className="v" style={{ color: battColor(sensor.battery) }}>{sensor.battery}%</span></div>
        <div className="entity-meta-row"><span className="k">Subscription</span><span className="v">{plan.name} · {expPill}</span></div>
        <div className="entity-meta-row"><span className="k">Assigned to</span><span className="v">{owner ? owner.name : 'Unassigned'}</span></div>
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
              onClick={(e) => { e.stopPropagation(); removeSensor(sensor.id); showToast(`${sensor.id} removed`); }}
            >
              <svg><use href="#i-trash" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
