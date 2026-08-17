import React from 'react';
import { useData } from '../../context/DataContext.jsx';
import { ownerName } from '../../lib/helpers.js';
import { tickColor } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

export default function OwnerChart() {
  const { sensors, users } = useData();
  const names = [...new Set(sensors.map(s => ownerName(users, s)))];
  const counts = names.map(n => sensors.filter(s => ownerName(users, s) === n).length);

  const canvasRef = useChart(() => ({
    type: 'doughnut',
    data: { labels: names, datasets: [{ data: counts, backgroundColor: ['#dd7c3f', '#2b9490', '#8a5fd6', '#c98a1f', '#4c8bd6', '#9aa3b2'], borderWidth: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '55%',
      plugins: { legend: { position: 'right', labels: { boxWidth: 9, boxHeight: 9, font: { family: 'Manrope', size: 11 }, color: tickColorSafe() } }, tooltip: { padding: 10, cornerRadius: 8 } },
    },
  }), [sensors, users]);

  function tickColorSafe() {
    try { return tickColor(); } catch { return '#9aa3b2'; }
  }

  return (
    <div className="card">
      <div className="card-head"><div><div className="card-title">Sensors by user</div><div className="card-title-sub">Fleet distribution across assigned users</div></div></div>
      <div className="chart-wrap" style={{ height: 200 }}><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}
