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
  const [saving, setSaving] = useState(false);
  const board = boardId ? boardById(boardCatalog, boardId) : null;
  const isLora = board?.conn === 'LoRaWAN';
  // GPS boards get coordinates from AWS telemetry — hide manual location picker
  const isGps = Boolean(
    board &&
      (String(board.id || '').toLowerCase().includes('gps') ||
        String(board.name || '').toLowerCase().includes('gps') ||
        String(board.conn || '').toLowerCase() === 'gps')
  );

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

  async function submit() {
    if (saving) return; // prevent double-click / double POST
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
    const imeiTaken = sensors.some(
      (s) => String(s.imei) === String(imei) && s.id !== sensor?.id
    );
    if (imeiTaken)
      return fail('A device with that IMEI is already registered.');
    if (!plan) return fail('Select a subscription plan.');
    if (!expiry) return fail('Set a subscription expiry date.');
    if (!editing && awsBoards.length > 0 && !awsDeviceId) {
      return fail('Select a live AWS device that is not already assigned.');
    }

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
      site: isGps ? undefined : (site || undefined),
      lat: isGps ? undefined : (lat ?? undefined),
      lng: isGps ? undefined : (lng ?? undefined),
    };

    setSaving(true);
    try {
      if (editing) {
        await updateSensor(sensor.id, payload);
        showToast(`${sensor.id} updated`, 'success');
      } else {
        await addSensor(payload);
        showToast(
          awsDeviceId
            ? `Sensor linked to AWS device ${awsDeviceId}`
            : 'Sensor added to the fleet',
          'success'
        );
      }
      onDone();
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.error ||
        'Could not save sensor. Check AWS device and try again.';
      fail(msg);
    } finally {
      setSaving(false);
    }
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
          <label>Live AWS device <span className="req">*</span></label>
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
{!isGps && (
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
      )}
      {isGps && (
        <div
          className="field"
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            padding: '8px 12px',
            background: 'var(--surface-2)',
            borderRadius: 10,
            lineHeight: 1.45,
          }}
        >
          GPS board — location comes from live AWS coordinates (no fixed site needed).
        </div>
      )}
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
      <button
        type="button"
        className="btn btn-amber btn-block"
        onClick={submit}
        disabled={saving}
        aria-busy={saving}
      >
        <svg>
          <use href={editing ? '#i-check' : '#i-plus'} />
        </svg>
        {saving
          ? editing
            ? 'Saving…'
            : 'Adding…'
          : editing
            ? 'Save changes'
            : 'Add sensor'}
      </button>
    </>
  );
}  