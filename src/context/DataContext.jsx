import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  getBoardCatalogAPI,
  getIotBoardsAPI,
  getUsersAPI,
  getDevicesAPI,
  getDevicesLiveAPI,
  getMyDevicesAPI,
  getMyDevicesLiveAPI,
  createDeviceAPI,
  updateDeviceAPI,
  deleteDeviceAPI,
  assignDeviceAPI,
  createUserAPI,
  updateUserAPI,
  updateUserStatusAPI,
  updateUserPermissionsAPI,
  deleteUserAPI,
  getAlertsAPI,
  resolveAlertAPI,
  snoozeAlertAPI,
  deleteAlertAPI,
  getAutomationsAPI,
  createAutomationAPI,
  toggleAutomationAPI,
  deleteAutomationAPI,
  getBillingPlansAPI,
  getBillingSubscriptionsAPI,
  createBillingPlanAPI,
  updateBillingPlanAPI,
  getAdminsAPI,
  createAdminAPI,
  updateAdminAPI,
  updateAdminStatusAPI,
  updateAdminPermissionsAPI,
  deleteAdminAPI,
  getActivityLogsAPI,
  getOversightFlagsAPI,
  resolveOversightFlagAPI,
  reopenOversightFlagAPI,
  getAccessControlRolesAPI,
  getMeAPI,
  createBoardCatalogAPI,
  updateBoardCatalogAPI,
  deleteBoardCatalogAPI,
} from '../api/allAPIs.js';

import {
  defaultPermissionsForRole,
  defaultAdminPermissionsForRole,
} from '../lib/helpers.js';

import { useAuth } from './AuthContext.jsx';

import { getDemoLiveAPI } from '../api/allAPIs.js'; // with your other API imports
import * as DemoMock from '../demo/mockData.js';
const DEMO_ADMIN = DemoMock.DEMO_ADMIN;
const DEMO_USER = DemoMock.DEMO_USER;
const DEMO_SENSORS = DemoMock.DEMO_SENSORS || [];
const DEMO_ALERTS = DemoMock.DEMO_ALERTS || [];
const DEMO_AUTOMATIONS = DemoMock.DEMO_AUTOMATIONS || [];
const DEMO_ACTIVITY = DemoMock.DEMO_ACTIVITY || [];
const DEMO_BOARD_CATALOG = DemoMock.DEMO_BOARD_CATALOG || [];
const DEMO_SUBSCRIPTION_PLANS = DemoMock.DEMO_SUBSCRIPTION_PLANS || [
  { id: 'Pro', name: 'Pro', desc: 'Full fleet features' },
  { id: 'Basic', name: 'Basic', desc: 'Core monitoring' },
];
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
  awsBoards: [],
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

  // Generic helper — works for any sensor key regardless of source (AWS or
  // simulated). AWS boards surface temperature as 'temp_c', humidity as
  // 'humidity_pct', pressure as 'pressure_hpa', and an optional battery
  // percentage as 'battery_pct'. Simulated boards use the same keys so the
  // frontend never needs to branch on source.
  const findValue = (key) =>
    telemetry.find(
      (x) => x.key === key
    )?.value;

  const temp = findValue('temp_c');
  const hum = findValue('humidity_pct');
  const pressure = findValue('pressure_hpa');
  const light = findValue('light_lux');
  const co2 = findValue('co2_ppm');
  const vibration = findValue('vibration_g');

  // AWS boards may report a discrete battery sensor; fall back to the
  // top-level battery field from the simulated path.
  const battSensor = findValue('battery_pct');
  const battery = battSensor ?? live?.battery ?? null;
  const latitude =
    live?.latitude ?? findValue('latitude') ?? null;
  const longitude =
    live?.longitude ?? findValue('longitude') ?? null;

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

    awsDeviceId:
      device.awsDeviceId || null,

    // ── Live telemetry values ────────────────────────────────────────────────────
    temp,
    hum,
    pressure,
    light,
    co2,
    vibration,
    battery,
    latitude,
    longitude,

    status:
      live?.status || 'unknown',

    lastPing:
      live?.lastPing || null,

    // These fields do not currently exist in the backend DB/API.
    signal: null,
    fw: live?.fw ?? null,
    mac: null,

    // base/amp drive the SensorDetail sparkline chart.
    // For AWS sensors we fix amplitude to 0.5 since we don't yet have
    // historical data to derive it from.
    base: temp ?? null,
    amp: live?.source === 'aws' ? 0.5 : null,

    source:
      live?.source || null,

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

  // In-flight mutation counter — drives a global overlay without unmounting the page.
  const [busyCount, setBusyCount] = useState(0);
  const busy = busyCount > 0;

  const beginBusy = useCallback(() => {
    setBusyCount((c) => c + 1);
  }, []);
  const endBusy = useCallback(() => {
    setBusyCount((c) => Math.max(0, c - 1));
  }, []);

  const [error, setError] =
    useState(null);


  const token =
    session?.token;


  /**
   * @param {{ soft?: boolean }} [opts]
   * soft=true  → refresh data without flipping the full-page `loading` flag
   *              (used after mutations so the UI stays mounted).
   * soft=false → initial / login load; shows the centered content loader.
   */
  const loadData = useCallback(
    async (opts = {}) => {
      const soft = !!opts.soft;

      if (session?.isDemo) {
        if (!soft) setLoading(true);
        setError(null);
        try {
          setState({
            ...EMPTY_STATE,
            sensors: DEMO_SENSORS,
            users: [DEMO_USER],
            alerts: DEMO_ALERTS,
            automations: DEMO_AUTOMATIONS,
            adminAccounts: session.type === 'admin' ? [DEMO_ADMIN] : [],
            activityLogs: DEMO_ACTIVITY,
            boardCatalog: (DEMO_BOARD_CATALOG || []).map((b) => ({ ...b })),
            subscriptionPlans: (DEMO_SUBSCRIPTION_PLANS || []).map((p) => ({ ...p })),
            accessControl: { roles: ['Admin', 'User'], matrix: {} },
          });
        } finally {
          if (!soft) setLoading(false);
        }
        return;
      }
      if (!token) {
        await loadPublicData();
        return;
      }

      if (!soft) {
        setLoading(true);
        setError(null);
      }

      try {
        if (session.type === 'admin') {
          await loadAdminData();
        } else {
          await loadUserData();
        }
      } catch (err) {
        console.error('[DataContext]', err);
        setError(err.message);
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [
      token,
      session?.type,
      session?.role,
      session?.adminId,
      session?.userId,
      session?.isDemo,
    ]
  );

  /** Soft refresh + global busy overlay. Prefer this after any mutating API call. */
  const withBusyRefresh = useCallback(
    async (fn) => {
      beginBusy();
      try {
        const result = await fn();
        await loadData({ soft: true });
        return result;
      } finally {
        endBusy();
      }
    },
    [beginBusy, endBusy, loadData]
  );


  async function loadPublicData() {

    setLoading(true);
    setError(null);

    try {
      const boardRes = await getBoardCatalogAPI();

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
      awsBoardRes,
      userRes,
      deviceRes,
      liveRes,
      alertRes,
      automationRes,
      planRes,
      subscriptionRes,
    ] = await Promise.all([

      getBoardCatalogAPI(),

      getIotBoardsAPI(token),

      getUsersAPI(token),

      getDevicesAPI(token),

      getDevicesLiveAPI(token),

      getAlertsAPI(token),

      getAutomationsAPI(token),

      getBillingPlansAPI(token),

      getBillingSubscriptionsAPI(token),
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

        getAdminsAPI(token),

        getActivityLogsAPI(token),

        getOversightFlagsAPI(token),

        getAccessControlRolesAPI(token),
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

      awsBoards:
        awsBoardRes.boards || [],

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

      getMeAPI(token),

      getMyDevicesAPI(token),

      getMyDevicesLiveAPI(token),

      getAlertsAPI(token),

      getAutomationsAPI(token),

      getBillingPlansAPI(token),
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


  // Live telemetry (temp/battery/status/relays) changes every few seconds
  // server-side, but loadData() above only runs once per login and after
  // mutations. Poll the lightweight /live endpoints on their own timer and
  // merge just the live fields onto existing sensors — this must NOT call
  // loadData()/setLoading(), or every tick would re-fetch users/alerts/
  // automations too and flicker any open drawer/form.
  const refreshLive = useCallback(
    async () => {
      if (session?.isDemo) {
        try {
          const liveRes = await getDemoLiveAPI();
          const list = liveRes.sensors || [];
          if (!list.length) return;
          setState((prev) => ({
            ...prev,
            sensors: prev.sensors.map((s) => {
              const live =
                list.find(
                  (d) =>
                    String(d.id) === String(s.id) ||
                    String(d.deviceKey) === String(s.id)
                ) || null;
              if (!live) return s;
              return {
                ...s,
                status: live.status || s.status,
                temp: live.temp ?? s.temp,
                humidity: live.humidity ?? s.humidity,
                battery: live.battery ?? s.battery,
                lat: live.lat ?? s.lat,
                lng: live.lng ?? s.lng,
                location: live.location || s.location,
                lastSeen: live.updatedAt || new Date().toISOString(),
                lastPing: live.updatedAt || 'Just now',
              };
            }),
          }));
        } catch (err) {
          console.error('[DataContext] demo live refresh failed', err);
        }
        return;
      }
      if (!token) return;

      try {

        const liveRes = await (session?.type === 'admin'
          ? getDevicesLiveAPI(token)
          : getMyDevicesLiveAPI(token));

        const liveMap =
          new Map(
            (liveRes.devices || [])
              .map((d) => [String(d.id), d])
          );

        setState((prev) => ({
          ...prev,
          sensors: prev.sensors.map((s) => {
            const live = liveMap.get(String(s.id));
            return live ? normalizeSensor(s, live) : s;
          }),
        }));

      } catch (err) {

        console.error('[DataContext] live refresh failed', err);

      }

    },
    [token, session?.type]
  );

  useEffect(() => {

    if (!token) return;

    const id = setInterval(refreshLive, 5000);

    return () => clearInterval(id);

  }, [token, refreshLive]);


  useEffect(() => {
    if (!token && !session?.isDemo) return;
    const id = setInterval(refreshLive, 5000);
    return () => clearInterval(id);
  }, [token, session?.isDemo, refreshLive]);
  // ─────────────────────────────────────────────
  // Sensors
  // ─────────────────────────────────────────────

  const addSensor = useCallback(
    async (sensor) => {
      return withBusyRefresh(async () => {
        const data = await createDeviceAPI(sensor, token);
        return data.device;
      });
    },
    [token, withBusyRefresh]
  );

  const updateSensor = useCallback(
    async (id, patch) => {
      await withBusyRefresh(() => updateDeviceAPI(id, patch, token));
    },
    [token, withBusyRefresh]
  );

  const removeSensor = useCallback(
    async (id) => {
      await withBusyRefresh(() => deleteDeviceAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const reassignSensor = useCallback(
    async (sensorId, userId) => {
      await withBusyRefresh(() =>
        assignDeviceAPI(sensorId, { assignedUserId: userId }, token)
      );
    },
    [token, withBusyRefresh]
  );

  // ─────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────

  const addUser = useCallback(
    async (user) => {
      return withBusyRefresh(async () => {
        const data = await createUserAPI(user, token);
        return {
          user: data.user,
          tempPassword: data.tempPassword,
          emailSent: data.emailSent,
          emailError: data.emailError,
        };
      });
    },
    [token, withBusyRefresh]
  );

  const updateUser = useCallback(
    async (id, patch) => {
      await withBusyRefresh(async () => {
        if (
          patch.name !== undefined ||
          patch.email !== undefined ||
          patch.phone !== undefined
        ) {
          await updateUserAPI(
            id,
            {
              name: patch.name,
              email: patch.email,
              phone: patch.phone,
            },
            token
          );
        }
        if (patch.status !== undefined) {
          await updateUserStatusAPI(id, { status: patch.status }, token);
        }
      });
    },
    [token, withBusyRefresh]
  );

  const removeUser = useCallback(
    async (id) => {
      await withBusyRefresh(() => deleteUserAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const toggleUserStatus = useCallback(
    async (id) => {
      const user = state.users.find((u) => String(u.id) === String(id));
      if (!user) return;

      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      // Optimistic UI update so the card flips immediately
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          String(u.id) === String(id) ? { ...u, status: nextStatus } : u
        ),
      }));
      await withBusyRefresh(() =>
        updateUserStatusAPI(id, { status: nextStatus }, token)
      );
    },
    [token, state.users, withBusyRefresh]
  );

  const togglePermission = useCallback(
    async (userId, key) => {
      const user = state.users.find((u) => String(u.id) === String(userId));
      if (!user) return;

      const nextValue = !user.permissions?.[key];
      // Optimistic UI — switch flips instantly, no full-page blank
      setState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          String(u.id) === String(userId)
            ? {
                ...u,
                permissions: { ...(u.permissions || {}), [key]: nextValue },
              }
            : u
        ),
      }));
      await withBusyRefresh(() =>
        updateUserPermissionsAPI(userId, { key, value: nextValue }, token)
      );
    },
    [token, state.users, withBusyRefresh]
  );

  // ─────────────────────────────────────────────
  // Alerts
  // ─────────────────────────────────────────────

  const resolveAlert = useCallback(
    async (id) => {
      await withBusyRefresh(() => resolveAlertAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const dismissAlert = useCallback(
    async (id) => {
      await withBusyRefresh(() => deleteAlertAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const snoozeAlert = useCallback(
    async (id) => {
      await withBusyRefresh(() => snoozeAlertAPI(id, { hours: 24 }, token));
    },
    [token, withBusyRefresh]
  );

  // ─────────────────────────────────────────────
  // Automations
  // ─────────────────────────────────────────────

  const addAutomation = useCallback(
    async (automation) => {
      await withBusyRefresh(() => createAutomationAPI(automation, token));
    },
    [token, withBusyRefresh]
  );

  const toggleAutomation = useCallback(
    async (id) => {
      await withBusyRefresh(() => toggleAutomationAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const removeAutomation = useCallback(
    async (id) => {
      await withBusyRefresh(() => deleteAutomationAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  // ─────────────────────────────────────────────
  // Admin accounts
  // ─────────────────────────────────────────────

  const addAdmin = useCallback(
    async (admin) => {
      return withBusyRefresh(async () => {
        const data = await createAdminAPI(admin, token);
        return {
          admin: data.admin,
          tempPassword: data.tempPassword,
          emailSent: data.emailSent,
          emailError: data.emailError,
        };
      });
    },
    [token, withBusyRefresh]
  );

  const updateAdmin = useCallback(
    async (id, patch) => {
      await withBusyRefresh(() => updateAdminAPI(id, patch, token));
    },
    [token, withBusyRefresh]
  );

  const removeAdmin = useCallback(
    async (id) => {
      await withBusyRefresh(() => deleteAdminAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const toggleAdminStatus = useCallback(
    async (id) => {
      const admin = state.adminAccounts.find(
        (a) => String(a.id) === String(id)
      );
      if (!admin) return;

      const status =
        admin.status === 'suspended' ? 'active' : 'suspended';
      setState((prev) => ({
        ...prev,
        adminAccounts: prev.adminAccounts.map((a) =>
          String(a.id) === String(id) ? { ...a, status } : a
        ),
      }));
      await withBusyRefresh(() => updateAdminStatusAPI(id, { status }, token));
    },
    [token, state.adminAccounts, withBusyRefresh]
  );

  const toggleAdminPermission = useCallback(
    async (adminId, key) => {
      const admin = state.adminAccounts.find(
        (a) => String(a.id) === String(adminId)
      );
      if (!admin) return;

      const nextValue = !admin.permissions?.[key];
      setState((prev) => ({
        ...prev,
        adminAccounts: prev.adminAccounts.map((a) =>
          String(a.id) === String(adminId)
            ? {
                ...a,
                permissions: { ...(a.permissions || {}), [key]: nextValue },
              }
            : a
        ),
      }));
      await withBusyRefresh(() =>
        updateAdminPermissionsAPI(adminId, { key, value: nextValue }, token)
      );
    },
    [token, state.adminAccounts, withBusyRefresh]
  );

  // ─────────────────────────────────────────────
  // Oversight
  // ─────────────────────────────────────────────

  const resolveSecurityFlag = useCallback(
    async (id) => {
      await withBusyRefresh(() => resolveOversightFlagAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const reopenSecurityFlag = useCallback(
    async (id) => {
      await withBusyRefresh(() => reopenOversightFlagAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const addBoard = useCallback(
    async (board) => {
      await withBusyRefresh(() => createBoardCatalogAPI(board, token));
    },
    [token, withBusyRefresh]
  );

  const updateBoard = useCallback(
    async (id, board) => {
      await withBusyRefresh(() => updateBoardCatalogAPI(id, board, token));
    },
    [token, withBusyRefresh]
  );

  const removeBoard = useCallback(
    async (id) => {
      await withBusyRefresh(() => deleteBoardCatalogAPI(id, token));
    },
    [token, withBusyRefresh]
  );

  const addBillingPlan = useCallback(
    async (plan) => {
      if (session?.isDemo) {
        setState((prev) => ({
          ...prev,
          subscriptionPlans: [...(prev.subscriptionPlans || []), { ...plan }],
        }));
        return plan;
      }
      await withBusyRefresh(() => createBillingPlanAPI(plan, token));
      return plan;
    },
    [token, withBusyRefresh, session?.isDemo]
  );

  const updateBillingPlan = useCallback(
    async (id, patch) => {
      if (session?.isDemo) {
        setState((prev) => ({
          ...prev,
          subscriptionPlans: (prev.subscriptionPlans || []).map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        }));
        return;
      }
      await withBusyRefresh(() => updateBillingPlanAPI(id, patch, token));
    },
    [token, withBusyRefresh, session?.isDemo]
  );

  const resetDemo = useCallback(() => {
    if (!session?.isDemo) return;
    setState({
      ...EMPTY_STATE,
      sensors: (DEMO_SENSORS || []).map((s) => ({ ...s })),
      users: [DEMO_USER],
      alerts: (DEMO_ALERTS || []).map((a) => ({ ...a })),
      automations: (DEMO_AUTOMATIONS || []).map((a) => ({ ...a })),
      adminAccounts: session.type === 'admin' ? [DEMO_ADMIN] : [],
      activityLogs: (DEMO_ACTIVITY || []).map((a) => ({ ...a })),
      boardCatalog: (DEMO_BOARD_CATALOG || []).map((b) => ({ ...b })),
      subscriptionPlans: (DEMO_SUBSCRIPTION_PLANS || []).map((p) => ({ ...p })),
      accessControl: { roles: ['Admin', 'User'], matrix: {} },
    });
  }, [session?.isDemo, session?.type]);

  // ONLY AFTER the two callbacks above:
  const value = {
    ...state,
    loading,
    busy,
    error,
    refresh: loadData,
    resetDemo,

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

    addBillingPlan,
    updateBillingPlan,
  };

  return (
    <DataContext.Provider value={value}>
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