import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';

const DEFAULT_OFFLINE_HOURS = 24;

function hoursSince(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 3600000;
}

export default function FleetHealthView() {
  const { sensors } = useData();
  const [offlineHours, setOfflineHours] = useState(DEFAULT_OFFLINE_HOURS);

  const stats = useMemo(() => {
    const list = sensors || [];
    const total = list.length;

    const neverConnected = list.filter((s) => {
      const noSeen = !s.lastSeen && !s.lastPing;
      return s.status !== 'online' && noSeen;
    });

    const online = list.filter((s) => s.status === 'online').length;
    const uptimePct = total ? Math.round((online / total) * 100) : 0;

    const lowBattery = list.filter(
      (s) => s.battery != null && Number(s.battery) < 20
    );

    const offlineLong = list.filter((s) => {
      if (s.status === 'online') return false;
      const h = hoursSince(s.lastSeen || s.lastPing);
      if (h == null) return s.status === 'offline';
      return h >= offlineHours;
    });

    const fwMap = {};
    list.forEach((s) => {
      const fw = s.fw || s.firmware || 'Unknown';
      fwMap[fw] = (fwMap[fw] || 0) + 1;
    });
    const firmware = Object.entries(fwMap)
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);

    return { total, online, uptimePct, neverConnected, lowBattery, offlineLong, firmware };
  }, [sensors, offlineHours]);

  const kpis = [
    { label: 'Never connected', value: stats.neverConnected.length, sub: 'Registered, no telemetry yet', color: stats.neverConnected.length ? 'var(--warn)' : 'var(--good)', soft: stats.neverConnected.length ? 'var(--warn-soft)' : 'var(--good-soft)' },
    { label: 'Avg uptime', value: `${stats.uptimePct}%`, sub: `${stats.online}/${stats.total} online now`, color: stats.uptimePct >= 70 ? 'var(--good)' : 'var(--danger)', soft: stats.uptimePct >= 70 ? 'var(--good-soft)' : 'var(--danger-soft)' },
    { label: 'Low battery', value: stats.lowBattery.length, sub: 'Below 20%', color: stats.lowBattery.length ? 'var(--danger)' : 'var(--good)', soft: stats.lowBattery.length ? 'var(--danger-soft)' : 'var(--good-soft)' },
    { label: `Offline > ${offlineHours}h`, value: stats.offlineLong.length, sub: 'Beyond threshold', color: stats.offlineLong.length ? 'var(--danger)' : 'var(--good)', soft: stats.offlineLong.length ? 'var(--danger-soft)' : 'var(--good-soft)' },
  ];

  return (
    <section className="view active">
      <div className="section-header">
        <div>
          <div className="card-title">Fleet &amp; Device Health</div>
          <div className="card-title-sub">Connectivity, battery, firmware, and long-offline boards</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          Offline threshold (hours)
          <input
            className="input"
            type="number"
            min={1}
            max={720}
            value={offlineHours}
            onChange={(e) => setOfflineHours(Math.max(1, Number(e.target.value) || 24))}
            style={{ width: 88 }}
          />
        </label>
      </div>

      <div className="grid grid-4 section-gap">
        {kpis.map((k) => (
          <div className="card" key={k.label}>
            <div className="kpi-top">
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}</div>
              </div>
              <div className="kpi-icon" style={{ background: k.soft, color: k.color }}>
                <svg><use href="#i-wifi" /></svg>
              </div>
            </div>
            <div className="kpi-delta" style={{ opacity: 0.85 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2 section-gap">
        <div className="card">
          <div className="card-title">Firmware version distribution</div>
          <div className="card-title-sub">Across registered boards</div>
          {stats.firmware.length ? (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.firmware.map((row) => {
                const pct = stats.total ? Math.round((row.count / stats.total) * 100) : 0;
                return (
                  <div key={row.version} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>{row.version}</span>
                    <span>{row.count} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="hint" style={{ marginTop: 12 }}>No boards yet.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">Never connected</div>
          <div className="card-title-sub">No last-seen / last-ping</div>
          {stats.neverConnected.length ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
              {stats.neverConnected.slice(0, 12).map((s) => (
                <li key={s.id}>
                  <strong>{s.name || s.id}</strong>
                  <span className="mono-faint"> · {s.id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint" style={{ marginTop: 12 }}>All boards have reported at least once.</p>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Low battery (&lt; 20%)</div>
          {stats.lowBattery.length ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
              {stats.lowBattery.map((s) => (
                <li key={s.id}>
                  <strong>{s.name || s.id}</strong> — {Number(s.battery).toFixed(0)}%
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint" style={{ marginTop: 12 }}>No low-battery boards.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">Offline beyond threshold</div>
          <div className="card-title-sub">Older than {offlineHours}h or offline with no report</div>
          {stats.offlineLong.length ? (
            <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
              {stats.offlineLong.slice(0, 12).map((s) => (
                <li key={s.id}>
                  <strong>{s.name || s.id}</strong>
                  <span className="mono-faint"> · {s.lastSeen || s.lastPing || 'no report'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint" style={{ marginTop: 12 }}>No boards past the offline threshold.</p>
          )}
        </div>
      </div>
    </section>
  );
}