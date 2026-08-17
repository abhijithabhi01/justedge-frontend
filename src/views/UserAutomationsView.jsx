import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import Drawer from '../components/Drawer.jsx';

export default function UserAutomationsView({ user, myAutomations }) {
  const { toggleAutomation, removeAutomation, addAutomation } = useData();
  const showToast = useToast();
  const confirm = useConfirm();
  const canManage = !!user?.permissions?.automations;

  async function handleToggle(a) {
    if (!canManage) return;
    const turningOff = a.on;
    const ok = await confirm({
      title: turningOff ? 'Turn off automation?' : 'Turn on automation?',
      message: turningOff
        ? `"${a.name}" will stop running until you turn it back on.`
        : `"${a.name}" will start running against your sensors.`,
      confirmLabel: turningOff ? 'Turn off' : 'Turn on',
      danger: turningOff,
    });
    if (!ok) return;
    toggleAutomation(a.id);
    showToast(`"${a.name}" turned ${a.on ? 'off' : 'on'}`);
  }

  async function handleRemove(a) {
    const ok = await confirm({
      title: 'Delete automation?',
      message: `"${a.name}" will be permanently deleted. This can't be undone.`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    removeAutomation(a.id);
    showToast('Automation deleted');
  }
  const [drawer, setDrawer] = useState(false);
  const [name, setName] = useState('');
  const [rule, setRule] = useState('');
  const [error, setError] = useState('');

  function submit() {
    setError('');
    if (!name.trim()) return setError('Give the automation a name.');
    if (!rule.trim()) return setError('Describe the rule, e.g. "IF battery < 20% THEN notify me".');
    addAutomation({ name: name.trim(), rule: rule.trim(), owner: user.name, icon: 'i-zap' });
    showToast('Automation created');
    setName(''); setRule(''); setDrawer(false);
  }

  return (
    <section className="view active">
      <div className="filter-row">
        <div>
          <div className="card-title">Your automations</div>
          <div className="card-title-sub">{myAutomations.length} rule{myAutomations.length !== 1 ? 's' : ''} watching your sensors</div>
        </div>
        <div style={{ flex: 1 }}></div>
        {canManage && (
          <button className="btn btn-amber" onClick={() => setDrawer(true)}><svg><use href="#i-plus" /></svg>New automation</button>
        )}
      </div>

      {!canManage && (
        <div className="locked-banner section-gap">
          <svg style={{ width: 14, height: 14 }}><use href="#i-shield" /></svg>
          You can view automations but can't create, toggle, or delete them. Ask your admin to grant "Manage automations".
        </div>
      )}

      {myAutomations.length ? (
        <div className="auto-list">
          {myAutomations.map(a => (
            <div className="auto-row" key={a.id}>
              <div className="auto-icon"><svg><use href={`#${a.icon || 'i-zap'}`} /></svg></div>
              <div className="auto-body">
                <div className="auto-name">{a.name}</div>
                <div className="auto-rule">{a.rule}</div>
                <div className="auto-meta">{a.runs} run{a.runs !== 1 ? 's' : ''} · last run {a.lastRun}</div>
              </div>
              <div className="auto-actions">
                <div
                  className={`switch${a.on ? ' on' : ''}${!canManage ? ' locked' : ''}`}
                  title={!canManage ? "You don't have permission to toggle automations" : ''}
                  onClick={() => handleToggle(a)}
                ></div>
                {canManage && (
                  <button className="icon-btn-sm" title="Delete" onClick={() => handleRemove(a)}><svg><use href="#i-trash" /></svg></button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><svg><use href="#i-search" /></svg><p>No automations set up for your sensors yet.</p></div>
      )}

      <Drawer open={drawer} title="New automation" sub="Create a rule for your sensors" onClose={() => setDrawer(false)}>
        {error && <div className="form-error show">{error}</div>}
        <div className="field"><label>Name <span className="req">*</span></label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Low battery digest" />
        </div>
        <div className="field"><label>Rule <span className="req">*</span></label>
          <input className="input" value={rule} onChange={e => setRule(e.target.value)} placeholder='e.g. "IF battery < 20% THEN notify me"' />
        </div>
        <button className="btn btn-amber btn-block" onClick={submit}><svg><use href="#i-plus" /></svg>Create automation</button>
      </Drawer>
    </section>
  );
}