import React, { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';

function parsePrice(price) {
  if (price == null) return 0;
  const n = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function monthsOf(plan) {
  const d = Number(plan?.durationMonths);
  return [1, 3, 6, 12].includes(d) ? d : 1;
}

function monthlyFromPlan(plan) {
  const price = parsePrice(plan?.price);
  const months = monthsOf(plan);
  return months > 0 ? price / months : price;
}

export default function RevenueBusinessView() {
  const { sensors, subscriptionPlans, subscriptions } = useData();

  const stats = useMemo(() => {
    const plans = subscriptionPlans || [];
    const planMap = new Map(plans.map((p) => [p.id, p]));
    const licensed = (sensors || []).filter((s) => s.subscriptionPlan);

    let mrr = 0;
    const byPlan = {};
    licensed.forEach((s) => {
      const plan = planMap.get(s.subscriptionPlan) || {
        id: s.subscriptionPlan,
        name: s.subscriptionPlan,
        price: '0',
        durationMonths: 1,
      };
      const monthly = monthlyFromPlan(plan);
      mrr += monthly;
      const key = plan.name || plan.id;
      byPlan[key] = (byPlan[key] || 0) + monthly;
    });

    const arr = mrr * 12;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const newThisMonth = licensed.filter((s) => {
      const d = s.createdAt ? new Date(s.createdAt) : null;
      return d && d >= monthStart;
    }).length;

    const churnedThisMonth = licensed.filter((s) => {
      if (!s.subscriptionExpiry) return false;
      const exp = new Date(s.subscriptionExpiry);
      return exp < now && exp >= monthStart;
    }).length;

    const overdue = licensed.filter((s) => {
      if (!s.subscriptionExpiry) return false;
      return new Date(s.subscriptionExpiry) < now;
    }).length;

    const breakdown = Object.entries(byPlan)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      mrr,
      arr,
      growthLabel: 'Add billing history for growth %',
      newThisMonth,
      churnedThisMonth,
      overdue,
      breakdown,
      licensedCount: licensed.length,
      subCount: (subscriptions || []).length || licensed.length,
    };
  }, [sensors, subscriptionPlans, subscriptions]);

  const fmtMoney = (n) =>
    `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const kpis = [
    { label: 'MRR (est.)', value: fmtMoney(stats.mrr), sub: stats.growthLabel, color: 'var(--good)', soft: 'var(--good-soft)' },
    { label: 'ARR (est.)', value: fmtMoney(stats.arr), sub: 'MRR × 12', color: 'var(--blue)', soft: 'var(--blue-soft)' },
    { label: 'New this month', value: stats.newThisMonth, sub: 'Licensed boards added', color: 'var(--purple)', soft: 'var(--purple-soft)' },
    { label: 'Churned this month', value: stats.churnedThisMonth, sub: 'Expired this month', color: stats.churnedThisMonth ? 'var(--danger)' : 'var(--good)', soft: stats.churnedThisMonth ? 'var(--danger-soft)' : 'var(--good-soft)' },
    { label: 'Overdue / unpaid', value: stats.overdue, sub: 'Expired still on platform', color: stats.overdue ? 'var(--warn)' : 'var(--good)', soft: stats.overdue ? 'var(--warn-soft)' : 'var(--good-soft)' },
    { label: 'Active licenses', value: stats.licensedCount, sub: 'Boards with a plan', color: 'var(--text)', soft: 'var(--surface-2, #f3f4f6)' },
  ];

  return (
    <section className="view active">
      <div className="section-header">
        <div>
          <div className="card-title">Revenue &amp; Business</div>
          <div className="card-title-sub">
            Licensing metrics from subscription plans · invoice module optional later
          </div>
        </div>
      </div>

      <div className="grid grid-3 section-gap">
        {kpis.map((k) => (
          <div className="card" key={k.label}>
            <div className="kpi-top">
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.value}</div>
              </div>
              <div className="kpi-icon" style={{ background: k.soft, color: k.color }}>
                <svg><use href="#i-chart" /></svg>
              </div>
            </div>
            <div className="kpi-delta" style={{ opacity: 0.85 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="card section-gap">
        <div className="card-title">Revenue by subscription plan</div>
        <div className="card-title-sub">Estimated monthly contribution (price ÷ duration)</div>
        {stats.breakdown.length ? (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.breakdown.map((row) => {
              const pct = stats.mrr > 0 ? Math.round((row.value / stats.mrr) * 100) : 0;
              return (
                <div key={row.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{row.name}</span>
                    <span className="mono-faint">{fmtMoney(row.value)}/mo · {pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-2, #eee)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue, #3b82f6)', borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ marginTop: 12 }}>
            <p>No licensed boards yet. Assign subscription plans to sensors.</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Notes</div>
        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>
          <li>MRR/ARR are estimated from plan display prices and duration (1/3/6/12 months).</li>
          <li>Growth trend requires historical snapshots (not stored yet).</li>
          <li>Overdue uses expired subscription dates until a real invoice system is added.</li>
        </ul>
      </div>
    </section>
  );
}