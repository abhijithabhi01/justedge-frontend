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
import { useData } from './context/DataContext.jsx';
import { PageLoader } from './components/Spinner.jsx';
import DemoTutorial from './components/DemoTutorial.jsx';
import DemoBanner from './components/DemoBanner.jsx';

const SUPERADMIN_ONLY_VIEWS = new Set(['admins']);
const REMOVED_SUPERADMIN_VIEWS = new Set(['activity', 'access', 'oversight']);

function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperadmin } = useAuth();
  const { loading } = useData();

  const view = location.pathname.split('/')[2] || 'dashboard';

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
      <DemoTutorial />
      <Sidebar view={view} onNavigate={goTo} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="main">
        <Topbar view={view} onMenuClick={() => setMobileNavOpen(true)} />
        <div className="content">
          {loading ? <PageLoader label="Loading fleet data…" /> : <Outlet context={{ goTo }} />}
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
  <>  <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="sensors" element={<SensorsRoute />} />
        <Route path="users" element={<UsersView />} />
        <Route path="assign" element={<RequireAdminOperations><AssignRoute /></RequireAdminOperations>} />
        <Route path="boards" element={<RequireSuperadmin><BoardsView /></RequireSuperadmin>} />
        <Route path="admins" element={<RequireSuperadmin><SuperAdminAdminsView /></RequireSuperadmin>} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
        
      </Route>
    </Routes>
            <DemoBanner />
<DemoTutorial />
    </>
  );
}