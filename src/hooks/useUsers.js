import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsersAPI,
  createUserAPI,
  updateUserAPI,
  updateUserStatusAPI,
  updateUserPermissionsAPI,
  deleteUserAPI,
} from '../api/allAPIs.js';

export function useUsers(token, options = {}) {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => getUsersAPI(token),
    enabled: !!token && options.enabled !== false,
    ...options,
  });
}

export function useCreateUser(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createUserAPI(body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateUserAPI(id, body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserStatus(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => updateUserStatusAPI(id, body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserPermissions(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, body }) => updateUserPermissionsAPI(userId, body, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser(token) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteUserAPI(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
