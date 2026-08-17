import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

const TONE_ICON = { good: 'i-check', warn: 'i-battery', bad: 'i-wifi' };

export default function UserAlertsView({ user, myAlerts }) {
  const { resolveAlert, dismissAlert, snoozeAlert } = useData();
  const showToast = useToast();
  const confirm = useConfirm();
  const canManage = !!user?.permissions?.alerts;

  async function handleResolve(a) {
    const ok = await confirm({
      title: 'Resolve alert?',
      message: `"${a.title}" will be marked as resolved.`,
      confirmLabel: 'Resolve',
      danger: false,
    });
    if (!ok) return;
    resolveAlert(a.id);
    showToast('Alert resolved');
  }

  async function handleSnooze(a) {
    const ok = await confirm({
      title: 'Snooze alert?',
      message: `"${a.title}" will be hidden temporarily and may reappear if the condition persists.`,
      confirmLabel: 'Snooze',
      danger: false,
    });
    if (!ok) return;
    snoozeAlert(a.id);
    showToast('Alert snoozed');
  }

  async function handleDismiss(a) {
    const ok = await confirm({
      title: 'Dismiss alert?',
      message: `"${a.title}" will be dismissed.`,
      confirmLabel: 'Dismiss',
    });
    if (!ok) return;
    dismissAlert(a.id);
    showToast('Alert dismissed');
  }

  return (
    <section className="view active">
      <div className="section-header">
        <div>
          <div className="card-title">Your alerts</div>
          <div className="card-title-sub">{myAlerts.length} alert{myAlerts.length !== 1 ? 's' : ''} from your sensors</div>
        </div>
      </div>

      {!canManage && myAlerts.length > 0 && (
        <div className="locked-banner section-gap">
          <svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
          You can view alerts but can't resolve, snooze, or dismiss them. Ask your admin to grant "Manage alerts".
        </div>
      )}

      {myAlerts.length ? (
        <div className="alert-list">
          {myAlerts.map(a => (
            <div className={`alert-row tone-${a.tone}${a.resolved ? ' resolved' : ''}`} key={a.id}>
              <div className={`alert-icon tone-${a.tone}`}><svg><use href={`#${TONE_ICON[a.tone] || 'i-check'}`} /></svg></div>
              <div className="alert-body">
                <div className="alert-title">{a.title}</div>
                <div className="alert-desc">{a.desc}</div>
                <div className="alert-time">{a.resolved ? 'Resolved · ' : ''}{a.time}</div>
              </div>
              {canManage && !a.resolved && (
                <div className="alert-actions">
                  <button className="icon-btn-sm" title="Resolve" onClick={() => handleResolve(a)}><svg><use href="#i-check" /></svg></button>
                  <button className="icon-btn-sm" title="Snooze" onClick={() => handleSnooze(a)}><svg><use href="#i-refresh" /></svg></button>
                  <button className="icon-btn-sm" title="Dismiss" onClick={() => handleDismiss(a)}><svg><use href="#i-x" /></svg></button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><svg><use href="#i-search" /></svg><p>No alerts for your sensors right now.</p></div>
      )}
    </section>
  );
}