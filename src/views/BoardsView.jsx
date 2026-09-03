import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import Drawer from '../components/Drawer.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const CATEGORIES = [
  { id: 'commercial', label: 'Commercial' },
  { id: 'infotainment', label: 'Infotainment' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'cold-storage', label: 'Cold storage' },
  { id: 'lab', label: 'Lab' },
  { id: 'other', label: 'Other' },
];

const CONNECTIVITY = ['WiFi', 'BLE', '4G LTE', 'LoRaWAN', 'Ethernet', 'Other'];

const emptyForm = {
  id: '',
  name: '',
  category: 'commercial',
  conn: 'WiFi',
  probes: '',
  desc: '',
};

export default function BoardsView() {
  const { boardCatalog, addBoard, updateBoard, removeBoard } = useData();
  const { isSuperadmin } = useAuth();
  const showToast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState('');

  const boards = boardCatalog || [];

  const filtered = useMemo(() => {
    if (!filterCategory) return boards;
    return boards.filter((b) => (b.category || 'other') === filterCategory);
  }, [boards, filterCategory]);

  function open(board = null) {
    setError('');
    setEditing(board?.id || 'new');
    setForm(
      board
        ? {
            id: board.id || '',
            name: board.name || '',
            category: board.category || 'other',
            conn: board.conn || 'WiFi',
            probes: (board.probes || []).join(', '),
            desc: board.desc || '',
          }
        : { ...emptyForm }
    );
  }

  async function submit() {
    if (!form.id.trim() || !form.name.trim()) {
      setError('Board ID and name are required.');
      return;
    }
    if (!form.category) {
      setError('Select a category.');
      return;
    }
    if (!form.conn) {
      setError('Select connectivity.');
      return;
    }

    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      category: form.category,
      conn: form.conn,
      desc: form.desc.trim(),
      probes: form.probes
        .split(',')
        .map((probe) => probe.trim())
        .filter(Boolean),
    };

    try {
      if (editing === 'new') await addBoard(payload);
      else await updateBoard(editing, payload);
      showToast(`Board ${editing === 'new' ? 'added' : 'updated'}`, 'success');
      setEditing(null);
    } catch (err) {
      setError(err.message || 'Could not save board');
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
      showToast(err.message, 'error');
    }
  }

  function categoryLabel(id) {
    return CATEGORIES.find((c) => c.id === id)?.label || id || 'Other';
  }

  return (
    <section className="view active">
      <div className="filter-row">
        <div className="section-header">
          <div>
            <div className="card-title">Board catalog</div>
            <div className="card-title-sub">
              Categories, connectivity, and board types for the platform
            </div>
          </div>
        </div>
        <select
          className="plain-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {isSuperadmin && (
          <button type="button" className="btn btn-amber" onClick={() => open()}>
            <svg><use href="#i-plus" /></svg>
            Add board
          </button>
        )}
      </div>

      {filtered.length ? (
        <div className="entity-grid">
          {filtered.map((board) => (
            <div className="entity-card" key={board.id}>
              <div className="entity-card-top">
                <div style={{ minWidth: 0 }}>
                  <div className="entity-card-name">{board.name}</div>
                  <div className="entity-card-sub">{board.id}</div>
                </div>
                <span className="pill pill-muted">{categoryLabel(board.category)}</span>
              </div>
              <div className="entity-card-body">
                <div className="entity-meta-row">
                  <span className="k">Connectivity</span>
                  <span className="v">{board.conn || '—'}</span>
                </div>
                <div className="entity-meta-row">
                  <span className="k">Probes</span>
                  <span className="v">{(board.probes || []).join(', ') || '—'}</span>
                </div>
                <div className="entity-meta-row">
                  <span className="k">Description</span>
                  <span className="v">{board.desc || '—'}</span>
                </div>
              </div>
              <div className="entity-card-foot">
                <span className="board-chip">
                  <svg><use href="#i-cpu" /></svg>
                  {board.conn || 'Board'}
                </span>
                {isSuperadmin && (
                  <div className="entity-card-actions">
                    <button type="button" className="icon-btn-sm" title="Edit" onClick={() => open(board)}>
                      <svg><use href="#i-edit" /></svg>
                    </button>
                    <button type="button" className="icon-btn-sm" title="Remove" onClick={() => remove(board)}>
                      <svg><use href="#i-trash" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No boards in this category yet.</p>
        </div>
      )}

      <Drawer
        open={!!editing}
        title={editing === 'new' ? 'Add board' : 'Edit board'}
        sub="Category → connectivity → board details"
        onClose={() => setEditing(null)}
      >
        {error && <div className="form-error show">{error}</div>}

        <div className="field">
          <label>Category <span className="req">*</span></label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Connectivity <span className="req">*</span></label>
          <select
            className="input"
            value={form.conn}
            onChange={(e) => setForm({ ...form, conn: e.target.value })}
          >
            {CONNECTIVITY.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Board ID <span className="req">*</span></label>
          <input
            className="input"
            disabled={editing !== 'new'}
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="gps-tracker-lte"
          />
        </div>

        <div className="field">
          <label>Name <span className="req">*</span></label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="GPS Tracker 4G"
          />
        </div>

        <div className="field">
          <label>Probes</label>
          <input
            className="input"
            value={form.probes}
            onChange={(e) => setForm({ ...form, probes: e.target.value })}
            placeholder="Temperature, Humidity"
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            rows={3}
          />
        </div>

        <button type="button" className="btn btn-amber btn-block" onClick={submit}>
          <svg><use href="#i-check" /></svg>
          Save board
        </button>
      </Drawer>
    </section>
  );
}