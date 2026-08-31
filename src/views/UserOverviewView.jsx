import React from 'react';
import FleetChart from '../components/charts/FleetChart.jsx';
import StatusChart from '../components/charts/StatusChart.jsx';
import BatteryChart from '../components/charts/BatteryChart.jsx';
import GpsMap from '../components/GpsMap.jsx';

export default function UserOverviewView({ user, mySensors, myAlerts, onNavigate }) {
  const online = mySensors.filter(s => s.status === 'online').length;
  const temps = mySensors
    .map(r => (r.temp != null && Number.isFinite(Number(r.temp)) ? Number(r.temp) : null))
    .filter(t => t != null);
  const avgTemp = temps.length
    ? (temps.reduce((a, t) => a + t, 0) / temps.length).toFixed(1)
    : '—';
  // null battery must not count as "below 20%" (null < 20 is true in JS)
  const lowBattery = mySensors.filter(
    r => r.battery != null && Number.isFinite(Number(r.battery)) && Number(r.battery) < 20
  ).length;
  const openAlerts = myAlerts.filter(a => !a.resolved).length;
  // Prefer a GPS board with live coords for the overview map
  const gpsSensor =
    mySensors.find(
      (s) =>
        s.latitude != null &&
        s.longitude != null &&
        Number.isFinite(Number(s.latitude)) &&
        Number.isFinite(Number(s.longitude))
    ) ||
    mySensors.find((s) => s.boardId === 'gps-board') ||
    null;

  const kpis = [
    { label: 'My sensors', value: mySensors.length, icon: 'i-thermo', color: 'var(--purple)', soft: 'var(--purple-soft)' },
    { label: 'Online now', value: `${online}/${mySensors.length}`, icon: 'i-wifi', color: 'var(--good)', soft: 'var(--good-soft)' },
    { label: 'Avg temperature', value: avgTemp === '—' ? '—' : `${avgTemp}°C`, icon: 'i-chart', color: 'var(--blue)', soft: 'var(--blue-soft)' },
    { label: 'Open alerts', value: openAlerts, icon: 'i-battery', color: openAlerts > 0 ? 'var(--danger)' : 'var(--good)', soft: openAlerts > 0 ? 'var(--danger-soft)' : 'var(--good-soft)' },
  ];

  return (
    <section className="view active">
      <div className="grid grid-4 section-gap">
        {kpis.map(k => (
          <div className="card" key={k.label}>
            <div className="kpi-top">
              <div><div className="kpi-label">{k.label}</div><div className="kpi-value">{k.value}</div></div>
              <div className="kpi-icon" style={{ background: k.soft, color: k.color }}>
                <svg><use href={`#${k.icon}`} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {lowBattery > 0 && (
        <div className="locked-banner section-gap" style={{ borderColor: 'var(--warn)', color: 'var(--warn)', background: 'var(--warn-soft)' }}>
          <svg style={{ width: 14, height: 14 }}><use href="#i-battery" /></svg>
          {lowBattery} sensor{lowBattery !== 1 ? 's' : ''} below 20% battery — check My Sensors.
        </div>
      )}

      {/* Live GPS map when user has a tracker with coordinates */}
      {gpsSensor && (
        <GpsMap
          latitude={gpsSensor.latitude}
          longitude={gpsSensor.longitude}
          label={gpsSensor.name || 'Your GPS board'}
          height={300}
        />
      )}

      {/* Charts scoped to this user's sensors */}
      {mySensors.length > 0 && (
        <>
          <FleetChart
            sensors={mySensors}
            title="Your temperature trend"
            subtitle="Based on your assigned sensors"
          />
          <div className="grid grid-2 section-gap">
            <StatusChart
              sensors={mySensors}
              title="Your sensors status"
              subtitle="Online vs offline right now"
            />
            <BatteryChart
              sensors={mySensors}
              title="Your battery levels"
              subtitle="Sensors that report battery %"
            />
          </div>
        </>
      )}

      <div className="section-header">
        <div><div className="card-title">Your sensors</div><div className="card-title-sub">Quick glance — open My Sensors for full detail</div></div>
      </div>
      {mySensors.length ? (
        <div className="entity-grid">
          {mySensors.slice(0, 6).map(s => (
            <div className="entity-card" key={s.id} onClick={() => onNavigate('sensors')}>
              <div className="entity-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div className="entity-avatar sensor"><svg style={{ width: 18, height: 18 }}><use href="#i-cpu" /></svg></div>
                  <div style={{ minWidth: 0 }}>
                    <div className="entity-card-name">{s.name}</div>
                    <div className="entity-card-sub">{s.id}</div>
                  </div>
                </div>
                {s.status === 'online'
                  ? <span className="pill pill-good"><svg style={{ width: 9, height: 9 }}><use href="#i-check" /></svg>Online</span>
                  : <span className="pill pill-bad">Offline</span>}
              </div>
              <div className="entity-card-body">
                <div className="entity-meta-row">
                  <span className="k">Temp</span>
                  <span className="v">{s.temp != null ? `${Number(s.temp).toFixed(2)}°C` : '—'}</span>
                </div>
                <div className="entity-meta-row">
                  <span className="k">Battery</span>
                  <span className="v">{s.battery != null ? `${Number(s.battery).toFixed(0)}%` : '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><svg><use href="#i-search" /></svg><p>No sensors are assigned to you yet. Ask your admin to assign one.</p></div>
      )}
    </section>
  );
}