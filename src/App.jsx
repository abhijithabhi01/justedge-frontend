import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Icons from './components/Icons.jsx';
import AdminApp from './AdminApp.jsx';
import UserApp from './UserApp.jsx';
import LoginPage from './views/LoginPage.jsx';
import LandingPage from './views/LandingPage.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Signed-in users shouldn't see the marketing landing page — send them
// straight into the app instead.
function LandingRoute() {
  const { session } = useAuth();
  const navigate = useNavigate();
  if (session) return <Navigate to="/app" replace />;
  return <LandingPage onEnter={() => navigate('/login')} />;
}

// Same idea for the login screen: already-signed-in users skip it, and
// "back" from here returns to the landing page instead of a dead end.
function LoginRoute() {
  const { session } = useAuth();
  const navigate = useNavigate();
  if (session) return <Navigate to="/app" replace />;
  return <LoginPage onBack={() => navigate('/')} />;
}

// The protected app shell. No session (including right after a logout,
// since this re-evaluates whenever the auth context changes) bounces back
// to /login automatically.
function AppRoute() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.type === 'admin') return <AdminApp />;
  return <UserApp userId={session.userId} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/app/*" element={<AppRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <DataProvider>
            <Icons />
            <AppRoutes />
          </DataProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}