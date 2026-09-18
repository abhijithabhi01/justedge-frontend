import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import Drawer from '../components/Drawer.jsx';

const METRICS = [
  { id: 'battery', label: 'Battery %' },
  { id: 'temperature', label: 'Temperature °C' },
  { id: 'humidity', label: 'Humidity %' },
  { id: 'offline', label: 'Device offline' },
  { id: 'journey_started', label: 'Journey started (left origin)' },
  { id: 'journey_arrived', label: 'Reached destination' },
  { id: 'journey_returned', label: 'Returned to origin' },
];

const EVENT_METRICS = new Set(['offline', 'journey_started', 'journey_arrived', 'journey_returned']);

const OPERATORS = [
  { id: '<', label: 'less than' },
  { id: '<=', label: 'at most' },
  { id: '>', label: 'greater than' },
  { id: '>=', label: 'at least' },
];

function formatLastRun(lastRun) {
  if (!lastRun) return 'never';
  try {
    const d = new Date(lastRun);
    if (Number.isNaN(d.getTime())) return String(lastRun);
    return d.toLocaleString();
  } catch {
    return String(lastRun);
  }
}

/**
 * @param {{ user?: object, myAutomations: array, isAdmin?: boolean }} props
 * isAdmin: admin console — can pick any fleet sensor, sees all automations passed in
 */
export default function UserAutomationsView({
  user,
  myAutomations,
  isAdmin = false,
}) {
  const {
    toggleAutomation,
    removeAutomation,
    addAutomation,
    updateAutomation,
    sensors,
  } = useData();
  const showToast = useToast();
  const confirm = useConfirm();
  const canManage = isAdmin || !!user?.permissions?.automations;

  const sensorOptions = useMemo(() => {
    if (isAdmin) return sensors || [];
    const uid = String(user?.id || user?._id || '');
    return (sensors || []).filter((s) => String(s.assignedUserId) === uid);
  }, [isAdmin, sensors, user]);

  const sensorName = (id) => {
    const s = (sensors || []).find((x) => String(x.id) === String(id));
    return s?.name || id || '—';
  };

  const [drawer, setDrawer] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [metric, setMetric] = useState('battery');
  const [operator, setOperator] = useState('<');
  const [threshold, setThreshold] = useState('20');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setName('');
    setMetric('battery');
    setOperator('<');
    setThreshold('20');
    setDeviceId('');
    setError('');
    setDrawer(true);
  }

  function openEdit(a) {
    setEditing(a);
    setName(a.name || '');
    setMetric(a.metric || 'battery');
    setOperator(a.operator && a.operator !== 'offline' ? a.operator : '<');
    setThreshold(a.threshold != null ? String(a.threshold) : '20');
    setDeviceId(a.deviceId ? String(a.deviceId) : '');
    setError('');
    setDrawer(true);
  }

  function rulePreview() {
    if (metric === 'offline') return 'IF device offline THEN create alert & notify';
    if (metric === 'journey_started') return 'IF journey started (left origin) THEN alert';
    if (metric === 'journey_arrived') return 'IF reached destination THEN alert';
    if (metric === 'journey_returned') return 'IF returned to origin THEN alert';
    const unit = metric === 'temperature' ? '°C' : '%';
    return `IF ${metric} ${operator} ${threshold}${unit} THEN create alert & notify`;
  }

  async function handleToggle(a) {
    if (!canManage) return;
    const turningOff = a.on;
    const ok = await confirm({
      title: turningOff ? 'Turn off automation?' : 'Turn on automation?',
      message: turningOff
        ? `"${a.name}" will stop until you turn it back on.`
        : `"${a.name}" will evaluate the selected sensor.`,
      confirmLabel: turningOff ? 'Turn off' : 'Turn on',
      danger: turningOff,
    });
    if (!ok) return;
    try {
      await toggleAutomation(a.id);
      showToast(`"${a.name}" turned ${a.on ? 'off' : 'on'}`);
    } catch (err) {
      showToast(err?.message || 'Could not toggle', 'error');
    }
  }

  async function handleRemove(a) {
    const ok = await confirm({
      title: 'Delete automation?',
      message: `"${a.name}" will be permanently deleted.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await removeAutomation(a.id);
      showToast('Automation deleted');
    } catch (err) {
      showToast(err?.message || 'Could not delete', 'error');
    }
  }

  async function submit() {
    setError('');
    if (!name.trim()) return setError('Give the automation a name.');
    if (!deviceId) return setError('Select a sensor — this is required.');
    if (!EVENT_METRICS.has(metric)) {
      const n = Number(threshold);
      if (!Number.isFinite(n)) return setError('Enter a valid threshold number.');
    }

    const payload = {
      name: name.trim(),
      metric,
      operator: EVENT_METRICS.has(metric) ? (metric === 'offline' ? 'offline' : 'event') : operator,
      threshold: EVENT_METRICS.has(metric) ? null : Number(threshold),
      deviceId,
      rule: rulePreview(),
      icon: metric === 'battery' ? 'i-battery' : metric === 'offline' ? 'i-wifi' : 'i-zap',
    };

    setSaving(true);
    try {
      if (editing) {
        await updateAutomation(editing.id, payload);
        showToast('Automation updated');
      } else {
        await addAutomation(payload);
        showToast('Automation created — alerts will appear when the condition matches');
      }
      setDrawer(false);
      setEditing(null);
    } catch (err) {
      setError(err?.message || 'Could not save automation');
      showToast(err?.message || 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="view active">
      <div className="filter-row">
        <div>
          <div className="card-title">{isAdmin ? 'Fleet automations' : 'Your automations'}</div>
          <div className="card-title-sub">
            {myAutomations.length} rule{myAutomations.length !== 1 ? 's' : ''} · each tied to one
            sensor
          </div>
        </div>
        <div style={{ flex: 1 }}></div>
        {canManage && (
          <button className="btn btn-amber" onClick={openCreate}>
            <svg>
              <use href="#i-plus" />
            </svg>
            New automation
          </button>
        )}
      </div>

      {!canManage && (
        <div className="locked-banner section-gap">
          <svg style={{ width: 14, height: 14 }}>
            <use href="#i-shield" />
          </svg>
          You can view automations but can&apos;t create or edit them. Ask your admin for
          &quot;Manage automations&quot;.
        </div>
      )}

      {myAutomations.length ? (
        <div className="auto-list">
          {myAutomations.map((a) => (
            <div className="auto-row" key={a.id}>
              <div className="auto-icon">
                <svg>
                  <use href={`#${a.icon || 'i-zap'}`} />
                </svg>
              </div>
              <div className="auto-body">
                <div className="auto-name">{a.name}</div>
                <div className="auto-rule">{a.rule}</div>
                <div className="auto-meta">
                  Sensor: {sensorName(a.deviceId)} · {a.runs || 0} run
                  {a.runs !== 1 ? 's' : ''} · last run {formatLastRun(a.lastRun)}
                  {a.on ? '' : ' · paused'}
                </div>
              </div>
              <div className="auto-actions">
                {canManage && (
                  <button className="icon-btn-sm" title="Edit" onClick={() => openEdit(a)}>
                    <svg>
                      <use href="#i-edit" />
                    </svg>
                  </button>
                )}
                <div
                  className={`switch${a.on ? ' on' : ''}${!canManage ? ' locked' : ''}`}
                  onClick={() => handleToggle(a)}
                ></div>
                {canManage && (
                  <button className="icon-btn-sm" title="Delete" onClick={() => handleRemove(a)}>
                    <svg>
                      <use href="#i-trash" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg>
            <use href="#i-search" />
          </svg>
          <p>No automations yet. Create a rule and choose which sensor it watches.</p>
        </div>
      )}

      <Drawer
        open={drawer}
        title={editing ? 'Edit automation' : 'New automation'}
        sub="Sensor selection is required. Engine checks every ~20s."
        onClose={() => setDrawer(false)}
      >
        {error && <div className="form-error show">{error}</div>}

        <div className="field">
          <label>
            Name <span className="req">*</span>
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Low battery warning"
          />
        </div>

        <div className="field">
          <label>
            Sensor <span className="req">*</span>
          </label>
          <select
            className="input"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
          >
            <option value="">Select a sensor…</option>
            {sensorOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.status ? ` (${s.status})` : ''}
              </option>
            ))}
          </select>
          {!sensorOptions.length && (
            <div className="field-hint" style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              {isAdmin
                ? 'No sensors in the fleet yet.'
                : 'No sensors assigned to you. Ask admin to assign one.'}
            </div>
          )}
        </div>

        <div className="field">
          <label>
            When <span className="req">*</span>
          </label>
          <select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>
            {METRICS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {!EVENT_METRICS.has(metric) && (
          <>
            <div className="field">
              <label>Condition</label>
              <select
                className="input"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                {OPERATORS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} ({o.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Threshold</label>
              <input
                className="input"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </>
        )}

        <div
          style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--surface-2)',
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          Preview: <strong style={{ color: 'var(--text-main)' }}>{rulePreview()}</strong>
        </div>

        <button className="btn btn-amber btn-block" onClick={submit} disabled={saving}>
          <svg>
            <use href={editing ? '#i-check' : '#i-plus'} />
          </svg>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create automation'}
        </button>
      </Drawer>
    </section>
  );
}
