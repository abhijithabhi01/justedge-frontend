import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

const TONE_ICON = { info: 'i-check', warn: 'i-battery', critical: 'i-wifi' };

export default function AdminAlertsView() {
  const { alerts, sensors, resolveAlert, dismissAlert, snoozeAlert } = useData();
  const showToast = useToast();
  const confirm = useConfirm();

  const sensorName = (id) => {
    const s = (sensors || []).find((x) => String(x.id) === String(id));
    return s?.name || '';
  };

  async function handleResolve(a) {
    const ok = await confirm({
      title: 'Resolve alert?',
      message: `"${a.title}" will be marked as resolved.`,
      confirmLabel: 'Resolve',
      danger: false,
    });
    if (!ok) return;
    try {
      await resolveAlert(a.id);
      showToast('Alert resolved');
    } catch (err) {
      showToast(err?.message || 'Failed', 'error');
    }
  }

  async function handleSnooze(a) {
    const ok = await confirm({
      title: 'Snooze alert?',
      message: `"${a.title}" will be hidden temporarily.`,
      confirmLabel: 'Snooze',
      danger: false,
    });
    if (!ok) return;
    try {
      await snoozeAlert(a.id);
      showToast('Alert snoozed');
    } catch (err) {
      showToast(err?.message || 'Failed', 'error');
    }
  }

  async function handleDismiss(a) {
    const ok = await confirm({
      title: 'Dismiss alert?',
      message: `"${a.title}" will be removed.`,
      confirmLabel: 'Dismiss',
    });
    if (!ok) return;
    try {
      await dismissAlert(a.id);
      showToast('Alert dismissed');
    } catch (err) {
      showToast(err?.message || 'Failed', 'error');
    }
  }

  const list = alerts || [];

  return (
    <section className="view active">
      <div className="section-header">
        <div>
          <div className="card-title">Fleet alerts</div>
          <div className="card-title-sub">
            {list.length} alert{list.length !== 1 ? 's' : ''} from automation rules
          </div>
        </div>
      </div>

      {list.length ? (
        <div className="alert-list">
          {list.map((a) => (
            <div
              className={`alert-row tone-${a.tone}${a.resolved ? ' resolved' : ''}`}
              key={a.id}
            >
              <div className={`alert-icon tone-${a.tone}`}>
                <svg>
                  <use href={`#${TONE_ICON[a.tone] || 'i-check'}`} />
                </svg>
              </div>
              <div className="alert-body">
                <div className="alert-title">{a.title}</div>
                <div className="alert-desc">
                  {a.desc}
                  {sensorName(a.deviceId) ? ` · ${sensorName(a.deviceId)}` : ''}
                </div>
                <div className="alert-time">
                  {a.resolved ? 'Resolved · ' : ''}
                  {a.time || a.createdAt || ''}
                </div>
              </div>
              {!a.resolved && (
                <div className="alert-actions">
                  <button
                    className="icon-btn-sm"
                    title="Resolve"
                    onClick={() => handleResolve(a)}
                  >
                    <svg>
                      <use href="#i-check" />
                    </svg>
                  </button>
                  <button className="icon-btn-sm" title="Snooze" onClick={() => handleSnooze(a)}>
                    <svg>
                      <use href="#i-refresh" />
                    </svg>
                  </button>
                  <button
                    className="icon-btn-sm"
                    title="Dismiss"
                    onClick={() => handleDismiss(a)}
                  >
                    <svg>
                      <use href="#i-x" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg>
            <use href="#i-search" />
          </svg>
          <p>No alerts yet. Create an automation on a sensor to start receiving them.</p>
        </div>
      )}
    </section>
  );
}
