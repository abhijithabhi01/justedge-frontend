import React, { useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import { useData } from './context/DataContext.jsx';
import { useAuth } from './context/AuthContext.jsx';
import UserSidebar from './components/UserSidebar.jsx';
import UserTopbar from './components/UserTopbar.jsx';
import UserOverviewView from './views/UserOverviewView.jsx';
import UserSensorsView from './views/UserSensorsView.jsx';
import UserAlertsView from './views/UserAlertsView.jsx';
import UserAutomationsView from './views/UserAutomationsView.jsx';
import { ensurePermissions } from './lib/helpers.js';
import { PageLoader, GlobalBusyOverlay } from './components/Spinner.jsx';
import DemoBanner from './components/DemoBanner.jsx';

function UserLayout({ user, mySensors }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  const location = useLocation();
  const { loading, busy } = useData();

  const base = session?.isDemo ? '/demo/user' : '/app';
  const parts = location.pathname.split('/').filter(Boolean);
  const view = (session?.isDemo ? parts[2] : parts[1]) || 'overview';

  function goTo(nextView) {
    navigate(`${base}/${nextView}`);
  }

  return (
    <div className="app">
      <UserSidebar
        view={view}
        onNavigate={goTo}
        user={user}
        mySensors={mySensors}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="main">
        <DemoBanner />
        <UserTopbar
          view={view}
          user={user}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div className="content">
          {loading ? (
            <PageLoader label="Loading your sensors…" />
          ) : (
            <Outlet context={{ goTo }} />
          )}
        </div>
      </div>
      <GlobalBusyOverlay active={busy} label="Updating…" />
    </div>
  );
}

function OverviewRoute({ user, mySensors, myAlerts }) {
  const { goTo } = useOutletContext();
  return (
    <UserOverviewView
      user={user}
      mySensors={mySensors}
      myAlerts={myAlerts}
      onNavigate={goTo}
    />
  );
}

export default function UserApp({ userId }) {
  const { users, sensors, alerts, automations, loading } = useData();
  const { session } = useAuth();

  let user = users.find((u) => String(u.id) === String(userId)) || null;
  if (!user && session?.isDemo && session.type === 'user') {
    user = {
      id: session.userId || 'demo-user-1',
      name: session.name || 'Demo User',
      email: session.account?.email,
      role: 'User',
      status: 'active',
      permissions: session.account?.permissions || {
        monitor: true,
        addSensor: false,
        editSensor: false,
        removeSensor: false,
        automations: false,
        alerts: false,
        manageUsers: false,
        exportData: true,
      },
    };
  }
  if (user) ensurePermissions(user);

  if (loading && !user) {
    return (
      <div className="app">
        <div className="main">
          <div className="content">
            <PageLoader label="Loading your account…" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <div className="main">
          <div className="content">
            <div className="empty-state">
              <svg>
                <use href="#i-users" />
              </svg>
              <p>This account no longer exists. Please sign out and back in.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mySensors = sensors.filter(
    (s) => String(s.assignedUserId) === String(user.id)
  );
  const myAlerts = alerts.filter(
    (a) => String(a.ownerId || a.owner) === String(user.id)
  );
  const myAutomations = automations.filter(
    (a) => String(a.ownerId || a.owner) === String(user.id)
  );

  return (
    <Routes>
          <Route element={<UserLayout user={user} mySensors={mySensors} />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route
              path="overview"
              element={
                <OverviewRoute
                  user={user}
                  mySensors={mySensors}
                  myAlerts={myAlerts}
                />
              }
            />
            <Route
              path="sensors"
              element={<UserSensorsView user={user} mySensors={mySensors} />}
            />
            <Route
              path="alerts"
              element={<UserAlertsView user={user} myAlerts={myAlerts} />}
            />
            <Route
              path="automations"
              element={
                <UserAutomationsView
                  user={user}
                  myAutomations={myAutomations}
                />
              }
            />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Route>
        </Routes>
  );
}