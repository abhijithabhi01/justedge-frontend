import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ownerName } from '../../lib/helpers.js';
import { tickColor } from '../../lib/chartUtils.js';
import { useChart } from '../../lib/useChart.js';

function labelForSensor(sensor, { isSuperadmin, users, adminAccounts }) {
  if (isSuperadmin) {
    if (sensor.ownerAdminId) {
      const admin = (adminAccounts || []).find(
        (a) => String(a.id) === String(sensor.ownerAdminId)
      );
      if (admin) return admin.companyName || admin.name || 'Admin';
    }
    const user = (users || []).find(
      (u) => String(u.id) === String(sensor.assignedUserId)
    );
    if (user?.createdBy) {
      const admin = (adminAccounts || []).find(
        (a) => String(a.id) === String(user.createdBy)
      );
      if (admin) return admin.companyName || admin.name || 'Admin';
    }
    return 'Unassigned / platform';
  }
  return ownerName(users, sensor);
}

export default function OwnerChart() {
  const { sensors, users, adminAccounts } = useData();
  const { isSuperadmin } = useAuth();

  const { names, counts } = useMemo(() => {
    const labels = sensors.map((s) =>
      labelForSensor(s, { isSuperadmin, users, adminAccounts })
    );
    const names = [...new Set(labels)];
    const counts = names.map(
      (n) => labels.filter((l) => l === n).length
    );
    return { names, counts };
  }, [sensors, users, adminAccounts, isSuperadmin]);

  const canvasRef = useChart(
    () => ({
      type: 'doughnut',
      data: {
        labels: names,
        datasets: [
          {
            data: counts,
            backgroundColor: [
              '#dd7c3f',
              '#2b9490',
              '#8a5fd6',
              '#c98a1f',
              '#4c8bd6',
              '#9aa3b2',
              '#e11d48',
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 9,
              boxHeight: 9,
              font: { family: 'Manrope', size: 11 },
              color: tickColorSafe(),
            },
          },
          tooltip: { padding: 10, cornerRadius: 8 },
        },
      },
    }),
    [names, counts]
  );

  function tickColorSafe() {
    try {
      return tickColor();
    } catch {
      return '#9aa3b2';
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">
            {isSuperadmin ? 'Sensors by admin' : 'Sensors by user'}
          </div>
          <div className="card-title-sub">
            {isSuperadmin
              ? 'Fleet distribution across admin companies'
              : 'Fleet distribution across assigned users'}
          </div>
        </div>
      </div>
      <div className="chart-wrap" style={{ height: 200 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}