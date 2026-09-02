import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SensorCard from '../components/SensorCard.jsx';
import Drawer from '../components/Drawer.jsx';
import SensorForm from '../components/SensorForm.jsx';
import SensorDetail from '../components/SensorDetail.jsx';
import { boardById, ownerName } from '../lib/helpers.js';
import { downloadCSV } from '../lib/csv.js';

export default function SensorsView({ onNavigate }) {
  const { sensors, boardCatalog, users } = useData();
  const showToast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawer, setDrawer] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = sensors.filter(r =>
      r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) ||
      (r.imei || '').includes(q) || ownerName(users, r).toLowerCase().includes(q) ||
      boardById(boardCatalog, r.boardId).name.toLowerCase().includes(q)
    );
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    return list;
  }, [sensors, boardCatalog, users, query, statusFilter]);

  const activeSensor = drawer && drawer.sensorId ? sensors.find(s => s.id === drawer.sensorId) : null;

  function exportCSV() {
    const headers = [
      'Sensor ID', 'Name', 'Site', 'Board', 'IMEI', 'Status', 'Last seen',
      'Battery (%)', 'Temp', 'Lat', 'Lng', 'Subscription', 'Expiry', 'Assigned To',
    ];
    const rows = filtered.map((r) => [
      r.id,
      r.name,
      r.site || r.tag || '',
      boardById(boardCatalog, r.boardId).name,
      r.imei || '',
      r.status,
      r.lastSeen || r.lastPing || '',
      r.battery ?? '',
      r.temp ?? '',
      r.lat ?? r.latitude ?? '',
      r.lng ?? r.longitude ?? '',
      r.subscriptionPlan || '',
      r.subscriptionExpiry || '',
      ownerName(users, r),
    ]);
    downloadCSV('justedge-sensors.csv', headers, rows);
    showToast('Fleet CSV downloaded', 'success');
  }

  const drawerTitle = drawer?.mode === 'add' ? 'Add sensor'
    : drawer?.mode === 'edit' ? 'Edit sensor'
    : activeSensor?.name;
  const drawerSub = drawer?.mode === 'add' ? 'Register a new board to the fleet'
    : drawer?.mode === 'edit' ? `${activeSensor?.id} · update sensor details`
    : activeSensor ? `${activeSensor.id} · ${boardById(boardCatalog, activeSensor.boardId).name}` : '';

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="filter-search">
          <svg><use href="#i-search" /></svg>
          <input type="text" placeholder="Search by ID, name, IMEI, or owner…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <select className="plain-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="online">Online only</option>
          <option value="offline">Offline only</option>
        </select>
        <button className="btn btn-ghost" onClick={exportCSV}><svg><use href="#i-download" /></svg>Export CSV</button>
        <button className="btn btn-amber" onClick={() => setDrawer({ mode: 'add' })}><svg><use href="#i-plus" /></svg>Add sensor</button>
      </div>

      <div className="section-header">
        <div>
          <div className="card-title">All registered sensors</div>
          <div className="card-title-sub">{filtered.length} sensor{filtered.length !== 1 ? 's' : ''} · every board type supported</div>
        </div>
      </div>

      {filtered.length ? (
        <div className="entity-grid">
          {filtered.map(s => (
            <SensorCard
              key={s.id}
              sensor={s}
              onView={(id) => setDrawer({ mode: 'view', sensorId: id })}
              onEdit={(id) => setDrawer({ mode: 'edit', sensorId: id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state"><svg><use href="#i-search" /></svg><p>No sensors match "{query}"</p></div>
      )}

      <Drawer open={!!drawer} title={drawerTitle} sub={drawerSub} onClose={() => setDrawer(null)}>
        {drawer?.mode === 'add' && <SensorForm onDone={() => setDrawer(null)} />}
        {drawer?.mode === 'edit' && activeSensor && <SensorForm sensor={activeSensor} onDone={() => setDrawer(null)} />}
        {drawer?.mode === 'view' && activeSensor && (
          <SensorDetail
            sensor={activeSensor}
            onEdit={(id) => setDrawer({ mode: 'edit', sensorId: id })}
            onReassign={(id) => { setDrawer(null); onNavigate('assign', id); }}
            onClose={() => setDrawer(null)}
          />
        )}
      </Drawer>
    </section>
  );
}