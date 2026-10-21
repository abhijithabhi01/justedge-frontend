import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAutomationsAPI,
  createAutomationAPI,
  updateAutomationAPI,
  toggleAutomationAPI,
  deleteAutomationAPI,
} from '../api/allAPIs.js';

export function useAutomations(token, options = {}) {
  return useQuery({
    queryKey: ['automations'],
    queryFn: () => getAutomationsAPI(token),
    enabled: !!token && options.enabled !== false,
    ...options,
  });
}

export function useCreateAutomation(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createAutomationAPI(body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useUpdateAutomation(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateAutomationAPI(id, body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useToggleAutomation(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => toggleAutomationAPI(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useDeleteAutomation(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAutomationAPI(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}
