import React, { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { chartBaseOptions, genSeries } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

const RANGES = ['24h', '7d', '30d'];

/**
 * Pass `sensors` to scope the chart (e.g. a user's fleet). Defaults to all.
 */
export default function FleetChart({ sensors: sensorsProp, title, subtitle } = {}) {
  const { sensors: allSensors } = useData();
  const sensors = sensorsProp ?? allSensors;
  const [range, setRange] = useState('24h');

  const canvasRef = useChart((ctx) => {
    const temps = sensors
      .map((r) => {
        const t = r.temp ?? r.base;
        return t != null && Number.isFinite(Number(t)) ? Number(t) : null;
      })
      .filter((t) => t != null);
    const avgBase = temps.length
      ? temps.reduce((a, t) => a + t, 0) / temps.length
      : 22;
    const amps = sensors
      .map((r) => (r.amp != null && Number.isFinite(Number(r.amp)) ? Number(r.amp) : null))
      .filter((a) => a != null);
    const avgAmp = amps.length
      ? amps.reduce((a, v) => a + v, 0) / amps.length
      : 0.8;

    const { labels, data } = genSeries(avgBase, avgAmp, range);
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(221,124,63,.28)');
    gradient.addColorStop(1, 'rgba(221,124,63,0)');
    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data, borderColor: '#dd7c3f', backgroundColor: gradient, borderWidth: 2.4,
          pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#dd7c3f',
          pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, fill: true, tension: 0.4,
        }],
      },
      options: chartBaseOptions('°C'),
    };
  }, [sensors, range]);

  return (
    <div className="card section-gap">
      <div className="card-head" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="card-title">{title || 'Fleet temperature trend'}</div>
          <div className="card-title-sub">
            {subtitle || 'Average across all registered sensors'}
          </div>
        </div>
        <div className="segmented">
          {RANGES.map(r => (
            <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
      </div>
      <div className="chart-wrap"><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}