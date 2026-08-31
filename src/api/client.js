import axios from 'axios';

/**
 * Base URL from Vite env (production / staging / local).
 * Example: VITE_API_URL=https://api.justedge.example.com
 */
const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000'
).replace(/\/$/, '');

/**
 * Shared Axios instance — single place for timeouts, JSON, and auth header.
 */
const http = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Set or clear the default Bearer token (call after login / logout).
 * Individual requests may still pass an explicit token override.
 */
export function setAuthToken(token) {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}

/**
 * Low-level request helper used by allAPIs.js only.
 * UI / contexts should call named functions from allAPIs.js — not this directly.
 *
 * @param {string} path - API path, e.g. '/api/devices'
 * @param {{ method?: string, body?: unknown, token?: string, params?: object }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    params,
  } = options;

  try {
    const response = await http.request({
      url: path,
      method,
      data: body,
      params,
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
    });
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;

    const message =
      (data && typeof data === 'object' && data.error) ||
      (typeof data === 'string' && data) ||
      err.message ||
      `API request failed${status ? `: ${status}` : ''}`;

    const error = new Error(message);
    error.status = status;
    error.data = data;
    throw error;
  }
}

export { API_URL, http };