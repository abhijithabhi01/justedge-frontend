import React from 'react';
import { useData } from '../../context/DataContext.jsx';
import { chartBaseOptions, gridColor, tickColor } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

export default function BoardChart() {
  const { sensors, boardCatalog } = useData();
  const counts = boardCatalog.map(b => sensors.filter(s => s.boardId === b.id).length);

  const canvasRef = useChart(() => ({
    type: 'bar',
    data: { labels: boardCatalog.map(b => b.name), datasets: [{ data: counts, backgroundColor: '#2b9490', borderRadius: 6, maxBarThickness: 36 }] },
    options: {
      ...chartBaseOptions(' boards'),
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 10 } } },
        y: { grid: { color: gridColor() }, ticks: { color: tickColor(), font: { family: 'JetBrains Mono', size: 11 }, precision: 0 } },
      },
    },
  }), [sensors, boardCatalog]);

  if (!sensors.length) {
    return (
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Boards by type</div>
            <div className="card-title-sub">No sensors registered</div>
          </div>
        </div>
        <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No sensors have been added yet.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head"><div><div className="card-title">Boards by type</div><div className="card-title-sub">Fleet mix across board hardware</div></div></div>
      <div className="chart-wrap" style={{ height: 200 }}><canvas ref={canvasRef}></canvas></div>
    </div>
  );
}