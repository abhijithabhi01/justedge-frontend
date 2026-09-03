import React, { useEffect, useState } from 'react';
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

function LandingRoute() {
  const { session } = useAuth();
  const navigate = useNavigate();
  if (session && !session.isDemo) return <Navigate to="/app" replace />;
  return (
    <LandingPage
      onEnter={() => navigate('/login')}
      onDemo={() => navigate('/demo/admin')}
    />
  );
}

function LoginRoute() {
  const { session } = useAuth();
  const navigate = useNavigate();
  if (session && !session.isDemo) return <Navigate to="/app" replace />;
  return <LoginPage onBack={() => navigate('/')} />;
}

function AppRoute() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (session.isDemo) {
    return (
      <Navigate
        to={session.type === 'admin' ? '/demo/admin' : '/demo/user'}
        replace
      />
    );
  }
  if (session.type === 'admin') return <AdminApp />;
  return <UserApp userId={session.userId} />;
}

function DemoAdminRoute() {
  const { session, loginDemo } = useAuth();

  useEffect(() => {
    loginDemo('admin');
  }, [loginDemo]);

  if (!session?.isDemo || session.type !== 'admin') {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        Loading demo…
      </div>
    );
  }
  return <AdminApp />;
}

function DemoUserRoute() {
  const { session, loginDemo } = useAuth();

  useEffect(() => {
    loginDemo('user');
  }, [loginDemo]);

  if (!session?.isDemo || session.type !== 'user') {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        Loading demo…
      </div>
    );
  }
  return <UserApp userId={session.userId} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/demo" element={<Navigate to="/demo/admin" replace />} />
      <Route path="/demo/admin/*" element={<DemoAdminRoute />} />
      <Route path="/demo/user/*" element={<DemoUserRoute />} />
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