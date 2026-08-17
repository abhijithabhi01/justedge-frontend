import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { apiRequest } from '../api/client.js';

import {
  defaultPermissionsForRole,
  defaultAdminPermissionsForRole,
} from '../lib/helpers.js';

import { useAuth } from './AuthContext.jsx';


const DataContext =
  createContext(null);


const EMPTY_STATE = {
  sensors: [],
  users: [],
  alerts: [],
  automations: [],
  adminAccounts: [],
  activityLogs: [],
  securityFlags: [],
  boardCatalog: [],
  subscriptionPlans: [],
  subscriptions: [],
  accessControl: {
    roles: [],
    matrix: {},
  },
};


function normalizeSensor(device, live = null) {

  const telemetry =
    live?.sensors || [];


  const findValue = (key) =>
    telemetry.find(
      (x) => x.key === key
    )?.value;


  const temp =
    findValue('temp_c');

  const hum =
    findValue('humidity_pct');


  return {
    id: device.id,

    name: device.name,

    boardId: device.boardId,

    imei: device.imei,

    simNo: device.simNo || '',

    subscriptionPlan:
      device.subscriptionPlan || '',

    subscriptionExpiry:
      device.subscriptionExpiry || '',

    assignedUserId:
      device.assignedUserId || null,


    // Live values supplied by /live
    temp:
      temp ?? null,

    hum:
      hum ?? null,

    battery:
      live?.battery ?? null,

    status:
      live?.status || 'unknown',

    lastPing:
      live?.lastPing || null,


    // These fields do not currently exist
    // in the backend DB/API.
    signal: null,

    fw: null,

    mac: null,

    base:
      temp ?? null,

    amp: null,

    source:
      live?.source || null,

    telemetry:
      telemetry,

    relays:
      live?.relays || [],

    serverTime:
      live?.serverTime || null,
  };
}


function normalizeUser(user) {

  return {
    ...user,

    id:
      user.id || user._id,

    // Older MongoDB records created before the User role was added may not
    // have this field. The server model's default role is User.
    role:
      user.role || 'User',

    permissions:
      user.permissions ||
      defaultPermissionsForRole(
        user.role
      ),
  };
}


function normalizeAdmin(admin) {

  return {
    ...admin,

    id:
      admin.id || admin._id,

    permissions:
      admin.permissions ||
      defaultAdminPermissionsForRole(
        admin.role
      ),
  };
}


function normalizeAlert(alert) {

  return {
    ...alert,

    id:
      alert.id || alert._id,

    owner:
      alert.owner ||
      alert.ownerId ||
      null,

    time:
      alert.time ||
      alert.createdAt ||
      null,
  };
}


function normalizeAutomation(auto) {

  return {
    ...auto,

    id:
      auto.id || auto._id,

    owner:
      auto.owner ||
      auto.ownerId ||
      null,

    lastRun:
      auto.lastRun ||
      null,
  };
}


export function DataProvider({ children }) {

  const { session } =
    useAuth();


  const [state, setState] =
    useState(EMPTY_STATE);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState(null);


  const token =
    session?.token;


  const loadData = useCallback(
    async () => {

      if (!token) {
        await loadPublicData();
        return;
      }


      setLoading(true);
      setError(null);


      try {

        if (session.type === 'admin') {

          await loadAdminData();

        } else {

          await loadUserData();

        }

      } catch (err) {

        console.error(
          '[DataContext]',
          err
        );

        setError(err.message);

      } finally {

        setLoading(false);

      }

    },
    [
      token,
      session?.type,
      session?.role,
      session?.adminId,
      session?.userId,
    ]
  );


  async function loadPublicData() {

    setLoading(true);
    setError(null);

    try {
      const boardRes = await apiRequest('/api/board-catalog');

      setState({
        ...EMPTY_STATE,
        boardCatalog: boardRes.boards || [],
      });
    } catch (err) {
      console.error('[DataContext]', err);
      setError(err.message);
      setState(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }


  async function loadAdminData() {

    const [
      boardRes,
      userRes,
      deviceRes,
      liveRes,
      alertRes,
      automationRes,
      planRes,
      subscriptionRes,
    ] = await Promise.all([

      apiRequest(
        '/api/board-catalog'
      ),

      apiRequest(
        '/api/users',
        { token }
      ),

      apiRequest(
        '/api/devices',
        { token }
      ),

      apiRequest(
        '/api/devices/live',
        { token }
      ),

      apiRequest(
        '/api/alerts',
        { token }
      ),

      apiRequest(
        '/api/automations',
        { token }
      ),

      apiRequest(
        '/api/billing/plans',
        { token }
      ),

      apiRequest(
        '/api/billing/subscriptions',
        { token }
      ),
    ]);


    const liveMap =
      new Map(
        (liveRes.devices || [])
          .map(
            (d) => [
              String(d.id),
              d,
            ]
          )
      );


    const sensors =
      (deviceRes.devices || [])
        .map(
          (device) =>
            normalizeSensor(
              device,
              liveMap.get(
                String(device.id)
              )
            )
        );


    let adminAccounts = [];
    let activityLogs = [];
    let securityFlags = [];
    let accessControl = EMPTY_STATE.accessControl;


    if (
      session.role === 'Superadmin'
    ) {

      const [
        adminsRes,
        logsRes,
        flagsRes,
        accessRes,
      ] = await Promise.all([

        apiRequest(
          '/api/admins',
          { token }
        ),

        apiRequest(
          '/api/activity-logs',
          { token }
        ),

        apiRequest(
          '/api/oversight/flags',
          { token }
        ),

        apiRequest(
          '/api/access-control/roles',
          { token }
        ),
      ]);


      adminAccounts =
        (adminsRes.admins || [])
          .map(normalizeAdmin);


      activityLogs =
        logsRes.logs || [];


      securityFlags =
        flagsRes.flags || [];

      accessControl = {
        roles: accessRes.roles || [],
        matrix: accessRes.matrix || {},
      };
    }


    setState({

      sensors,

      users:
        (userRes.users || [])
          .map(normalizeUser),

      alerts:
        (alertRes.alerts || [])
          .map(normalizeAlert),

      automations:
        (automationRes.automations || [])
          .map(normalizeAutomation),

      adminAccounts,

      activityLogs,

      securityFlags,

      boardCatalog:
        boardRes.boards || [],

      subscriptionPlans:
        planRes.plans || [],

      subscriptions:
        subscriptionRes.subscriptions || [],

      accessControl,
    });
  }


  async function loadUserData() {

    const [
      meRes,
      deviceRes,
      liveRes,
      alertRes,
      automationRes,
      planRes,
    ] = await Promise.all([

      apiRequest(
        '/api/auth/me',
        { token }
      ),

      apiRequest(
        '/api/devices/mine',
        { token }
      ),

      apiRequest(
        '/api/devices/mine/live',
        { token }
      ),

      apiRequest(
        '/api/alerts',
        { token }
      ),

      apiRequest(
        '/api/automations',
        { token }
      ),

      apiRequest(
        '/api/billing/plans',
        { token }
      ),
    ]);


    const liveMap =
      new Map(
        (liveRes.devices || [])
          .map(
            (d) => [
              String(d.id),
              d,
            ]
          )
      );


    const sensors =
      (deviceRes.devices || [])
        .map(
          (device) =>
            normalizeSensor(
              device,
              liveMap.get(
                String(device.id)
              )
            )
        );


    const user =
      meRes.user;


    setState({

      sensors,

      users:
        user
          ? [normalizeUser(user)]
          : [],

      alerts:
        (alertRes.alerts || [])
          .map(normalizeAlert),

      automations:
        (automationRes.automations || [])
          .map(normalizeAutomation),

      adminAccounts: [],

      activityLogs: [],

      securityFlags: [],

      boardCatalog: [],

      subscriptionPlans:
        planRes.plans || [],

      subscriptions: [],

      accessControl: EMPTY_STATE.accessControl,
    });
  }


  useEffect(() => {

    loadData();

  }, [loadData]);


  // ─────────────────────────────────────────────
  // Sensors
  // ─────────────────────────────────────────────

  const addSensor =
    useCallback(
      async (sensor) => {

        const data =
          await apiRequest(
            '/api/devices',
            {
              method: 'POST',
              token,

              body: {
                name: sensor.name,
                boardId: sensor.boardId,
                imei: sensor.imei,
                simNo: sensor.simNo,
                subscriptionPlan:
                  sensor.subscriptionPlan,
                assignedUserId:
                  sensor.assignedUserId,
              },
            }
          );


        await loadData();

        return data.device;
      },
      [token]
    );


  const updateSensor =
    useCallback(
      async (id, patch) => {

        await apiRequest(
          `/api/devices/${id}`,
          {
            method: 'PATCH',
            token,

            body: {
              name: patch.name,
              imei: patch.imei,
              simNo: patch.simNo,
              subscriptionPlan:
                patch.subscriptionPlan,
            },
          }
        );


        await loadData();
      },
      [token]
    );


  const removeSensor =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/devices/${id}`,
          {
            method: 'DELETE',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  const reassignSensor =
    useCallback(
      async (sensorId, userId) => {

        await apiRequest(
          `/api/devices/${sensorId}/assign`,
          {
            method: 'PATCH',
            token,

            body: {
              assignedUserId:
                userId || null,
            },
          }
        );


        await loadData();
      },
      [token]
    );


  // ─────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────

  const addUser =
    useCallback(
      async (user) => {

        const data =
          await apiRequest(
            '/api/users',
            {
              method: 'POST',
              token,

              body: {
                name: user.name,
                email: user.email,
                phone: user.phone,
              },
            }
          );


        await loadData();

        return { user: data.user, tempPassword: data.tempPassword };
      },
      [token]
    );


  const updateUser =
    useCallback(
      async (id, patch) => {

        if (
          patch.name !== undefined ||
          patch.email !== undefined ||
          patch.phone !== undefined
        ) {

          await apiRequest(
            `/api/users/${id}`,
            {
              method: 'PATCH',
              token,

              body: {
                name: patch.name,
                email: patch.email,
                phone: patch.phone,
              },
            }
          );
        }


        if (
          patch.status !== undefined
        ) {

          await apiRequest(
            `/api/users/${id}/status`,
            {
              method: 'PATCH',
              token,

              body: {
                status: patch.status,
              },
            }
          );
        }


        await loadData();
      },
      [token]
    );


  const removeUser =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/users/${id}`,
          {
            method: 'DELETE',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  const toggleUserStatus =
    useCallback(
      async (id) => {

        const user =
          state.users.find(
            (u) => String(u.id) === String(id)
          );


        if (!user) return;


        const nextStatus =
          user.status === 'active'
            ? 'suspended'
            : 'active';


        await apiRequest(
          `/api/users/${id}/status`,
          {
            method: 'PATCH',
            token,

            body: {
              status: nextStatus,
            },
          }
        );


        await loadData();
      },
      [
        token,
        state.users,
      ]
    );


  const togglePermission =
    useCallback(
      async (userId, key) => {

        const user =
          state.users.find(
            (u) =>
              String(u.id) ===
              String(userId)
          );


        if (!user) return;


        await apiRequest(
          `/api/users/${userId}/permissions`,
          {
            method: 'PATCH',
            token,

            body: {
              key,

              value:
                !user.permissions?.[key],
            },
          }
        );


        await loadData();
      },
      [
        token,
        state.users,
      ]
    );


  // ─────────────────────────────────────────────
  // Alerts
  // ─────────────────────────────────────────────

  const resolveAlert =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/alerts/${id}/resolve`,
          {
            method: 'PATCH',
            token,
          }
        );

        await loadData();
      },
      [token]
    );


  const dismissAlert =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/alerts/${id}`,
          {
            method: 'DELETE',
            token,
          }
        );

        await loadData();
      },
      [token]
    );


  const snoozeAlert =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/alerts/${id}/snooze`,
          {
            method: 'PATCH',
            token,

            body: {
              until:
                new Date(
                  Date.now() +
                  60 * 60 * 1000
                ).toISOString(),
            },
          }
        );

        await loadData();
      },
      [token]
    );


  // ─────────────────────────────────────────────
  // Automations
  // ─────────────────────────────────────────────

  const addAutomation =
    useCallback(
      async (automation) => {

        await apiRequest(
          '/api/automations',
          {
            method: 'POST',
            token,

            body: {
              name: automation.name,
              rule: automation.rule,
              deviceId:
                automation.deviceId || '',
            },
          }
        );


        await loadData();
      },
      [token]
    );


  const toggleAutomation =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/automations/${id}/toggle`,
          {
            method: 'PATCH',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  const removeAutomation =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/automations/${id}`,
          {
            method: 'DELETE',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  // ─────────────────────────────────────────────
  // Admin accounts
  // ─────────────────────────────────────────────

  const addAdmin =
    useCallback(
      async (admin) => {

        const data =
          await apiRequest(
            '/api/admins',
            {
              method: 'POST',
              token,

              body: {
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                companyName: admin.companyName,
                twoFactor:
                  !!admin.twoFactor,

                // Omit when not explicitly set so the backend falls back to
                // its own default (emailLocalPart + "123") rather than a
                // fixed password shared by every admin.
                ...(admin.tempPassword ? { tempPassword: admin.tempPassword } : {}),
              },
            }
          );


        await loadData();

        return { admin: data.admin, tempPassword: data.tempPassword };
      },
      [token]
    );


  const updateAdmin =
    useCallback(
      async (id, patch) => {

        await apiRequest(
          `/api/admins/${id}`,
          {
            method: 'PATCH',
            token,

            body: {
              name: patch.name,
              email: patch.email,
              phone: patch.phone,
              companyName: patch.companyName,
              status: patch.status,
              twoFactor:
                patch.twoFactor,
            },
          }
        );


        await loadData();
      },
      [token]
    );


  const removeAdmin =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/admins/${id}`,
          {
            method: 'DELETE',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  const toggleAdminStatus =
    useCallback(
      async (id) => {

        const admin =
          state.adminAccounts.find(
            (a) =>
              String(a.id) ===
              String(id)
          );


        if (!admin) return;


        const status =
          admin.status === 'suspended'
            ? 'active'
            : 'suspended';


        await apiRequest(
          `/api/admins/${id}/status`,
          {
            method: 'PATCH',
            token,

            body: {
              status,
            },
          }
        );


        await loadData();
      },
      [
        token,
        state.adminAccounts,
      ]
    );


  const toggleAdminPermission =
    useCallback(
      async (adminId, key) => {

        const admin =
          state.adminAccounts.find(
            (a) =>
              String(a.id) ===
              String(adminId)
          );


        if (!admin) return;


        await apiRequest(
          `/api/admins/${adminId}/permissions`,
          {
            method: 'PATCH',
            token,

            body: {
              key,

              value:
                !admin.permissions?.[key],
            },
          }
        );


        await loadData();
      },
      [
        token,
        state.adminAccounts,
      ]
    );


  // ─────────────────────────────────────────────
  // Oversight
  // ─────────────────────────────────────────────

  const resolveSecurityFlag =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/oversight/flags/${id}/resolve`,
          {
            method: 'PATCH',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  const reopenSecurityFlag =
    useCallback(
      async (id) => {

        await apiRequest(
          `/api/oversight/flags/${id}/reopen`,
          {
            method: 'PATCH',
            token,
          }
        );


        await loadData();
      },
      [token]
    );


  const addBoard =
    useCallback(
      async (board) => {
        await apiRequest('/api/board-catalog', {
          method: 'POST',
          token,
          body: board,
        });

        await loadData();
      },
      [token, loadData]
    );


  const updateBoard =
    useCallback(
      async (id, board) => {
        await apiRequest(`/api/board-catalog/${id}`, {
          method: 'PATCH',
          token,
          body: board,
        });

        await loadData();
      },
      [token, loadData]
    );


  const removeBoard =
    useCallback(
      async (id) => {
        await apiRequest(`/api/board-catalog/${id}`, {
          method: 'DELETE',
          token,
        });

        await loadData();
      },
      [token, loadData]
    );


  const value = {

    ...state,

    loading,

    error,

    refresh:
      loadData,


    addSensor,
    updateSensor,
    removeSensor,
    reassignSensor,

    addUser,
    updateUser,
    removeUser,
    toggleUserStatus,
    togglePermission,

    resolveAlert,
    dismissAlert,
    snoozeAlert,

    addAutomation,
    toggleAutomation,
    removeAutomation,

    addAdmin,
    updateAdmin,
    removeAdmin,
    toggleAdminStatus,
    toggleAdminPermission,

    resolveSecurityFlag,
    reopenSecurityFlag,

    addBoard,
    updateBoard,
    removeBoard,
  };


  return (
    <DataContext.Provider
      value={value}
    >
      {children}
    </DataContext.Provider>
  );
}


export function useData() {

  const ctx =
    useContext(DataContext);

  if (!ctx) {
    throw new Error(
      'useData must be used within a DataProvider'
    );
  }

  return ctx;
}