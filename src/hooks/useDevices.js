/**
 * Device domain hooks (TanStack Query).
 * Use these in views instead of manual useEffect + loading state.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevicesAPI,
  getDevicesLiveAPI,
  getDeviceLiveAPI,
  getMyDevicesAPI,
  getMyDevicesLiveAPI,
  getMyDeviceLiveAPI,
  createDeviceAPI,
  updateDeviceAPI,
  deleteDeviceAPI,
  assignDeviceAPI,
} from '../api/allAPIs.js';

export function useDevices(token, options = {}) {
  return useQuery({
    queryKey: ['devices'],
    queryFn: () => getDevicesAPI(token),
    enabled: !!token && options.enabled !== false,
    ...options,
  });
}

export function useLiveFleet(token, { refetchInterval = 5000, enabled = true } = {}) {
  return useQuery({
    queryKey: ['devices', 'live'],
    queryFn: () => getDevicesLiveAPI(token),
    enabled: !!token && enabled,
    refetchInterval,
  });
}

export function useDeviceLive(id, token, { refetchInterval = 5000 } = {}) {
  return useQuery({
    queryKey: ['devices', id, 'live'],
    queryFn: () => getDeviceLiveAPI(id, token),
    enabled: !!token && !!id,
    refetchInterval,
  });
}

export function useMyDevices(token, options = {}) {
  return useQuery({
    queryKey: ['devices', 'mine'],
    queryFn: () => getMyDevicesAPI(token),
    enabled: !!token && options.enabled !== false,
    ...options,
  });
}

export function useMyLiveFleet(token, { refetchInterval = 5000, enabled = true } = {}) {
  return useQuery({
    queryKey: ['devices', 'mine', 'live'],
    queryFn: () => getMyDevicesLiveAPI(token),
    enabled: !!token && enabled,
    refetchInterval,
  });
}

export function useMyDeviceLive(id, token, { refetchInterval = 5000 } = {}) {
  return useQuery({
    queryKey: ['devices', 'mine', id, 'live'],
    queryFn: () => getMyDeviceLiveAPI(id, token),
    enabled: !!token && !!id,
    refetchInterval,
  });
}

export function useCreateDevice(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createDeviceAPI(body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useUpdateDevice(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateDeviceAPI(id, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useDeleteDevice(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteDeviceAPI(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useAssignDevice(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sensorId, body }) => assignDeviceAPI(sensorId, body, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
