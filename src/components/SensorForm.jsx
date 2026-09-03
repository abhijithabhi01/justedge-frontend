import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { boardById, formatMacInput, isValidMac } from '../lib/helpers.js';
import LocationSearch from './LocationSearch.jsx';

export default function SensorForm({ sensor, onDone, lockedUserId }) {
  const {
    boardCatalog,
    awsBoards,
    subscriptionPlans,
    users,
    sensors,
    addSensor,
    updateSensor,
  } = useData();
  const showToast = useToast();
  const editing = !!sensor;

  const [name, setName] = useState(sensor?.name || '');
  const [boardId, setBoardId] = useState(sensor?.boardId || null);
  const [imei, setImei] = useState(sensor?.imei || '');
  const [sim, setSim] = useState(sensor?.simNo || '');
  const [mac, setMac] = useState(sensor?.mac || '');
  const [plan, setPlan] = useState(
    sensor?.subscriptionPlan || subscriptionPlans[0]?.id || ''
  );
  const [expiry, setExpiry] = useState(sensor?.subscriptionExpiry || '');
  const [assignUserId, setAssignUserId] = useState(
    sensor?.assignedUserId || lockedUserId || ''
  );
  const [site, setSite] = useState(sensor?.site || '');
  const [lat, setLat] = useState(sensor?.lat || '');
  const [lng, setLng] = useState(sensor?.lng || '');
  const [awsDeviceId, setAwsDeviceId] = useState(sensor?.awsDeviceId || '');
  const [error, setError] = useState('');
  const board = boardId ? boardById(boardCatalog, boardId) : null;
  const isLora = board?.conn === 'LoRaWAN';

  const takenAwsIds = new Set(
    sensors
      .filter((s) => s.awsDeviceId && s.id !== sensor?.id)
      .map((s) => s.awsDeviceId)
  );
  const availableAwsBoards = awsBoards.filter(
    (b) => !takenAwsIds.has(b.deviceId) || b.deviceId === awsDeviceId
  );

  function fail(msg) {
    setError(msg);
    showToast(msg, 'error');
  }

  function submit() {
    setError('');
    if (!name.trim()) return fail('Enter a sensor name or location.');
    if (!board) return fail('Select a board type.');
    if (!/^\d{15}$/.test(imei)) return fail('IMEI must be exactly 15 digits.');
    if (!isLora && !sim.trim())
      return fail('Enter a SIM number for this board type.');
    if (!isValidMac(mac))
      return fail('Enter a valid MAC address (XX:XX:XX:XX:XX:XX).');
    const macTaken = sensors.some(
      (s) => s.mac === mac && s.id !== sensor?.id
    );
    if (macTaken)
      return fail('That MAC address is already registered to another sensor.');
    if (!plan) return fail('Select a subscription plan.');
    if (!expiry) return fail('Set a subscription expiry date.');

    const payload = {
      name: name.trim(),
      boardId: board.id,
      imei,
      simNo: isLora ? null : sim.trim(),
      mac,
      subscriptionPlan: plan,
      subscriptionExpiry: expiry,
      assignedUserId: assignUserId || null,
      awsDeviceId: awsDeviceId || null,
    };

    if (editing) {
      updateSensor(sensor.id, payload);
      showToast(`${sensor.id} updated`, 'success');
    } else {
      addSensor({
        ...payload,
        temp: 22.0,
        hum: 45,
        battery: 100,
        signal: -55,
        fw: 'v2.4.1',
        status: 'online',
        lastPing: 'Just now',
        base: 22.0,
        amp: 1.5,
      });
      showToast('Sensor added to the fleet', 'success');
    }
    onDone();
  }

  return (
    <>
      {error && <div className="form-error show">{error}</div>}
      <div className="field">
        <label>
          Sensor name / location <span className="req">*</span>
        </label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. North Wing Freezer"
        />
      </div>
      <div className="field">
        <label>
          Select board <span className="req">*</span>
        </label>
        <select
          className="input"
          value={boardId || ''}
          onChange={(e) => setBoardId(e.target.value || null)}
        >
          <option value="">Choose board type…</option>
          {(boardCatalog || []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.category ? ` · ${b.category}` : ''}
              {b.conn ? ` · ${b.conn}` : ''}
            </option>
          ))}
        </select>
        {!(boardCatalog || []).length && (
          <div className="hint" style={{ color: 'var(--danger, #b91c1c)' }}>
            No board types loaded. Add boards in Board Catalog first.
          </div>
        )}
        {board && (
          <div className="hint">
            {(board.desc || board.conn || 'Selected board').toString()}
            {Array.isArray(board.probes) && board.probes.length
              ? ` · Probes: ${board.probes.join(', ')}`
              : ''}
          </div>
        )}
      </div>
      {awsBoards.length > 0 && (
        <div className="field">
          <label>Live AWS device (optional)</label>
          <select
            className="input"
            value={awsDeviceId}
            onChange={(e) => setAwsDeviceId(e.target.value)}
          >
            <option value="">Not linked — use simulated data</option>
            {availableAwsBoards.map((b) => (
              <option key={b.deviceId} value={b.deviceId}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label>
          IMEI number <span className="req">*</span>
        </label>
        <input
          className="input"
          maxLength={15}
          value={imei}
          onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
          placeholder="15-digit device IMEI"
        />
      </div>
      <div className="field">
        <label>
          SIM number {!isLora && <span className="req">*</span>}
        </label>
        <input
          className="input"
          value={sim}
          disabled={isLora}
          onChange={(e) => setSim(e.target.value)}
          placeholder="e.g. +91 89051 22341"
        />
      </div>
      <div className="field">
        <label>
          MAC address <span className="req">*</span>
        </label>
        <input
          className="input"
          maxLength={17}
          value={mac}
          onChange={(e) => setMac(formatMacInput(e.target.value))}
          placeholder="e.g. 3C:71:BF:0A:12:0A"
        />
      </div>
<div className="field">
  <label>Device location</label>
  <LocationSearch
    value={site}
    placeholder="Search city, area, or landmark…"
    onSelect={({ site: s, lat: la, lng: ln, label }) => {
      setSite(s || label || '');
      setLat(la != null ? String(la) : '');
      setLng(ln != null ? String(ln) : '');
    }}
  />
</div>
      <div className="field-row2">
        <div className="field">
          <label>
            Subscription plan <span className="req">*</span>
          </label>
          <select
            className="input"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="">Select plan</option>
            {(subscriptionPlans || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.desc ? ` — ${p.desc}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            Subscription expiry <span className="req">*</span>
          </label>
          <input
            className="input"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </div>
      </div>
      {!lockedUserId && (
        <div className="field">
          <label>Assign to user (optional)</label>
          <select
            className="input"
            value={assignUserId || ''}
            onChange={(e) => setAssignUserId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="button" className="btn btn-amber btn-block" onClick={submit}>
        <svg>
          <use href={editing ? '#i-check' : '#i-plus'} />
        </svg>
        {editing ? 'Save changes' : 'Add sensor'}
      </button>
    </>
  );
}  