import React, { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { chartBaseOptions, genSeries } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

const RANGES = ['24h', '7d', '30d'];

export default function FleetChart() {
  const { sensors } = useData();
  const [range, setRange] = useState('24h');

  const canvasRef = useChart((ctx) => {
    const avgBase = sensors.reduce((a, r) => a + r.base, 0) / sensors.length;
    const avgAmp = sensors.reduce((a, r) => a + r.amp, 0) / sensors.length;
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
          <div className="card-title">Fleet temperature trend</div>
          <div className="card-title-sub">Average across all registered sensors</div>
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
