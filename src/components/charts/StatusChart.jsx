import React from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useChart } from '../../lib/useChart.js';

export default function StatusChart() {
  const { sensors } = useData();
  const online = sensors.filter(r => r.status === 'online').length;
  const offline = sensors.length - online;

  const canvasRef = useChart(() => ({
    type: 'doughnut',
    data: { labels: ['Online', 'Offline'], datasets: [{ data: [online, offline], backgroundColor: ['#2c9a5c', '#d64a3f'], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: { padding: 10, cornerRadius: 8 } } },
  }), [online, offline]);

  return (
    <div className="card">
      <div className="card-head"><div><div className="card-title">Fleet status</div><div className="card-title-sub">Online vs offline right now</div></div></div>
      <div className="chart-wrap" style={{ height: 200 }}><canvas ref={canvasRef}></canvas></div>
      <div style={{ marginTop: 6 }}>
        <div className="legend-row"><span><span className="legend-dot" style={{ background: '#2c9a5c' }}></span>Online</span><span className="num">{online}</span></div>
        <div className="legend-row"><span><span className="legend-dot" style={{ background: '#d64a3f' }}></span>Offline</span><span className="num">{offline}</span></div>
      </div>
    </div>
  );
}
