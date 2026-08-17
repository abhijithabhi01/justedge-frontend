import React from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import FleetChart from '../components/charts/FleetChart.jsx';
import StatusChart from '../components/charts/StatusChart.jsx';
import BatteryChart from '../components/charts/BatteryChart.jsx';
import BoardChart from '../components/charts/BoardChart.jsx';
import OwnerChart from '../components/charts/OwnerChart.jsx';

export default function DashboardView() {
  const { sensors, adminAccounts, subscriptions, subscriptionPlans } = useData();
  const { isSuperadmin } = useAuth();
  const total = sensors.length;
  const online = sensors.filter(r => r.status === 'online').length;
  const avgTemp = total ? (sensors.reduce((a, r) => a + r.temp, 0) / total).toFixed(1) : '0.0';
  const lowBattery = sensors.filter(r => r.battery < 20).length;

  const onlinePct = total ? Math.round((online / total) * 100) : 0;

  const planPrice = new Map(
    subscriptionPlans.map((plan) => [
      plan.id,
      Number(String(plan.price || '').replace(/[^0-9.]/g, '')) || 0,
    ])
  );
  const monthlyRevenue = subscriptions.reduce(
    (sum, subscription) => sum + (planPrice.get(subscription.plan) || 0),
    0
  );

  const adminKpis = [
    { label: 'Total sensors', value: total, icon: 'i-thermo', color: 'var(--purple)', soft: 'var(--purple-soft)', delta: `${sensors.filter(s => s.status !== 'offline').length} active`, trend: 'up' },
    { label: 'Online now', value: `${online}/${total}`, icon: 'i-wifi', color: 'var(--good)', soft: 'var(--good-soft)', delta: `${onlinePct}% uptime`, trend: onlinePct >= 70 ? 'up' : 'down' },
    { label: 'Fleet avg temp', value: `${avgTemp}°C`, icon: 'i-chart', color: 'var(--blue)', soft: 'var(--blue-soft)', delta: 'across all boards', trend: 'flat' },
    { label: 'Low battery', value: lowBattery, icon: 'i-battery', color: lowBattery > 0 ? 'var(--danger)' : 'var(--good)', soft: lowBattery > 0 ? 'var(--danger-soft)' : 'var(--good-soft)', delta: lowBattery > 0 ? 'needs attention' : 'all healthy', trend: lowBattery > 0 ? 'down' : 'up' },
  ];

  const superadminKpis = [
    { label: 'Admin companies', value: adminAccounts.filter((admin) => admin.role === 'Admin').length, icon: 'i-users', color: 'var(--purple)', soft: 'var(--purple-soft)', delta: 'active platform accounts', trend: 'up' },
    { label: 'Boards registered', value: total, icon: 'i-cpu', color: 'var(--blue)', soft: 'var(--blue-soft)', delta: `${online}/${total} online`, trend: onlinePct >= 70 ? 'up' : 'down' },
    { label: 'Active subscriptions', value: subscriptions.length, icon: 'i-receipt', color: 'var(--good)', soft: 'var(--good-soft)', delta: 'licensed board plans', trend: 'up' },
    { label: 'Monthly licensing', value: `$${monthlyRevenue}`, icon: 'i-chart', color: 'var(--warn)', soft: 'var(--warn-soft)', delta: 'from priced plans', trend: 'flat' },
  ];

  const kpis = isSuperadmin ? superadminKpis : adminKpis;

  return (
    <section className="view active">
      <div className="grid grid-4 section-gap">
        {kpis.map(k => (
          <div className="card" key={k.label}>
            <div className="kpi-top">
              <div><div className="kpi-label">{k.label}</div><div className="kpi-value">{k.value}</div></div>
              <div className="kpi-icon" style={{ background: k.soft, color: k.color }}>
                <svg><use href={`#${k.icon}`} /></svg>
              </div>
            </div>
            <div className={`kpi-delta${k.trend === 'up' ? ' up' : k.trend === 'down' ? ' down' : ''}`}>
              {k.trend !== 'flat' && <svg><use href="#i-trend-up" style={k.trend === 'down' ? { transform: 'scaleY(-1)' } : undefined} /></svg>}
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <FleetChart />

      <div className="grid grid-2 section-gap">
        <StatusChart />
        <BatteryChart />
      </div>

      <div className="grid grid-2">
        <BoardChart />
        <OwnerChart />
      </div>
    </section>
  );
}
