import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import DashboardView from './views/DashboardView.jsx';
import SensorsView from './views/SensorsView.jsx';
import UsersView from './views/UsersView.jsx';
import AssignView from './views/AssignView.jsx';
import BoardsView from './views/BoardsView.jsx';
import SuperAdminAdminsView from './views/SuperAdminAdminsView.jsx';
import { useAuth } from './context/AuthContext.jsx';

const SUPERADMIN_ONLY_VIEWS = new Set(['boards', 'admins']);
const REMOVED_SUPERADMIN_VIEWS = new Set(['activity', 'access', 'oversight']);

// Persistent sidebar/topbar shell — only the routed view underneath (via
// <Outlet/>) swaps, so the sidebar and any open dialogs don't remount on
// every navigation the way they would if each view were its own top-level
// route element.
function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperadmin } = useAuth();

  const view = location.pathname.split('/')[2] || 'dashboard';

  // A stale or unauthorized deep link — role change, pasted URL, an old
  // bookmark from before a demotion — always bounces to the dashboard.
  useEffect(() => {
    if ((SUPERADMIN_ONLY_VIEWS.has(view) && !isSuperadmin) || REMOVED_SUPERADMIN_VIEWS.has(view)) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [view, isSuperadmin, navigate]);

  function goTo(nextView, preset) {
    if (nextView === 'assign' && preset) navigate(`/app/assign?preset=${preset}`);
    else navigate(`/app/${nextView}`);
  }

  return (
    <div className="app">
      <Sidebar view={view} onNavigate={goTo} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="main">
        <Topbar view={view} onMenuClick={() => setMobileNavOpen(true)} />
        <div className="content">
          <Outlet context={{ goTo }} />
        </div>
      </div>
    </div>
  );
}

function SensorsRoute() {
  const { goTo } = useOutletContext();
  return <SensorsView onNavigate={goTo} />;
}

function AssignRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return (
    <AssignView
      presetQuery={searchParams.get('preset')}
      onConsumePreset={() => navigate('/app/assign', { replace: true })}
    />
  );
}

// Belt-and-suspenders guard on top of the layout-level redirect above —
// keeps each superadmin view safe even if it's ever rendered outside
// AdminLayout in the future.
function RequireSuperadmin({ children }) {
  const { isSuperadmin } = useAuth();
  if (!isSuperadmin) return <Navigate to="/app/dashboard" replace />;
  return children;
}

function RequireAdminOperations({ children }) {
  const { isSuperadmin } = useAuth();
  if (isSuperadmin) return <Navigate to="/app/dashboard" replace />;
  return children;
}

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="sensors" element={<RequireAdminOperations><SensorsRoute /></RequireAdminOperations>} />
        <Route path="users" element={<RequireAdminOperations><UsersView /></RequireAdminOperations>} />
        <Route path="assign" element={<RequireAdminOperations><AssignRoute /></RequireAdminOperations>} />
        <Route path="boards" element={<RequireSuperadmin><BoardsView /></RequireSuperadmin>} />
        <Route path="admins" element={<RequireSuperadmin><SuperAdminAdminsView /></RequireSuperadmin>} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
