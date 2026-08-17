import React from 'react';
import { useData } from '../../context/DataContext.jsx';
import { chartBaseOptions, gridColor, tickColor } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

export default function BatteryChart() {
  const { sensors } = useData();
  const sorted = [...sensors].sort((a, b) => a.battery - b.battery);

  const canvasRef = useChart(() => ({
    type: 'bar',
    data: {
      labels: sorted.map(r => r.id),
      datasets: [{
        data: sorted.map(r => r.battery),
        backgroundColor: sorted.map(r => (r.battery < 20 ? '#d64a3f' : r.battery < 50 ? '#c98a1f' : '#2c9a5c')),
        borderRadius: 5, maxBarThickness: 22,
      }],
    },
    options: {
      ...chartBaseOptions('%'),
      indexAxis: 'y',
      scales: {
        x: { grid: { color: gridColor() }, ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 10 } }, max: 100 },
        y: { grid: { display: false }, ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 10 } } },
      },
    },
  }), [sensors]);

  return (
    <div className="card">
      <div className="card-head"><div><div className="card-title">Battery levels</div><div className="card-title-sub">By sensor, lowest first</div></div></div>
      <div className="chart-wrap" style={{ height: 200 }}><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}
