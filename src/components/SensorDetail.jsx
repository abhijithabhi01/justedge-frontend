import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, planById, userById, battColor } from '../lib/helpers.js';
import { chartBaseOptions, genSeries } from '../lib/chartUtils.js';
import { useChart } from '../lib/useChart.js';

function signalLabel(s) {
  return s >= -60 ? 'Excellent' : s >= -70 ? 'Good' : s >= -80 ? 'Fair' : 'Poor';
}

const METRIC_COLORS = { temp: '#dd7c3f', hum: '#2b9490', battery: '#8a5fd6' };
const METRICS = [{ key: 'temp', label: 'Temp' }, { key: 'hum', label: 'Humidity' }, { key: 'battery', label: 'Battery' }];
const RANGES = ['24h', '7d', '30d'];

export default function SensorDetail({ sensor, onEdit, onReassign, onClose, canEdit = true, canRemove = true, canReassign = true }) {
  const { boardCatalog, subscriptionPlans, users, removeSensor } = useData();
  const showToast = useToast();
  const [metric, setMetric] = useState('temp');
  const [range, setRange] = useState('24h');

  const board = boardById(boardCatalog, sensor.boardId);
  const plan = planById(subscriptionPlans, sensor.subscriptionPlan);
  const owner = userById(users, sensor.assignedUserId);
  const bc = battColor(sensor.battery);
  const sigColor = sensor.signal < -75 ? 'var(--danger)' : sensor.signal < -65 ? 'var(--warn)' : 'var(--good)';
  const fwLatest = sensor.fw === 'v2.4.1';

  const canvasRef = useChart((ctx) => {
    const color = METRIC_COLORS[metric];
    const base = metric === 'temp' ? sensor.base : metric === 'hum' ? sensor.hum : sensor.battery;
    const amp = metric === 'temp' ? sensor.amp : metric === 'hum' ? 6 : 3;
    const { labels, data } = genSeries(base, amp, range);
    const displayData = metric === 'battery' ? data.map(v => Math.max(0, Math.min(100, v))) : data;
    const yUnit = metric === 'temp' ? '°C' : '%';
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    const opts = chartBaseOptions(yUnit);
    opts.scales.x.ticks.maxTicksLimit = 5;
    return {
      type: 'line',
      data: { labels, datasets: [{ data: displayData, borderColor: color, backgroundColor: gradient, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, pointHoverBackgroundColor: color, pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, fill: true, tension: 0.4 }] },
      options: opts,
    };
  }, [sensor.id, metric, range]);

  return (
    <>
      <div className="drawer-section">Live readings</div>
      <div className="drawer-stat"><span className="drawer-stat-label">Temperature</span><span className="drawer-stat-val">{sensor.temp}°C</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Humidity</span><span className="drawer-stat-val">{sensor.hum}%</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Battery</span><span className="drawer-stat-val" style={{ color: bc }}>{sensor.battery}%</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Signal strength</span><span className="drawer-stat-val" style={{ color: sigColor }}>{sensor.signal} dBm ({signalLabel(sensor.signal)})</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Status</span><span className="drawer-stat-val" style={{ color: sensor.status === 'online' ? 'var(--good)' : 'var(--danger)' }}>{sensor.status === 'online' ? 'Online' : 'Offline'}</span></div>

      <div className="drawer-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span>Trend</span>
        <div className="segmented" style={{ padding: 2 }}>
          {METRICS.map(m => (
            <button key={m.key} className={metric === m.key ? 'active' : ''} style={{ padding: '4px 9px', fontSize: 11 }} onClick={() => setMetric(m.key)}>{m.label}</button>
          ))}
        </div>
      </div>
      <div className="segmented" style={{ marginBottom: 10 }}>
        {RANGES.map(r => (
          <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      <div className="chart-wrap" style={{ height: 180 }}><canvas ref={canvasRef}></canvas></div>

      <div className="drawer-section">Board & connectivity</div>
      <div className="drawer-stat"><span className="drawer-stat-label">Board</span><span className="drawer-stat-val">{board.name} ({board.conn})</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">IMEI</span><span className="drawer-stat-val">{sensor.imei}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">MAC address</span><span className="drawer-stat-val">{sensor.mac || '—'}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">SIM</span><span className="drawer-stat-val">{sensor.simNo || '—'}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Firmware</span><span className={`fw-badge ${fwLatest ? 'latest' : 'outdated'}`}>{sensor.fw}{fwLatest ? ' ✓' : ' ↑ update'}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Last ping</span><span className="drawer-stat-val">{sensor.lastPing}</span></div>

      <div className="drawer-section">Subscription & owner</div>
      <div className="drawer-stat"><span className="drawer-stat-label">Plan</span><span className="drawer-stat-val">{plan.name}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Expires</span><span className="drawer-stat-val">{sensor.subscriptionExpiry}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Assigned to</span><span className="drawer-stat-val">{owner ? owner.name : 'Unassigned'}</span></div>

      <div className="drawer-section">Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!fwLatest && (
          <button className="btn btn-ghost btn-block" onClick={() => showToast(`Firmware update queued for ${sensor.id}`)}>
            <svg><use href="#i-refresh" /></svg>Update firmware to v2.4.1
          </button>
        )}
        {canEdit && (
          <button className="btn btn-ghost btn-block" onClick={() => onEdit(sensor.id)}><svg><use href="#i-edit" /></svg>Edit sensor</button>
        )}
        {canReassign && (
          <button className="btn btn-ghost btn-block" onClick={() => onReassign(sensor.id)}><svg><use href="#i-link" /></svg>Reassign this sensor</button>
        )}
        {canRemove && (
          <button
            className="btn btn-ghost btn-block"
            style={{ color: 'var(--danger)' }}
            onClick={() => { removeSensor(sensor.id); showToast(`${sensor.id} removed`); onClose(); }}
          >
            <svg><use href="#i-trash" /></svg>Remove sensor
          </button>
        )}
        {!canEdit && !canRemove && !canReassign && (
          <div className="locked-banner"><svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>You have view-only access to this sensor.</div>
        )}
      </div>
    </>
  );
}
