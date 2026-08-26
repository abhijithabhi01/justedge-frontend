import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, formatMacInput, isValidMac } from '../lib/helpers.js';

export default function SensorForm({ sensor, onDone, lockedUserId }) {
  const { boardCatalog, awsBoards, subscriptionPlans, users, sensors, addSensor, updateSensor } = useData();
  const showToast = useToast();
  const editing = !!sensor;

  const [name, setName] = useState(sensor?.name || '');
  const [boardId, setBoardId] = useState(sensor?.boardId || null);
  const [imei, setImei] = useState(sensor?.imei || '');
  const [sim, setSim] = useState(sensor?.simNo || '');
  const [mac, setMac] = useState(sensor?.mac || '');
  const [plan, setPlan] = useState(sensor?.subscriptionPlan || subscriptionPlans[0]?.id || '');
  const [expiry, setExpiry] = useState(sensor?.subscriptionExpiry || '');
  const [assignUserId, setAssignUserId] = useState(sensor?.assignedUserId || lockedUserId || '');
  const [awsDeviceId, setAwsDeviceId] = useState(sensor?.awsDeviceId || '');
  const [error, setError] = useState('');

  const board = boardId ? boardById(boardCatalog, boardId) : null;
  const isLora = board?.conn === 'LoRaWAN';

  // Boards already linked to another registered sensor shouldn't be
  // offered again — the backend rejects a second link anyway.
  const takenAwsIds = new Set(
    sensors.filter(s => s.awsDeviceId && s.id !== sensor?.id).map(s => s.awsDeviceId)
  );
  const availableAwsBoards = awsBoards.filter(
    b => !takenAwsIds.has(b.deviceId) || b.deviceId === awsDeviceId
  );

  function submit() {
    setError('');
    if (!name.trim()) return setError('Enter a sensor name or location.');
    if (!board) return setError('Select a board type.');
    if (!/^\d{15}$/.test(imei)) return setError('IMEI must be exactly 15 digits.');
    if (!isLora && !sim.trim()) return setError('Enter a SIM number for this board type.');
    if (!isValidMac(mac)) return setError('Enter a valid MAC address (XX:XX:XX:XX:XX:XX).');
    const macTaken = sensors.some(s => s.mac === mac && s.id !== sensor?.id);
    if (macTaken) return setError('That MAC address is already registered to another sensor.');
    if (!plan) return setError('Select a subscription plan.');
    if (!expiry) return setError('Set a subscription expiry date.');

    const payload = {
      name: name.trim(), boardId: board.id, imei,
      simNo: isLora ? null : sim.trim(), mac,
      subscriptionPlan: plan, subscriptionExpiry: expiry,
      assignedUserId: assignUserId || null,
      awsDeviceId: awsDeviceId || null,
    };

    if (editing) {
      updateSensor(sensor.id, payload);
      showToast(`${sensor.id} updated`);
    } else {
      addSensor({
        ...payload,
        temp: 22.0, hum: 45, battery: 100, signal: -55, fw: 'v2.4.1',
        status: 'online', lastPing: 'Just now', base: 22.0, amp: 1.5,
      });
      showToast('Sensor added to the fleet');
    }
    onDone();
  }

  return (
    <>
      {error && <div className="form-error show">{error}</div>}
      <div className="field">
        <label>Sensor name / location <span className="req">*</span></label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. North Wing Freezer" />
      </div>
      <div className="field">
        <label>Select board <span className="req">*</span></label>
        <div className="board-grid">
          {boardCatalog.map(b => (
            <div
              key={b.id}
              className={`board-pick${boardId === b.id ? ' selected' : ''}`}
              onClick={() => setBoardId(b.id)}
            >
              <div className="board-pick-name"><svg><use href="#i-cpu" /></svg>{b.name}</div>
              <div className="board-pick-meta">{b.conn} · {b.probes} probe{b.probes > 1 ? 's' : ''}</div>
              <div className="board-pick-desc">{b.desc}</div>
            </div>
          ))}
        </div>
        <div className="hint">Choose the hardware board this sensor uses. Supports Wi-Fi, LoRaWAN, NB-IoT and Modbus boards.</div>
      </div>
      {awsBoards.length > 0 && (
        <div className="field">
          <label>Live AWS device (optional)</label>
          <select className="input" value={awsDeviceId} onChange={e => setAwsDeviceId(e.target.value)}>
            <option value="">Not linked — use simulated data</option>
            {availableAwsBoards.map(b => <option key={b.deviceId} value={b.deviceId}>{b.label}</option>)}
          </select>
          <div className="hint">Link this sensor to a physical board already reporting into AWS to show its real live readings instead of simulated ones.</div>
        </div>
      )}
      <div className="field">
        <label>IMEI number <span className="req">*</span></label>
        <input className="input" maxLength={15} value={imei} onChange={e => setImei(e.target.value.replace(/\D/g, ''))} placeholder="15-digit device IMEI" />
        <div className="hint">Exactly 15 digits, printed on the board label.</div>
      </div>
      <div className="field">
        <label>SIM number {!isLora && <span className="req">*</span>}</label>
        <input className="input" value={sim} disabled={isLora} onChange={e => setSim(e.target.value)} placeholder="e.g. +91 89051 22341" />
        <div className="hint">{isLora ? 'LoRaWAN boards connect over radio — no SIM card needed.' : 'Required for cellular boards. Not needed for LoRaWAN boards.'}</div>
      </div>
      <div className="field">
        <label>MAC address <span className="req">*</span></label>
        <input className="input" maxLength={17} value={mac} onChange={e => setMac(formatMacInput(e.target.value))} placeholder="e.g. 3C:71:BF:0A:12:0A" />
        <div className="hint">Format XX:XX:XX:XX:XX:XX, printed on the board label next to the IMEI.</div>
      </div>
      <div className="field-row2">
        <div className="field">
          <label>Subscription plan <span className="req">*</span></label>
          <select className="input" value={plan} onChange={e => setPlan(e.target.value)}>
            {subscriptionPlans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.desc}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Subscription expiry <span className="req">*</span></label>
          <input className="input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
        </div>
      </div>
      {!lockedUserId && (
        <div className="field">
          <label>Assign to user (optional)</label>
          <select className="input" value={assignUserId || ''} onChange={e => setAssignUserId(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
      <button className="btn btn-amber btn-block" onClick={submit}>
        <svg><use href={editing ? '#i-check' : '#i-plus'} /></svg>{editing ? 'Save changes' : 'Add sensor'}
      </button>
    </>
  );
}