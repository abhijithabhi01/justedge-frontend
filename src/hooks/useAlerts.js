import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAlertsAPI,
  resolveAlertAPI,
  snoozeAlertAPI,
  clearAllAlertsAPI,
  deleteAlertAPI,
} from '../api/allAPIs.js';

export function useAlerts(token, options = {}) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlertsAPI(token),
    enabled: !!token && options.enabled !== false,
    refetchInterval: options.refetchInterval ?? 15000,
    ...options,
  });
}

export function useResolveAlert(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => resolveAlertAPI(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useSnoozeAlert(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => snoozeAlertAPI(id, body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useClearAllAlerts(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllAlertsAPI(token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useDeleteAlert(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAlertAPI(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
