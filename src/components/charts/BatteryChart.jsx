import React from 'react';
import { useData } from '../../context/DataContext.jsx';
import { chartBaseOptions, gridColor, tickColor } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

export default function BatteryChart({ sensors: sensorsProp, title, subtitle } = {}) {
  const { sensors: allSensors } = useData();
  const sensors = sensorsProp ?? allSensors;
  const withBatt = sensors
    .map((r) => ({
      ...r,
      battery: r.battery != null && Number.isFinite(Number(r.battery)) ? Number(r.battery) : null,
    }))
    .filter((r) => r.battery != null)
    .sort((a, b) => a.battery - b.battery);

  const hasData = withBatt.length > 0;

  const canvasRef = useChart(() => {
    if (!hasData) return null;
    return {
      type: 'bar',
      data: {
        labels: withBatt.map((r) => r.name || String(r.id).slice(0, 8)),
        datasets: [
          {
            data: withBatt.map((r) => r.battery),
            backgroundColor: withBatt.map((r) =>
              r.battery < 20 ? '#d64a3f' : r.battery < 50 ? '#c98a1f' : '#2c9a5c'
            ),
            borderRadius: 5,
            maxBarThickness: 22,
          },
        ],
      },
      options: {
        ...chartBaseOptions('%'),
        indexAxis: 'y',
        scales: {
          x: {
            grid: { color: gridColor() },
            ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 10 } },
            max: 100,
            min: 0,
          },
          y: {
            grid: { display: false },
            ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 10 } },
          },
        },
      },
    };
  }, [withBatt, hasData]);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{title || 'Battery levels'}</div>
          <div className="card-title-sub">
            {subtitle ||
              (hasData ? 'Lowest boards first' : 'No battery readings yet')}
          </div>
        </div>
      </div>
      {hasData ? (
        <div className="chart-wrap" style={{ height: 200 }}>
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div
          style={{
            padding: '28px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          {sensors.length === 0
            ? 'No sensors have been added yet.'
            : 'No battery readings from your boards yet.'}
        </div>
      )}
    </div>
  );
}