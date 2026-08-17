import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import Drawer from '../components/Drawer.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

export default function BoardsView() {
  const { boardCatalog, addBoard, updateBoard, removeBoard } = useData();
  const showToast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id: '', name: '', conn: '', probes: '', desc: '' });

  function open(board = null) {
    setError('');
    setEditing(board?.id || 'new');
    setForm(board
      ? { ...board, probes: (board.probes || []).join(', ') }
      : { id: '', name: '', conn: '', probes: '', desc: '' });
  }

  async function submit() {
    if (!form.id.trim() || !form.name.trim()) {
      setError('Board ID and name are required.');
      return;
    }

    const payload = {
      ...form,
      id: form.id.trim(),
      name: form.name.trim(),
      conn: form.conn.trim(),
      desc: form.desc.trim(),
      probes: form.probes.split(',').map((probe) => probe.trim()).filter(Boolean),
    };

    try {
      if (editing === 'new') await addBoard(payload);
      else await updateBoard(editing, payload);
      showToast(`Board ${editing === 'new' ? 'added' : 'updated'}`);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(board) {
    const ok = await confirm({
      title: 'Remove board?',
      message: `This removes "${board.name}" from the catalog. Admins won't be able to assign this board type to new devices.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await removeBoard(board.id);
      showToast(`${board.name} removed`);
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="section-header"><div><div className="card-title">Board catalog</div><div className="card-title-sub">Hardware types available to every Admin</div></div></div>
        <button className="btn btn-amber" onClick={() => open()}><svg><use href="#i-plus" /></svg>Add board</button>
      </div>

      <div className="entity-grid">
        {boardCatalog.map((board) => (
          <div className="entity-card" key={board.id}>
            <div className="entity-card-top"><div><div className="entity-card-name">{board.name}</div><div className="entity-card-sub">{board.id}</div></div><span className="board-chip">{board.conn || 'Custom'}</span></div>
            <div className="entity-card-body"><div className="entity-meta-row"><span className="k">Probes</span><span className="v">{(board.probes || []).join(', ') || '—'}</span></div><div className="entity-meta-row"><span className="k">Description</span><span className="v">{board.desc || '—'}</span></div></div>
            <div className="entity-card-foot"><span className="pill pill-muted">Platform board</span><div className="entity-card-actions"><button className="icon-btn-sm" title="Edit" onClick={() => open(board)}><svg><use href="#i-edit" /></svg></button><button className="icon-btn-sm" title="Remove" onClick={() => remove(board)}><svg><use href="#i-trash" /></svg></button></div></div>
          </div>
        ))}
      </div>

      <Drawer open={!!editing} title={editing === 'new' ? 'Add board' : 'Edit board'} sub="Platform-wide board catalog" onClose={() => setEditing(null)}>
        {error && <div className="form-error show">{error}</div>}
        <div className="field"><label>Board ID <span className="req">*</span></label><input className="input" disabled={editing !== 'new'} value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} /></div>
        <div className="field"><label>Name <span className="req">*</span></label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Connectivity</label><input className="input" value={form.conn} onChange={(e) => setForm({ ...form, conn: e.target.value })} placeholder="WiFi, LoRaWAN, RS485…" /></div>
        <div className="field"><label>Probes</label><input className="input" value={form.probes} onChange={(e) => setForm({ ...form, probes: e.target.value })} placeholder="Temperature, Humidity" /></div>
        <div className="field"><label>Description</label><textarea className="input" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></div>
        <button className="btn btn-amber btn-block" onClick={submit}><svg><use href="#i-check" /></svg>Save board</button>
      </Drawer>
    </section>
  );
}