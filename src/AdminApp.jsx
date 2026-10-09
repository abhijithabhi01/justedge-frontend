import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import DashboardView from './views/DashboardView.jsx';
import SensorsView from './views/SensorsView.jsx';
import UsersView from './views/UsersView.jsx';
import AssignView from './views/AssignView.jsx';
import BoardsView from './views/BoardsView.jsx';
import SubscriptionPlansView from './views/SubscriptionPlansView.jsx';
import RevenueBusinessView from './views/RevenueBusinessView.jsx';
import FleetHealthView from './views/FleetHealthView.jsx';
import SuperAdminAdminsView from './views/SuperAdminAdminsView.jsx';
import AdminAlertsView from './views/AdminAlertsView.jsx';
import UserAutomationsView from './views/UserAutomationsView.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useData } from './context/DataContext.jsx';
import { PageLoader, GlobalBusyOverlay } from './components/Spinner.jsx';
import DemoBanner from './components/DemoBanner.jsx';

const SUPERADMIN_ONLY_VIEWS = new Set([
  'admins',
  'plans',
  'boards',
  'revenue',
  'fleet-health',
]);
const REMOVED_SUPERADMIN_VIEWS = new Set(['activity', 'access', 'oversight']);

function useAppBase() {
  const { session } = useAuth();
  return session?.isDemo ? '/demo/admin' : '/app';
}

/** First segment after /app or /demo/admin — never trust deep nested junk paths */
function useActiveView(base) {
  const location = useLocation();
  const rest = location.pathname.startsWith(base)
    ? location.pathname.slice(base.length)
    : location.pathname;
  const seg = rest.split('/').filter(Boolean)[0];
  return seg || 'dashboard';
}

function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const { isSuperadmin } = useAuth();
  const { loading, busy, setLivePolling } = useData();
  const base = useAppBase();
  const view = useActiveView(base);

  // Only poll /devices/live on screens that show live KPIs / maps
  useEffect(() => {
    const needsLive = view === 'dashboard' || view === 'sensors' || view === 'fleet-health';
    setLivePolling(!!needsLive);
    return () => setLivePolling(false);
  }, [view, setLivePolling]);

  useEffect(() => {
    // Collapse corrupted nested URLs like /app/assign/assign/dashboard/...
    const rest = locationPathAfterBase(window.location.pathname, base);
    const segments = rest.split('/').filter(Boolean);
    if (segments.length > 1) {
      const first = segments[0];
      const known = new Set([
        'dashboard',
        'sensors',
        'users',
        'alerts',
        'automations',
        'assign',
        'revenue',
        'fleet-health',
        'plans',
        'boards',
        'admins',
      ]);
      if (known.has(first)) {
        navigate(`${base}/${first}${window.location.search || ''}`, { replace: true });
        return;
      }
      navigate(`${base}/dashboard`, { replace: true });
      return;
    }

    if (
      (SUPERADMIN_ONLY_VIEWS.has(view) && !isSuperadmin) ||
      REMOVED_SUPERADMIN_VIEWS.has(view)
    ) {
      navigate(`${base}/dashboard`, { replace: true });
    }
  }, [view, isSuperadmin, navigate, base]);

  function goTo(nextView, preset) {
    if (nextView === 'assign' && preset) {
      navigate(`${base}/assign?preset=${encodeURIComponent(preset)}`);
    } else {
      navigate(`${base}/${nextView}`);
    }
  }

  const showInitialLoader = loading;

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={goTo}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="main">
        <DemoBanner />
        <Topbar view={view} onMenuClick={() => setMobileNavOpen(true)} />
        <div className="content">
          {showInitialLoader ? (
            <PageLoader label="Loading fleet data…" />
          ) : (
            <Outlet context={{ goTo, base }} />
          )}
        </div>
      </div>
      <GlobalBusyOverlay active={busy} label="Updating…" />
    </div>
  );
}

function locationPathAfterBase(pathname, base) {
  if (pathname.startsWith(base)) return pathname.slice(base.length);
  return pathname;
}

function AdminAutomationsRoute() {
  const { automations } = useData();
  return <UserAutomationsView isAdmin myAutomations={automations || []} />;
}

function SensorsRoute() {
  const { goTo } = useOutletContext();
  return <SensorsView onNavigate={goTo} />;
}

function AssignRoute() {
  const navigate = useNavigate();
  const base = useAppBase();
  const [searchParams] = useSearchParams();
  return (
    <AssignView
      presetQuery={searchParams.get('preset')}
      onConsumePreset={() => navigate(`${base}/assign`, { replace: true })}
    />
  );
}

function RequireSuperadmin({ children }) {
  const base = useAppBase();
  const { isSuperadmin } = useAuth();
  if (!isSuperadmin) return <Navigate to={`${base}/dashboard`} replace />;
  return children;
}

function RequireAdminOperations({ children }) {
  const base = useAppBase();
  const { isSuperadmin } = useAuth();
  if (isSuperadmin) return <Navigate to={`${base}/dashboard`} replace />;
  return children;
}

function AbsoluteRedirect({ to }) {
  const base = useAppBase();
  return <Navigate to={`${base}/${to}`} replace />;
}

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AbsoluteRedirect to="dashboard" />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="sensors" element={<SensorsRoute />} />
        <Route path="users" element={<UsersView />} />
        <Route path="alerts" element={<AdminAlertsView />} />
        <Route path="automations" element={<AdminAutomationsRoute />} />
        <Route
          path="assign"
          element={
            <RequireAdminOperations>
              <AssignRoute />
            </RequireAdminOperations>
          }
        />
        <Route
          path="revenue"
          element={
            <RequireSuperadmin>
              <RevenueBusinessView />
            </RequireSuperadmin>
          }
        />
        <Route
          path="fleet-health"
          element={
            <RequireSuperadmin>
              <FleetHealthView />
            </RequireSuperadmin>
          }
        />
        <Route path="plans" element={<SubscriptionPlansView />} />
        <Route
          path="boards"
          element={
            <RequireSuperadmin>
              <BoardsView />
            </RequireSuperadmin>
          }
        />
        <Route
          path="admins"
          element={
            <RequireSuperadmin>
              <SuperAdminAdminsView />
            </RequireSuperadmin>
          }
        />
        {/* Catch nested garbage paths and send to dashboard once */}
        <Route path="*" element={<AbsoluteRedirect to="dashboard" />} />
      </Route>
    </Routes>
  );
}