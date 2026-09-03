import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Drawer from '../components/Drawer.jsx';

const DURATIONS = [1, 3, 6, 12];

export default function SubscriptionPlansView() {
  const { subscriptionPlans, addBillingPlan, updateBillingPlan } = useData();
  const showToast = useToast();
  const [drawer, setDrawer] = useState(null);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [durationMonths, setDurationMonths] = useState(1);
  const [error, setError] = useState('');

  function openAdd() {
    setId('');
    setName('');
    setDesc('');
    setPrice('');
    setDurationMonths(1);
    setError('');
    setDrawer('add');
  }

  function openEdit(plan) {
    setId(plan.id);
    setName(plan.name || '');
    setDesc(plan.desc || '');
    setPrice(plan.price || '');
    setDurationMonths(plan.durationMonths || 1);
    setError('');
    setDrawer(plan);
  }

  async function save() {
    if (!name.trim()) return setError('Enter a plan name.');
    if (drawer === 'add' && !id.trim()) return setError('Enter a plan id (slug).');
    try {
      if (drawer === 'add') {
        if (!addBillingPlan) throw new Error('addBillingPlan not available');
        await addBillingPlan({
          id: id.trim(),
          name: name.trim(),
          desc: desc.trim(),
          price: price.trim(),
          durationMonths: Number(durationMonths),
        });
        showToast('Plan created', 'success');
      } else if (updateBillingPlan) {
        await updateBillingPlan(id, {
          name: name.trim(),
          desc: desc.trim(),
          price: price.trim(),
          durationMonths: Number(durationMonths),
        });
        showToast('Plan updated', 'success');
      } else {
        showToast('Wire addBillingPlan / updateBillingPlan in DataContext', 'error');
        return;
      }
      setDrawer(null);
    } catch (err) {
      setError(err.message || 'Could not save plan');
    }
  }

  const plans = subscriptionPlans || [];

  return (
    <section className="view active">
      <div className="section-header">
        <div>
          <div className="card-title">Subscription plans</div>
          <div className="card-title-sub">
            1 / 3 / 6 / 12 month plans for licensed boards
          </div>
        </div>
        <button type="button" className="btn btn-amber" onClick={openAdd}>
          Add plan
        </button>
      </div>

      {plans.length ? (
        <div className="entity-grid">
          {plans.map((p) => (
            <div className="entity-card" key={p.id} onClick={() => openEdit(p)}>
              <div className="entity-card-top">
                <div className="entity-card-name">{p.name}</div>
                <span className="pill pill-muted">{p.durationMonths || 1} mo</span>
              </div>
              <div className="entity-card-body">
                <div className="entity-meta-row">
                  <span className="k">Id</span>
                  <span className="v">{p.id}</span>
                </div>
                <div className="entity-meta-row">
                  <span className="k">Price</span>
                  <span className="v">{p.price || '—'}</span>
                </div>
                <div className="entity-meta-row">
                  <span className="k">Description</span>
                  <span className="v">{p.desc || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No subscription plans yet. Create 1, 3, 6, or 12 month plans.</p>
        </div>
      )}

      <Drawer
        open={!!drawer}
        title={drawer === 'add' ? 'Add plan' : 'Edit plan'}
        sub="Duration options: 1, 3, 6, or 12 months"
        onClose={() => setDrawer(null)}
      >
        {error && <div className="form-error show">{error}</div>}
        {drawer === 'add' && (
          <div className="field">
            <label>Plan id (slug) *</label>
            <input className="input" value={id} onChange={(e) => setId(e.target.value)} placeholder="pro-12m" />
          </div>
        )}
        <div className="field">
          <label>Name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro 12 months" />
        </div>
        <div className="field">
          <label>Duration</label>
          <select className="input" value={durationMonths} onChange={(e) => setDurationMonths(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>{d} month{d > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Price (display)</label>
          <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$99 / 12 mo" />
        </div>
        <div className="field">
          <label>Description</label>
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <button type="button" className="btn btn-amber btn-block" onClick={save}>
          Save plan
        </button>
      </Drawer>
    </section>
  );
}