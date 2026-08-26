import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiRequest } from '../api/client.js';

const AUTH_KEY = 'justedge-session-v2';

const AuthContext = createContext(null);


function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}


export function AuthProvider({ children }) {

  const [session, setSession] =
    useState(loadSession);


  useEffect(() => {

    if (session) {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem(AUTH_KEY);
    }

  }, [session]);


  useEffect(() => {

    if (!session?.token) return undefined;

    let cancelled = false;

    apiRequest('/api/auth/me', { token: session.token })
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

    const data = await apiRequest(
      '/api/auth/login',
      {
        method: 'POST',

        body: {
          email: email.trim(),
          password,
        },
      }
    );


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

      throw new Error(
        'Login response did not contain an account'
      );
    }


    setSession(nextSession);

    return nextSession;
  }


  function logout() {

    const token = session?.token;

    if (token) {
      apiRequest(
        '/api/auth/logout',
        {
          method: 'POST',
          token,
        }
      ).catch(() => {});
    }

    setSession(null);
  }


  const isSuperadmin =
    session?.type === 'admin' &&
    session?.role === 'Superadmin';


  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isSuperadmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  const ctx =
    useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return ctx;
}