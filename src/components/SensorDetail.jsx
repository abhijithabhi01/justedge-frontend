import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, planById, userById, battColor } from '../lib/helpers.js';
import { chartBaseOptions, genSeries } from '../lib/chartUtils.js';
import { useChart } from '../lib/useChart.js';

function signalLabel(s) {
  return s >= -60 ? 'Excellent' : s >= -70 ? 'Good' : s >= -80 ? 'Fair' : 'Poor';
}

// Colors for the trend chart switcher — keyed on the sensor key.
const METRIC_COLORS = {
  temp:        '#dd7c3f',
  hum:         '#2b9490',
  battery:     '#8a5fd6',
  pressure:    '#3f7edd',
  light:       '#d4b44a',
  co2:         '#6dbf72',
  vibration:   '#c95b5b',
};

const RANGES = ['24h', '7d', '30d'];

// Build the list of trend-chart metrics from the sensor's live telemetry.
// This works for both simulated sensors (6 channels) and AWS sensors (however
// many channels the board actually reports), so the UI adapts automatically.
function metricsFrom(sensor) {
  const map = {
    temp_c:       { key: 'temp',      label: 'Temp',     dataKey: 'temp'     },
    humidity_pct: { key: 'hum',       label: 'Humidity', dataKey: 'hum'      },
    battery_pct:  { key: 'battery',   label: 'Battery',  dataKey: 'battery'  },
    pressure_hpa: { key: 'pressure',  label: 'Pressure', dataKey: 'pressure' },
    light_lux:    { key: 'light',     label: 'Light',    dataKey: 'light'    },
    co2_ppm:      { key: 'co2',       label: 'CO₂',      dataKey: 'co2'      },
    vibration_g:  { key: 'vibration', label: 'Vibr.',    dataKey: 'vibration'},
  };

  const seen = new Set();
  const result = [];

  for (const t of (sensor.telemetry || [])) {
    const m = map[t.key];
    if (m && !seen.has(m.key)) {
      seen.add(m.key);
      result.push(m);
    }
  }

  // Always include battery if present at top level but not in telemetry
  if (!seen.has('battery') && sensor.battery != null) {
    result.push({ key: 'battery', label: 'Battery', dataKey: 'battery' });
  }

  // Fallback: if no telemetry at all, show temp so the chart renders something
  if (result.length === 0) {
    result.push({ key: 'temp', label: 'Temp', dataKey: 'temp' });
  }

  return result;
}

// Unit label for the Y axis, keyed on the metric key used by the chart.
function yUnit(metricKey) {
  const map = {
    temp:      '°C',
    hum:       '%',
    battery:   '%',
    pressure:  'hPa',
    light:     'lux',
    co2:       'ppm',
    vibration: 'g',
  };
  return map[metricKey] || '';
}

export default function SensorDetail({ sensor, onEdit, onReassign, onClose, canEdit = true, canRemove = true, canReassign = true }) {
  const { boardCatalog, subscriptionPlans, users, removeSensor } = useData();
  const showToast = useToast();

  const metrics = metricsFrom(sensor);
  const [metric, setMetric] = useState(metrics[0]?.key || 'temp');
  const [range, setRange]   = useState('24h');

  const board    = boardById(boardCatalog, sensor.boardId);
  const plan     = planById(subscriptionPlans, sensor.subscriptionPlan);
  const owner    = userById(users, sensor.assignedUserId);
  const bc       = battColor(sensor.battery);
  const sigColor = sensor.signal < -75 ? 'var(--danger)' : sensor.signal < -65 ? 'var(--warn)' : 'var(--good)';
  const fwLatest = sensor.fw === 'v2.4.1';
  const isAws    = sensor.source === 'aws';

  const canvasRef = useChart((ctx) => {
    const currentMetric = metrics.find(m => m.key === metric) || metrics[0];
    if (!currentMetric) return null;

    const color = METRIC_COLORS[currentMetric.key] || '#888';
    // For AWS sensors base/amp come from normalizeSensor (temp value + 0.5 amp).
    // For simulated sensors they come from the server.
    const base = sensor[currentMetric.dataKey] ?? sensor.base ?? 20;
    const amp  = sensor.amp ?? 1;
    const { labels, data } = genSeries(base, amp, range);
    const displayData = currentMetric.key === 'battery'
      ? data.map(v => Math.max(0, Math.min(100, v)))
      : data;
    const unit = yUnit(currentMetric.key);
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    const opts = chartBaseOptions(unit);
    opts.scales.x.ticks.maxTicksLimit = 5;
    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: displayData,
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          fill: true,
          tension: 0.4,
        }],
      },
      options: opts,
    };
  }, [sensor.id, metric, range, sensor.base, sensor.amp]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function fmt(v, unit = '', decimals = 1) {
    if (v == null) return '—';
    return `${Number(v).toFixed(decimals)}${unit}`;
  }

  // Live readings: show every channel the board actually reports, in order.
  const liveRows = (sensor.telemetry || []).map(t => ({
    label: t.label,
    value: t.value != null ? `${t.value} ${t.unit}`.trim() : '—',
  }));

  // If nothing came from telemetry, fall back to the normalised top-level fields.
  const fallbackRows = liveRows.length === 0 ? [
    { label: 'Temperature', value: fmt(sensor.temp, ' °C') },
    { label: 'Humidity',    value: fmt(sensor.hum, ' %')   },
    { label: 'Battery',     value: fmt(sensor.battery, ' %', 0) },
  ] : [];

  const readingRows = liveRows.length > 0 ? liveRows : fallbackRows;

  return (
    <>
      {/* AWS source badge */}
      {isAws && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--blue-soft)',
            color: 'var(--blue)',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          <svg style={{ width: 13, height: 13 }}><use href="#i-wifi" /></svg>
          Live from AWS DynamoDB · {sensor.awsDeviceId}
        </div>
      )}

      {/* Live readings */}
      <div className="drawer-section">Live readings</div>
      {readingRows.map(r => (
        <div className="drawer-stat" key={r.label}>
          <span className="drawer-stat-label">{r.label}</span>
          <span className="drawer-stat-val">{r.value}</span>
        </div>
      ))}
      {/* Battery is always shown at top level even if not in telemetry array */}
      {sensor.battery != null && !liveRows.some(r => r.label === 'Battery') && (
        <div className="drawer-stat">
          <span className="drawer-stat-label">Battery</span>
          <span className="drawer-stat-val" style={{ color: bc }}>{fmt(sensor.battery, ' %', 0)}</span>
        </div>
      )}
      {/* Signal — only meaningful for simulated / cellular boards */}
      {!isAws && (
        <div className="drawer-stat">
          <span className="drawer-stat-label">Signal strength</span>
          <span className="drawer-stat-val" style={{ color: sigColor }}>
            {sensor.signal != null ? `${sensor.signal} dBm (${signalLabel(sensor.signal)})` : '—'}
          </span>
        </div>
      )}
      <div className="drawer-stat">
        <span className="drawer-stat-label">Status</span>
        <span
          className="drawer-stat-val"
          style={{ color: sensor.status === 'online' ? 'var(--good)' : sensor.status === 'offline' ? 'var(--danger)' : 'var(--text-sub)' }}
        >
          {sensor.status === 'online' ? 'Online' : sensor.status === 'offline' ? 'Offline' : 'Unknown'}
        </span>
      </div>

      {/* Trend chart */}
      <div
        className="drawer-section"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <span>Trend{isAws ? ' (simulated history)' : ''}</span>
        <div className="segmented" style={{ padding: 2 }}>
          {metrics.map(m => (
            <button
              key={m.key}
              className={metric === m.key ? 'active' : ''}
              style={{ padding: '4px 9px', fontSize: 11 }}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="segmented" style={{ marginBottom: 10 }}>
        {RANGES.map(r => (
          <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      {isAws && (
        <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 8, fontStyle: 'italic' }}>
          Historical sparkline is estimated — DynamoDB history queries not yet wired to this view.
        </div>
      )}
      <div className="chart-wrap" style={{ height: 180 }}><canvas ref={canvasRef}></canvas></div>

      {/* Board & connectivity */}
      <div className="drawer-section">Board &amp; connectivity</div>
      <div className="drawer-stat"><span className="drawer-stat-label">Board</span><span className="drawer-stat-val">{board.name} ({board.conn})</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">IMEI</span><span className="drawer-stat-val">{sensor.imei}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">MAC address</span><span className="drawer-stat-val">{sensor.mac || '—'}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">SIM</span><span className="drawer-stat-val">{sensor.simNo || '—'}</span></div>
      {isAws && (
        <div className="drawer-stat">
          <span className="drawer-stat-label">AWS Device ID</span>
          <span className="drawer-stat-val" style={{ fontFamily: 'monospace', fontSize: 12 }}>{sensor.awsDeviceId}</span>
        </div>
      )}
      <div className="drawer-stat">
        <span className="drawer-stat-label">Firmware</span>
        {isAws ? (
          <span className="drawer-stat-val" style={{ color: 'var(--text-sub)' }}>
            {sensor.fw || '—'}
          </span>
        ) : (
          <span className={`fw-badge ${fwLatest ? 'latest' : 'outdated'}`}>
            {sensor.fw}{fwLatest ? ' ✓' : ' ↑ update'}
          </span>
        )}
      </div>
      <div className="drawer-stat">
        <span className="drawer-stat-label">Last ping</span>
        <span className="drawer-stat-val">
          {sensor.lastPing ? new Date(sensor.lastPing).toLocaleString() : '—'}
        </span>
      </div>

      {/* Subscription & owner */}
      <div className="drawer-section">Subscription &amp; owner</div>
      <div className="drawer-stat"><span className="drawer-stat-label">Plan</span><span className="drawer-stat-val">{plan.name}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Expires</span><span className="drawer-stat-val">{sensor.subscriptionExpiry || '—'}</span></div>
      <div className="drawer-stat"><span className="drawer-stat-label">Assigned to</span><span className="drawer-stat-val">{owner ? owner.name : 'Unassigned'}</span></div>

      {/* Actions */}
      <div className="drawer-section">Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!fwLatest && !isAws && (
          <button className="btn btn-ghost btn-block" onClick={() => showToast(`Firmware update queued for ${sensor.id}`)}>
            <svg><use href="#i-refresh" /></svg>Update firmware to v2.4.1
          </button>
        )}
        {canEdit && (
          <button className="btn btn-ghost btn-block" onClick={() => onEdit(sensor.id)}>
            <svg><use href="#i-edit" /></svg>Edit sensor
          </button>
        )}
        {canReassign && (
          <button className="btn btn-ghost btn-block" onClick={() => onReassign(sensor.id)}>
            <svg><use href="#i-link" /></svg>Reassign this sensor
          </button>
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
          <div className="locked-banner">
            <svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
            You have view-only access to this sensor.
          </div>
        )}
      </div>
    </>
  );
}