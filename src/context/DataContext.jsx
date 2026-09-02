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
import {
  DEMO_ADMIN,
  DEMO_USER,
  DEMO_SENSORS,
  DEMO_ALERTS,
  DEMO_AUTOMATIONS,
  DEMO_ACTIVITY,
  DEMO_BOARD_CATALOG,
} from '../demo/mockData.js';
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


  const [error, setError] =
    useState(null);


  const token =
    session?.token;


  const loadData = useCallback(
    async () => {
      if (session?.isDemo) {
        setLoading(true);
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
          setLoading(false);
        }
        return;
      }
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
      session?.isDemo,
    ]
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
      const data = await createDeviceAPI(sensor, token);
      await loadData();
      return data.device;
    },
    [token, loadData]
  );

  const updateSensor = useCallback(
    async (id, patch) => {
      await updateDeviceAPI(id, patch, token);
      await loadData();
    },
    [token, loadData]
  );

  const removeSensor = useCallback(
    async (id) => {
      await deleteDeviceAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const reassignSensor = useCallback(
    async (sensorId, userId) => {
      await assignDeviceAPI(sensorId, { assignedUserId: userId }, token);
      await loadData();
    },
    [token, loadData]
  );

  // ─────────────────────────────────────────────
  // Users
  // ─────────────────────────────────────────────

  const addUser = useCallback(
    async (user) => {
      const data = await createUserAPI(user, token);
      await loadData();
      return { user: data.user, tempPassword: data.tempPassword };
    },
    [token, loadData]
  );

  const updateUser = useCallback(
    async (id, patch) => {
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

      await loadData();
    },
    [token, loadData]
  );

  const removeUser = useCallback(
    async (id) => {
      await deleteUserAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const toggleUserStatus = useCallback(
    async (id) => {
      const user = state.users.find((u) => String(u.id) === String(id));
      if (!user) return;

      const nextStatus = user.status === 'active' ? 'suspended' : 'active';
      await updateUserStatusAPI(id, { status: nextStatus }, token);
      await loadData();
    },
    [token, state.users, loadData]
  );

  const togglePermission = useCallback(
    async (userId, key) => {
      const user = state.users.find((u) => String(u.id) === String(userId));
      if (!user) return;

      const permissions = {
        ...(user.permissions || {}),
        [key]: !user.permissions?.[key],
      };
      await updateUserPermissionsAPI(userId, { permissions }, token);
      await loadData();
    },
    [token, state.users, loadData]
  );

  // ─────────────────────────────────────────────
  // Alerts
  // ─────────────────────────────────────────────

  const resolveAlert = useCallback(
    async (id) => {
      await resolveAlertAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const dismissAlert = useCallback(
    async (id) => {
      await deleteAlertAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const snoozeAlert = useCallback(
    async (id) => {
      await snoozeAlertAPI(id, { hours: 24 }, token);
      await loadData();
    },
    [token, loadData]
  );

  // ─────────────────────────────────────────────
  // Automations
  // ─────────────────────────────────────────────

  const addAutomation = useCallback(
    async (automation) => {
      await createAutomationAPI(automation, token);
      await loadData();
    },
    [token, loadData]
  );

  const toggleAutomation = useCallback(
    async (id) => {
      await toggleAutomationAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const removeAutomation = useCallback(
    async (id) => {
      await deleteAutomationAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  // ─────────────────────────────────────────────
  // Admin accounts
  // ─────────────────────────────────────────────

  const addAdmin = useCallback(
    async (admin) => {
      const data = await createAdminAPI(admin, token);
      await loadData();
      return { admin: data.admin, tempPassword: data.tempPassword };
    },
    [token, loadData]
  );

  const updateAdmin = useCallback(
    async (id, patch) => {
      await updateAdminAPI(id, patch, token);
      await loadData();
    },
    [token, loadData]
  );

  const removeAdmin = useCallback(
    async (id) => {
      await deleteAdminAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const toggleAdminStatus = useCallback(
    async (id) => {
      const admin = state.adminAccounts.find(
        (a) => String(a.id) === String(id)
      );
      if (!admin) return;

      const status =
        admin.status === 'suspended' ? 'active' : 'suspended';
      await updateAdminStatusAPI(id, { status }, token);
      await loadData();
    },
    [token, state.adminAccounts, loadData]
  );

  const toggleAdminPermission = useCallback(
    async (adminId, key) => {
      const admin = state.adminAccounts.find(
        (a) => String(a.id) === String(adminId)
      );
      if (!admin) return;

      const permissions = {
        ...(admin.permissions || {}),
        [key]: !admin.permissions?.[key],
      };
      await updateAdminPermissionsAPI(adminId, { permissions }, token);
      await loadData();
    },
    [token, state.adminAccounts, loadData]
  );

  // ─────────────────────────────────────────────
  // Oversight
  // ─────────────────────────────────────────────

  const resolveSecurityFlag = useCallback(
    async (id) => {
      await resolveOversightFlagAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const reopenSecurityFlag = useCallback(
    async (id) => {
      await reopenOversightFlagAPI(id, token);
      await loadData();
    },
    [token, loadData]
  );

  const addBoard = useCallback(
    async (board) => {
      await createBoardCatalogAPI(board, token);
      await loadData();
    },
    [token, loadData]
  );

  const updateBoard = useCallback(
    async (id, board) => {
      await updateBoardCatalogAPI(id, board, token);
      await loadData();
    },
    [token, loadData]
  );

  const removeBoard = useCallback(
    async (id) => {
      await deleteBoardCatalogAPI(id, token);
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