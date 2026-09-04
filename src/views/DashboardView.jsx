import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import FleetChart from '../components/charts/FleetChart.jsx';
import StatusChart from '../components/charts/StatusChart.jsx';
import BatteryChart from '../components/charts/BatteryChart.jsx';
import BoardChart from '../components/charts/BoardChart.jsx';
import OwnerChart from '../components/charts/OwnerChart.jsx';
import FleetMap from '../components/FleetMap.jsx';
// ── Small inline helpers ────────────────────────────────────────────────────

function fmt(v, unit = '', decimals = 1) {
  if (v == null) return '—';
  return `${Number(v).toFixed(decimals)}${unit}`;
}

function statusDot(status) {
  const color =
    status === 'online'  ? 'var(--good)'    :
    status === 'offline' ? 'var(--danger)'  :
                           'var(--text-sub)';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        marginRight: 5,
        flexShrink: 0,
      }}
    />
  );
}

// A compact live-reading row for one AWS-linked sensor inside the admin panel.
function AwsSensorRow({ sensor }) {
  const temp     = sensor.temp     != null ? `${Number(sensor.temp).toFixed(1)} °C`     : null;
  const hum      = sensor.hum      != null ? `${Number(sensor.hum).toFixed(1)} %`        : null;
  const pressure = sensor.pressure != null ? `${Number(sensor.pressure).toFixed(1)} hPa` : null;
  const battery  = sensor.battery  != null ? `${Number(sensor.battery).toFixed(0)} %`    : null;
  const location =
    sensor.latitude != null && sensor.longitude != null
      ? `${Number(sensor.latitude).toFixed(5)}, ${Number(sensor.longitude).toFixed(5)}`
      : null;

  const hasAnyReading = temp || hum || pressure || battery || location;

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
          {statusDot(sensor.status)}
          <span>{sensor.name}</span>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--blue)',
            background: 'var(--blue-soft)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
        >
          AWS · {sensor.awsDeviceId}
        </span>
      </div>

      {/* Readings grid */}
      {hasAnyReading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '4px 12px',
            marginTop: 2,
          }}
        >
          {temp && (
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              🌡 <strong style={{ color: 'var(--text)' }}>{temp}</strong> Temp
            </div>
          )}
          {hum && (
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              💧 <strong style={{ color: 'var(--text)' }}>{hum}</strong> Humidity
            </div>
          )}
          {pressure && (
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              🔵 <strong style={{ color: 'var(--text)' }}>{pressure}</strong> Pressure
            </div>
          )}
          {battery && (
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              🔋 <strong style={{ color: 'var(--text)' }}>{battery}</strong> Battery
            </div>
          )}
          {location && (
            <div style={{ fontSize: 12, color: 'var(--text-sub)', gridColumn: '1 / -1' }}>
              📍{' '}
              <strong style={{ color: 'var(--text)', fontFamily: 'ui-monospace, monospace' }}>
                {location}
              </strong>{' '}
              Location
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-sub)', fontStyle: 'italic' }}>
          No telemetry received yet — waiting for first AWS ping…
        </div>
      )}

      {/* Last ping */}
      {sensor.lastPing && (
        <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>
          Last ping: {new Date(sensor.lastPing).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ── Main view ───────────────────────────────────────────────────────────────

export default function DashboardView() {
  const { sensors, adminAccounts, subscriptions, subscriptionPlans } = useData();
  const { isSuperadmin } = useAuth();

  const total   = sensors.length;
  const online  = sensors.filter(r => r.status === 'online').length;
  const avgTemp = total
    ? (sensors.reduce((a, r) => a + (r.temp ?? 0), 0) / total).toFixed(1)
    : '0.0';
  const lowBattery = sensors.filter(r => r.battery != null && r.battery < 20).length;
  const onlinePct  = total ? Math.round((online / total) * 100) : 0;

  const planPrice = new Map(
    subscriptionPlans.map((plan) => [
      plan.id,
      Number(String(plan.price || '').replace(/[^0-9.]/g, '')) || 0,
    ])
  );
  const monthlyRevenue = subscriptions.reduce(
    (sum, subscription) => sum + (planPrice.get(subscription.plan) || 0),
    0
  );

  // AWS-linked sensors visible to this admin session
  const awsSensors = sensors.filter(s => s.awsDeviceId);

  // GPS boards with live coordinates (admin fleet map)
  const gpsSensors = sensors.filter(
    (s) =>
      s.latitude != null &&
      s.longitude != null &&
      Number.isFinite(Number(s.latitude)) &&
      Number.isFinite(Number(s.longitude))
  );
  const adminKpis = [
    {
      label: 'Total sensors',
      value: total,
      icon: 'i-thermo',
      color: 'var(--purple)',
      soft: 'var(--purple-soft)',
      delta: `${sensors.filter(s => s.status !== 'offline').length} active`,
      trend: 'up',
    },
    {
      label: 'Online now',
      value: `${online}/${total}`,
      icon: 'i-wifi',
      color: 'var(--good)',
      soft: 'var(--good-soft)',
      delta: `${onlinePct}% uptime`,
      trend: onlinePct >= 70 ? 'up' : 'down',
    },
    {
      label: 'Fleet avg temp',
      value: `${avgTemp}°C`,
      icon: 'i-chart',
      color: 'var(--blue)',
      soft: 'var(--blue-soft)',
      delta: 'across all boards',
      trend: 'flat',
    },
    {
      label: 'Low battery',
      value: lowBattery,
      icon: 'i-battery',
      color: lowBattery > 0 ? 'var(--danger)' : 'var(--good)',
      soft: lowBattery > 0 ? 'var(--danger-soft)' : 'var(--good-soft)',
      delta: lowBattery > 0 ? 'needs attention' : 'all healthy',
      trend: lowBattery > 0 ? 'down' : 'up',
    },
  ];

  const superadminKpis = [
    {
      label: 'Admin companies',
      value: adminAccounts.filter((admin) => admin.role === 'Admin').length,
      icon: 'i-users',
      color: 'var(--purple)',
      soft: 'var(--purple-soft)',
      delta: 'active platform accounts',
      trend: 'up',
    },
    {
      label: 'Boards registered',
      value: total,
      icon: 'i-cpu',
      color: 'var(--blue)',
      soft: 'var(--blue-soft)',
      delta: `${online}/${total} online`,
      trend: onlinePct >= 70 ? 'up' : 'down',
    },
    {
      label: 'Active subscriptions',
      value: subscriptions.length,
      icon: 'i-receipt',
      color: 'var(--good)',
      soft: 'var(--good-soft)',
      delta: 'licensed board plans',
      trend: 'up',
    },
    {
      label: 'Monthly licensing',
      value: `$${monthlyRevenue}`,
      icon: 'i-chart',
      color: 'var(--warn)',
      soft: 'var(--warn-soft)',
      delta: 'from priced plans',
      trend: 'flat',
    },
  ];

  const kpis = isSuperadmin ? superadminKpis : adminKpis;

  const mapMarkers = gpsSensors.map((s) => ({
    id: s.id,
    lat: s.latitude ?? s.lat,
    lng: s.longitude ?? s.lng,
    label: s.name || s.id,
    status: s.status,
  }));

  return (
    <section className="view active">
      {total === 0 && (
        <div
          className="card section-gap"
          style={{
            padding: '28px 24px',
            textAlign: 'center',
            borderStyle: 'dashed',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
              color: 'var(--text-main)',
            }}
          >
            No sensors have been added yet
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 420, margin: '0 auto' }}>
            Register a board under <strong>Sensors → Add sensor</strong>.
           
          </div>
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-4 section-gap">
        {kpis.map(k => (
          <div className="card" key={k.label}>
            <div className="kpi-top">
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}</div>
              </div>
              <div className="kpi-icon" style={{ background: k.soft, color: k.color }}>
                <svg><use href={`#${k.icon}`} /></svg>
              </div>
            </div>
            <div className={`kpi-delta${k.trend === 'up' ? ' up' : k.trend === 'down' ? ' down' : ''}`}>
              {k.trend !== 'flat' && (
                <svg>
                  <use
                    href="#i-trend-up"
                    style={k.trend === 'down' ? { transform: 'scaleY(-1)' } : undefined}
                  />
                </svg>
              )}
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      {/* ── Live fleet map: all devices with coordinates + names ───── */}
      <FleetMap
        title="Live location"
        height={360}
        markers={mapMarkers}
      />

      {/* ── Live AWS sensor readings (admin only, non-superadmin) ──────── */}
      {!isSuperadmin && awsSensors.length > 0 && (
        <div className="card section-gap">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div>
              <div className="card-title">Live AWS Sensor Readings</div>
              <div className="card-title-sub">
                {awsSensors.length} board{awsSensors.length !== 1 ? 's' : ''} streaming from DynamoDB · refreshes every 5 s
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--blue)',
                background: 'var(--blue-soft)',
                borderRadius: 6,
                padding: '4px 10px',
              }}
            >
              SENSOR_DATA_SOURCE=aws
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {awsSensors.map(s => (
              <AwsSensorRow key={s.id} sensor={s} />
            ))}
          </div>
        </div>
      )}

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <FleetChart />

      <div className="grid grid-2 section-gap">
        <StatusChart />
        <BatteryChart />
      </div>

      <div className="grid grid-2">
        <BoardChart />
        <OwnerChart />
      </div>
    </section>
  );
}