import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, planById, userById, initials } from '../lib/helpers.js';
import Drawer from '../components/Drawer.jsx';

function useIsMobile(breakpoint = 820) {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    mq.addListener?.(apply);
    return () => {
      mq.removeEventListener?.('change', apply);
      mq.removeListener?.(apply);
    };
  }, [breakpoint]);
  return mobile;
}

function locationLabel(r) {
  const lat = r.latitude ?? r.lat;
  const lng = r.longitude ?? r.lng;
  if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
  }
  if (r.site) return r.site;
  return r.name || '—';
}

export default function AssignView({ presetQuery, onConsumePreset }) {
  const { sensors, users, boardCatalog, subscriptionPlans, reassignSensor } = useData();
  const showToast = useToast();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null); // sensor for mobile drawer

  useEffect(() => {
    if (presetQuery) {
      setQuery(presetQuery);
      onConsumePreset?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetQuery]);

  // Keep drawer sensor fresh after reassign
  useEffect(() => {
    if (!selected) return;
    const fresh = sensors.find((s) => String(s.id) === String(selected.id));
    if (fresh) setSelected(fresh);
  }, [sensors, selected?.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sensors;
    if (q) {
      list = list.filter(
        (r) =>
          String(r.name || '')
            .toLowerCase()
            .includes(q) ||
          String(r.id || '')
            .toLowerCase()
            .includes(q) ||
          String(r.awsDeviceId || '')
            .toLowerCase()
            .includes(q) ||
          String(r.site || '')
            .toLowerCase()
            .includes(q) ||
          userById(users, r.assignedUserId)?.name.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'assigned') list = list.filter((r) => r.assignedUserId);
    if (statusFilter === 'unassigned') list = list.filter((r) => !r.assignedUserId);
    return list;
  }, [sensors, users, query, statusFilter]);

  async function handleReassign(sensorId, userId) {
    const sensor = sensors.find((s) => String(s.id) === String(sensorId));
    const label = sensor?.name || sensorId;
    const owner = userById(users, userId);
    try {
      await reassignSensor(sensorId, userId);
      showToast(owner ? `${label} assigned to ${owner.name}` : `${label} set to Unassigned`);
    } catch (err) {
      showToast(err?.message || 'Could not reassign sensor', 'error');
    }
  }

  const qLower = query.trim().toLowerCase();

  return (
    <section className="view active">
      <div className="grid grid-3 section-gap">
        <div className="card">
          <div className="kpi-label">Total sensors</div>
          <div className="kpi-value">{sensors.length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Assigned</div>
          <div className="kpi-value">{sensors.filter((r) => r.assignedUserId).length}</div>
        </div>
        <div className="card">
          <div className="kpi-label">Unassigned</div>
          <div className="kpi-value">{sensors.filter((r) => !r.assignedUserId).length}</div>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-search" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <svg>
            <use href="#i-search" />
          </svg>
          <input
            type="text"
            placeholder="Search by sensor name, user, or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingRight: query ? 36 : undefined }}
          />
          {query ? (
            <button
              type="button"
              title="Clear search"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                borderRadius: 6,
              }}
            >
              <svg style={{ width: 16, height: 16 }}>
                <use href="#i-x" />
              </svg>
            </button>
          ) : null}
        </div>
        <select
          className="plain-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All sensors</option>
          <option value="assigned">Assigned only</option>
          <option value="unassigned">Unassigned only</option>
        </select>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Assign sensors to users</div>
            <div className="card-title-sub">
              {isMobile
                ? 'Tap a sensor to open details and reassign'
                : 'Change the dropdown to reassign a sensor instantly'}
            </div>
          </div>
        </div>

        {/* ── Desktop table ── */}
        {!isMobile && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sensor</th>
                  <th>Board</th>
                  <th>Location</th>
                  <th>Subscription</th>
                  <th>Currently assigned</th>
                  <th>Reassign to</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((r) => {
                    const board = boardById(boardCatalog, r.boardId);
                    const plan = planById(subscriptionPlans, r.subscriptionPlan);
                    const owner = userById(users, r.assignedUserId);
                    const nameMatch =
                      qLower &&
                      String(r.name || '')
                        .toLowerCase()
                        .includes(qLower);
                    return (
                      <tr
                        key={r.id}
                        style={
                          nameMatch
                            ? { background: 'var(--amber-soft, rgba(245, 158, 11, 0.12))' }
                            : undefined
                        }
                      >
                        <td>
                          <b style={{ fontSize: 14 }}>{r.name || 'Unnamed'}</b>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-faint)',
                              fontWeight: 500,
                              marginTop: 2,
                              fontFamily: 'ui-monospace, monospace',
                            }}
                          >
                            {r.id}
                          </div>
                        </td>
                        <td>
                          <span className="board-chip">
                            <svg>
                              <use href="#i-cpu" />
                            </svg>
                            {board?.name || r.boardId || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: 13 }}>{locationLabel(r)}</td>
                        <td>{plan?.name || r.subscriptionPlan || '—'}</td>
                        <td>
                          {owner ? (
                            <div className="user-cell">
                              <div className="avatar-sm">{initials(owner.name)}</div>
                              {owner.name}
                            </div>
                          ) : (
                            <span className="pill pill-muted">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <select
                            className="row-select"
                            value={r.assignedUserId || ''}
                            onChange={(e) => handleReassign(r.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <svg>
                          <use href="#i-search" />
                        </svg>
                        <p>No sensors match &quot;{query}&quot;</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Mobile list ── */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0 8px' }}>
            {filtered.length ? (
              filtered.map((r) => {
                const owner = userById(users, r.assignedUserId);
                const board = boardById(boardCatalog, r.boardId);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelected(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 14px',
                      borderRadius: 12,
                      border: '1px solid var(--border, #e5e7eb)',
                      background: 'var(--surface, #fff)',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--amber-soft, rgba(245,158,11,.15))',
                        color: 'var(--amber, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg style={{ width: 20, height: 20 }}>
                        <use href="#i-cpu" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-main)' }}>
                        {r.name || 'Unnamed'}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {board?.name || r.boardId || 'Board'} · {locationLabel(r)}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {owner ? (
                        <span className="pill" style={{ fontSize: 11 }}>
                          {owner.name}
                        </span>
                      ) : (
                        <span className="pill pill-muted" style={{ fontSize: 11 }}>
                          Unassigned
                        </span>
                      )}
                    </div>
                    <svg style={{ width: 16, height: 16, color: 'var(--text-faint)', flexShrink: 0 }}>
                      <use href="#i-chev" />
                    </svg>
                  </button>
                );
              })
            ) : (
              <div className="empty-state">
                <svg>
                  <use href="#i-search" />
                </svg>
                <p>No sensors match &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile detail / assign drawer */}
      <Drawer
        open={!!selected}
        title={selected?.name || 'Sensor'}
        sub="Assign or change the owner"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--surface-2, #f8fafc)',
                fontSize: 13,
                lineHeight: 1.55,
              }}
            >
              <DetailRow label="Sensor" value={selected.name} />
              <DetailRow
                label="Board"
                value={boardById(boardCatalog, selected.boardId)?.name || selected.boardId || '—'}
              />
              <DetailRow label="Location" value={locationLabel(selected)} />
              <DetailRow
                label="Subscription"
                value={
                  planById(subscriptionPlans, selected.subscriptionPlan)?.name ||
                  selected.subscriptionPlan ||
                  '—'
                }
              />
              <DetailRow
                label="Currently assigned"
                value={userById(users, selected.assignedUserId)?.name || 'Unassigned'}
              />
              <DetailRow
                label="ID"
                value={selected.id}
                mono
              />
            </div>

            <div className="field">
              <label>Reassign to</label>
              <select
                className="input"
                value={selected.assignedUserId || ''}
                onChange={(e) => handleReassign(selected.id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="btn btn-ghost btn-block" onClick={() => setSelected(null)}>
              Done
            </button>
          </div>
        )}
      </Drawer>
    </section>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
        borderBottom: '1px solid var(--border, #e5e7eb)',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        style={{
          fontWeight: 600,
          textAlign: 'right',
          wordBreak: 'break-all',
          fontFamily: mono ? 'ui-monospace, monospace' : undefined,
          fontSize: mono ? 11 : 13,
        }}
      >
        {value}
      </span>
    </div>
  );
}
