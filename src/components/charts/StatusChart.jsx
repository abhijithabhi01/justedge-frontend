import React from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useChart } from '../../lib/useChart.js';

export default function StatusChart({ sensors: sensorsProp, title, subtitle } = {}) {
  const { sensors: allSensors } = useData();
  const sensors = sensorsProp ?? allSensors;
  const online = sensors.filter((r) => r.status === 'online').length;
  const offline = Math.max(0, sensors.length - online);
  const hasSensors = sensors.length > 0;

  const canvasRef = useChart(() => {
    if (!hasSensors) return null;
    return {
      type: 'doughnut',
      data: {
        labels: ['Online', 'Offline'],
        datasets: [
          {
            data: [online, offline],
            backgroundColor: ['#2c9a5c', '#d64a3f'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { padding: 10, cornerRadius: 8 },
        },
      },
    };
  }, [online, offline, hasSensors]);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{title || 'Fleet status'}</div>
          <div className="card-title-sub">
            {subtitle || (hasSensors ? 'Online vs offline right now' : 'No sensors registered')}
          </div>
        </div>
      </div>
      {hasSensors ? (
        <>
          <div className="chart-wrap" style={{ height: 200 }}>
            <canvas ref={canvasRef} />
          </div>
          <div style={{ marginTop: 6 }}>
            <div className="legend-row">
              <span>
                <span className="legend-dot" style={{ background: '#2c9a5c' }} />
                Online
              </span>
              <span className="num">{online}</span>
            </div>
            <div className="legend-row">
              <span>
                <span className="legend-dot" style={{ background: '#d64a3f' }} />
                Offline
              </span>
              <span className="num">{offline}</span>
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: '28px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No sensors have been added yet.
        </div>
      )}
    </div>
  );
}