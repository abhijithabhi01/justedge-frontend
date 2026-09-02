import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getMeAPI, loginAPI, logoutAPI } from '../api/allAPIs.js';
import { setAuthToken } from '../api/client.js';

const AUTH_KEY = 'justedge-session-v2';
const AuthContext = createContext(null);

function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    if (session) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      setAuthToken(session.isDemo ? null : session.token);
    } else {
      localStorage.removeItem(AUTH_KEY);
      setAuthToken(null);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.token) return undefined;
    if (session.isDemo) return undefined;

    let cancelled = false;

    getMeAPI(session.token)
      .then((data) => {
        if (cancelled) return;
        const account = data.admin || data.user;
        const type = data.admin ? 'admin' : 'user';
        if (!account) {
          setSession(null);
          return;
        }
        setSession((current) => {
          if (!current || current.token !== session.token) return current;
          return {
            ...current,
            type,
            name: account.name,
            role: account.role,
            account,
            ...(type === 'admin'
              ? { adminId: account.id, userId: undefined }
              : { userId: account.id, adminId: undefined }),
          };
        });
      })
      .catch((err) => {
        if (!cancelled && (err.status === 401 || err.status === 403)) {
          setSession(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  async function login(email, password) {
    const data = await loginAPI({
      email: email.trim(),
      password,
    });

    let nextSession;
    if (data.admin) {
      nextSession = {
        type: 'admin',
        token: data.token,
        adminId: data.admin.id,
        name: data.admin.name,
        role: data.admin.role,
        account: data.admin,
      };
    } else if (data.user) {
      nextSession = {
        type: 'user',
        token: data.token,
        userId: data.user.id,
        name: data.user.name,
        role: data.user.role,
        account: data.user,
      };
    } else {
      throw new Error('Login response did not contain an account');
    }

    setAuthToken(nextSession.token);
    setSession(nextSession);
    return nextSession;
  }

  function logout() {
    const token = session?.token;
    if (token && !session?.isDemo) {
      logoutAPI(token).catch(() => {});
    }
    setAuthToken(null);
    setSession(null);
  }

  function loginDemo(type) {
    if (type === 'admin') {
      const next = {
        type: 'admin',
        isDemo: true,
        token: 'demo-admin',
        adminId: 'demo-admin-1',
        name: 'Demo Admin',
        role: 'Admin',
        account: {
          id: 'demo-admin-1',
          name: 'Demo Admin',
          email: 'demo.admin@justedge.io',
          role: 'Admin',
          status: 'active',
          companyName: 'Just Embedded Demo',
        },
      };
      setAuthToken(null);
      setSession(next);
      return next;
    }

    const next = {
      type: 'user',
      isDemo: true,
      token: 'demo-user',
      userId: 'demo-user-1',
      name: 'Demo User',
      role: 'User',
      account: {
        id: 'demo-user-1',
        name: 'Demo User',
        email: 'demo.user@justedge.io',
        role: 'User',
        status: 'active',
        permissions: {
          monitorSensors: true,
          exportData: true,
        },
      },
    };
    setAuthToken(null);
    setSession(next);
    return next;
  }

  const isSuperadmin =
    session?.type === 'admin' && session?.role === 'Superadmin';

  return (
    <AuthContext.Provider
      value={{ session, login, loginDemo, logout, isSuperadmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}