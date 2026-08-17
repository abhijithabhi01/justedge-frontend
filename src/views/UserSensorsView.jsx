import React, { useState } from 'react';
import SensorCard from '../components/SensorCard.jsx';
import Drawer from '../components/Drawer.jsx';
import SensorForm from '../components/SensorForm.jsx';
import SensorDetail from '../components/SensorDetail.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { downloadCSV } from '../lib/csv.js';

export default function UserSensorsView({ user, mySensors }) {
  const [drawer, setDrawer] = useState(null); // { mode: 'add'|'edit'|'view', sensorId }
  const showToast = useToast();
  const perms = user?.permissions || {};
  const activeSensor = drawer && drawer.sensorId ? mySensors.find(s => s.id === drawer.sensorId) : null;

  const drawerTitle = drawer?.mode === 'add' ? 'Add sensor'
    : drawer?.mode === 'edit' ? 'Edit sensor'
    : activeSensor?.name;
  const drawerSub = drawer?.mode === 'add' ? 'Register a new board to your account'
    : drawer?.mode === 'edit' ? `${activeSensor?.id} · update sensor details`
    : activeSensor?.id;

  function exportCSV() {
    const headers = ['Sensor ID', 'Name', 'Battery (%)', 'Signal (dBm)', 'Firmware', 'Status'];
    const rows = mySensors.map(r => [r.id, r.name, r.battery, r.signal, r.fw, r.status]);
    downloadCSV('my-sensors.csv', headers, rows);
    showToast('CSV downloaded');
  }

  return (
    <section className="view active">
      <div className="filter-row">
        <div>
          <div className="card-title">Sensors assigned to you</div>
          <div className="card-title-sub">{mySensors.length} sensor{mySensors.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ flex: 1 }}></div>
        {perms.exportData && (
          <button className="btn btn-ghost" onClick={exportCSV}><svg><use href="#i-download" /></svg>Export CSV</button>
        )}
        {perms.addSensor && (
          <button className="btn btn-amber" onClick={() => setDrawer({ mode: 'add' })}><svg><use href="#i-plus" /></svg>Add sensor</button>
        )}
      </div>

      {!perms.addSensor && (
        <div className="locked-banner section-gap">
          <svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
          You have monitor-only access. Ask your admin to grant "Add sensors" to register new boards yourself.
        </div>
      )}

      {mySensors.length ? (
        <div className="entity-grid">
          {mySensors.map(s => (
            <SensorCard
              key={s.id}
              sensor={s}
              canEdit={!!perms.editSensor}
              canRemove={!!perms.removeSensor}
              onView={(id) => setDrawer({ mode: 'view', sensorId: id })}
              onEdit={(id) => setDrawer({ mode: 'edit', sensorId: id })}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state"><svg><use href="#i-search" /></svg><p>No sensors are assigned to you yet.</p></div>
      )}

      <Drawer open={!!drawer} title={drawerTitle} sub={drawerSub} onClose={() => setDrawer(null)}>
        {drawer?.mode === 'add' && perms.addSensor && (
          <SensorForm onDone={() => setDrawer(null)} lockedUserId={user?.id} />
        )}
        {drawer?.mode === 'edit' && activeSensor && perms.editSensor && (
          <SensorForm sensor={activeSensor} onDone={() => setDrawer(null)} />
        )}
        {drawer?.mode === 'view' && activeSensor && (
          <SensorDetail
            sensor={activeSensor}
            canEdit={!!perms.editSensor}
            canRemove={!!perms.removeSensor}
            canReassign={false}
            onEdit={(id) => setDrawer({ mode: 'edit', sensorId: id })}
            onReassign={() => {}}
            onClose={() => setDrawer(null)}
          />
        )}
      </Drawer>
    </section>
  );
}
