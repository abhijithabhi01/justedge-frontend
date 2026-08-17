import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useData } from './context/DataContext.jsx';
import UserSidebar from './components/UserSidebar.jsx';
import UserTopbar from './components/UserTopbar.jsx';
import UserOverviewView from './views/UserOverviewView.jsx';
import UserSensorsView from './views/UserSensorsView.jsx';
import UserAlertsView from './views/UserAlertsView.jsx';
import UserAutomationsView from './views/UserAutomationsView.jsx';
import { ensurePermissions } from './lib/helpers.js';

// Persistent sidebar/topbar shell — same pattern as AdminLayout, so the
// sidebar doesn't remount every time the user switches tabs.
function UserLayout({ user, mySensors }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const view = location.pathname.split('/')[2] || 'overview';

  function goTo(nextView) {
    navigate(`/app/${nextView}`);
  }

  return (
    <div className="app">
      <UserSidebar view={view} onNavigate={goTo} user={user} mySensors={mySensors} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="main">
        <UserTopbar view={view} user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <div className="content">
          <Outlet context={{ goTo }} />
        </div>
      </div>
    </div>
  );
}

function OverviewRoute({ user, mySensors, myAlerts }) {
  const { goTo } = useOutletContext();
  return <UserOverviewView user={user} mySensors={mySensors} myAlerts={myAlerts} onNavigate={goTo} />;
}

export default function UserApp({ userId }) {
  const { users, sensors, alerts, automations } = useData();

  const user = users.find(u => u.id === userId) || null;
  if (user) ensurePermissions(user);

  if (!user) {
    return (
      <div className="app">
        <div className="main"><div className="content"><div className="empty-state"><svg><use href="#i-users" /></svg><p>This account no longer exists. Please sign out and back in.</p></div></div></div>
      </div>
    );
  }

  const mySensors = sensors.filter(s => s.assignedUserId === user.id);
  const myAlerts = alerts.filter(a => String(a.ownerId || a.owner) === String(user.id));
  const myAutomations = automations.filter(a => String(a.ownerId || a.owner) === String(user.id));

  return (
    <Routes>
      <Route element={<UserLayout user={user} mySensors={mySensors} />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewRoute user={user} mySensors={mySensors} myAlerts={myAlerts} />} />
        <Route path="sensors" element={<UserSensorsView user={user} mySensors={mySensors} />} />
        <Route path="alerts" element={<UserAlertsView user={user} myAlerts={myAlerts} />} />
        <Route path="automations" element={<UserAutomationsView user={user} myAutomations={myAutomations} />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Route>
    </Routes>
  );
}
