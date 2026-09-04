import React, { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { chartBaseOptions, genSeries } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

const RANGES = ['24h', '7d', '30d'];

/**
 * Pass `sensors` to scope the chart (e.g. a user's fleet). Defaults to all.
 * Shows an empty state when there are no temperature readings — no synthetic curve.
 */
export default function FleetChart({ sensors: sensorsProp, title, subtitle } = {}) {
  const { sensors: allSensors } = useData();
  const sensors = sensorsProp ?? allSensors;
  const [range, setRange] = useState('24h');

  const temps = sensors
    .map((r) => {
      const t = r.temp ?? r.base;
      return t != null && Number.isFinite(Number(t)) ? Number(t) : null;
    })
    .filter((t) => t != null);

  const hasTempData = temps.length > 0;

  const canvasRef = useChart(
    (ctx) => {
      if (!hasTempData) return null;

      const avgBase = temps.reduce((a, t) => a + t, 0) / temps.length;
      const amps = sensors
        .map((r) => (r.amp != null && Number.isFinite(Number(r.amp)) ? Number(r.amp) : null))
        .filter((a) => a != null);
      const avgAmp = amps.length ? amps.reduce((a, v) => a + v, 0) / amps.length : 0.5;

      const { labels, data } = genSeries(avgBase, avgAmp, range);
      const gradient = ctx.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(221,124,63,.28)');
      gradient.addColorStop(1, 'rgba(221,124,63,0)');
      return {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              data,
              borderColor: '#dd7c3f',
              backgroundColor: gradient,
              borderWidth: 2.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#dd7c3f',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: chartBaseOptions('°C'),
      };
    },
    [sensors, range, hasTempData, temps]
  );

  return (
    <div className="card section-gap">
      <div className="card-head" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="card-title">{title || 'Fleet temperature trend'}</div>
          <div className="card-title-sub">
            {subtitle ||
              (hasTempData
                ? 'Average across registered sensors with temperature'
                : 'No temperature boards yet')}
          </div>
        </div>
        {hasTempData && (
          <div className="segmented">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                className={range === r ? 'active' : ''}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
      {hasTempData ? (
        <div className="chart-wrap">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <div
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13.5,
            lineHeight: 1.55,
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
            No temperature data yet
          </div>
          Add a sensor with live temperature (or link an AWS board that reports temp) to see the
          fleet trend here.
        </div>
      )}
    </div>
  );
}