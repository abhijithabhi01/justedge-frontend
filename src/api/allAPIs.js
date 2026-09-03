/**
 * allAPIs.js — named API surface for JustEdge frontend.
 *
 * Rules:
 * - Paths live only here (not in views/contexts).
 * - Transport (axios, timeout, errors) lives in client.js.
 * - No UI or business mapping here — return server JSON as-is.
 */
import { apiRequest } from './client.js';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const loginAPI = (body) =>
  apiRequest('/api/auth/login', { method: 'POST', body });

export const logoutAPI = (token) =>
  apiRequest('/api/auth/logout', { method: 'POST', token });

export const getMeAPI = (token) =>
  apiRequest('/api/auth/me', { token });

// ── Board catalog ────────────────────────────────────────────────────────────

export const getBoardCatalogAPI = (token) =>
  apiRequest('/api/board-catalog', { token });

export const createBoardCatalogAPI = (body, token) =>
  apiRequest('/api/board-catalog', { method: 'POST', body, token });

export const updateBoardCatalogAPI = (id, body, token) =>
  apiRequest(`/api/board-catalog/${id}`, { method: 'PATCH', body, token });

export const deleteBoardCatalogAPI = (id, token) =>
  apiRequest(`/api/board-catalog/${id}`, { method: 'DELETE', token });

// ── IoT / AWS boards ─────────────────────────────────────────────────────────

export const getIotBoardsAPI = (token) =>
  apiRequest('/api/iot/boards', { token });

// ── Devices / sensors ────────────────────────────────────────────────────────

export const getDevicesAPI = (token) =>
  apiRequest('/api/devices', { token });

export const getDevicesLiveAPI = (token) =>
  apiRequest('/api/devices/live', { token });

export const getMyDevicesAPI = (token) =>
  apiRequest('/api/devices/mine', { token });

export const getMyDevicesLiveAPI = (token) =>
  apiRequest('/api/devices/mine/live', { token });

export const createDeviceAPI = (body, token) =>
  apiRequest('/api/devices', { method: 'POST', body, token });

export const updateDeviceAPI = (id, body, token) =>
  apiRequest(`/api/devices/${id}`, { method: 'PATCH', body, token });

export const deleteDeviceAPI = (id, token) =>
  apiRequest(`/api/devices/${id}`, { method: 'DELETE', token });

export const assignDeviceAPI = (sensorId, body, token) =>
  apiRequest(`/api/devices/${sensorId}/assign`, {
    method: 'PATCH',
    body,
    token,
  });

// ── Users ────────────────────────────────────────────────────────────────────

export const getUsersAPI = (token) =>
  apiRequest('/api/users', { token });

export const createUserAPI = (body, token) =>
  apiRequest('/api/users', { method: 'POST', body, token });

export const updateUserAPI = (id, body, token) =>
  apiRequest(`/api/users/${id}`, { method: 'PATCH', body, token });

export const updateUserStatusAPI = (id, body, token) =>
  apiRequest(`/api/users/${id}/status`, { method: 'PATCH', body, token });

export const updateUserPermissionsAPI = (userId, body, token) =>
  apiRequest(`/api/users/${userId}/permissions`, {
    method: 'PATCH',
    body,
    token,
  });

export const deleteUserAPI = (id, token) =>
  apiRequest(`/api/users/${id}`, { method: 'DELETE', token });

// ── Alerts ───────────────────────────────────────────────────────────────────

export const getAlertsAPI = (token) =>
  apiRequest('/api/alerts', { token });

export const resolveAlertAPI = (id, token) =>
  apiRequest(`/api/alerts/${id}/resolve`, { method: 'PATCH', token });

export const snoozeAlertAPI = (id, body, token) =>
  apiRequest(`/api/alerts/${id}/snooze`, { method: 'PATCH', body, token });

export const deleteAlertAPI = (id, token) =>
  apiRequest(`/api/alerts/${id}`, { method: 'DELETE', token });

// ── Automations ──────────────────────────────────────────────────────────────

export const getAutomationsAPI = (token) =>
  apiRequest('/api/automations', { token });

export const createAutomationAPI = (body, token) =>
  apiRequest('/api/automations', { method: 'POST', body, token });

export const toggleAutomationAPI = (id, token) =>
  apiRequest(`/api/automations/${id}/toggle`, { method: 'PATCH', token });

export const deleteAutomationAPI = (id, token) =>
  apiRequest(`/api/automations/${id}`, { method: 'DELETE', token });

// ── Billing ──────────────────────────────────────────────────────────────────

export const getBillingPlansAPI = (token) =>
  apiRequest('/api/billing/plans', { token });

export const getBillingSubscriptionsAPI = (token) =>
  apiRequest('/api/billing/subscriptions', { token });

// ── Admins (superadmin) ──────────────────────────────────────────────────────

export const getAdminsAPI = (token) =>
  apiRequest('/api/admins', { token });

export const createAdminAPI = (body, token) =>
  apiRequest('/api/admins', { method: 'POST', body, token });

export const updateAdminAPI = (id, body, token) =>
  apiRequest(`/api/admins/${id}`, { method: 'PATCH', body, token });

export const updateAdminStatusAPI = (id, body, token) =>
  apiRequest(`/api/admins/${id}/status`, { method: 'PATCH', body, token });

export const updateAdminPermissionsAPI = (adminId, body, token) =>
  apiRequest(`/api/admins/${adminId}/permissions`, {
    method: 'PATCH',
    body,
    token,
  });

export const deleteAdminAPI = (id, token) =>
  apiRequest(`/api/admins/${id}`, { method: 'DELETE', token });

// ── Activity / oversight / access control ────────────────────────────────────

export const getActivityLogsAPI = (token, params) =>
  apiRequest('/api/activity-logs', { token, params });

export const getOversightFlagsAPI = (token) =>
  apiRequest('/api/oversight/flags', { token });

export const resolveOversightFlagAPI = (id, token) =>
  apiRequest(`/api/oversight/flags/${id}/resolve`, {
    method: 'PATCH',
    token,
  });

export const reopenOversightFlagAPI = (id, token) =>
  apiRequest(`/api/oversight/flags/${id}/reopen`, {
    method: 'PATCH',
    token,
  });

export const getAccessControlRolesAPI = (token) =>
  apiRequest('/api/access-control/roles', { token });

// ── Export (CSV today; Excel/PDF can be added here later) ───────────────────

export const exportDataAPI = (type, token, params) =>
  apiRequest(`/api/export/${type}`, { token, params });

// ── Public demo (MongoDB demodata only — no AWS) ─────────────────────────────

export const getDemoLiveAPI = () =>
  apiRequest('/api/demo/live');

export const demoLoginAPI = (role) =>
  apiRequest('/api/demo/login', { method: 'POST', body: { role } });

export const createBillingPlanAPI = (body, token) =>
  apiRequest('/api/billing/plans', { method: 'POST', body, token });

export const updateBillingPlanAPI = (id, body, token) =>
  apiRequest(`/api/billing/plans/${id}`, { method: 'PATCH', body, token });