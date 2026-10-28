import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export const useMyAssignments = () =>
  useQuery({
    queryKey: ['assignments', 'mine'],
    queryFn: async () => (await api('/assignments/mine')).assignments,
  });

export const useMyDashboard = () =>
  useQuery({ queryKey: ['dashboard', 'me'], queryFn: () => api('/dashboard/me') });

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api(`/assignments/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export const useProfiles = () =>
  useQuery({
    queryKey: ['profiles'],
    queryFn: async () => (await api('/profiles')).profiles,
  });

export const useProfile = (id) =>
  useQuery({
    queryKey: ['profiles', String(id)],
    queryFn: async () => (await api(`/profiles/${id}`)).profile,
  });

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api(`/profiles/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });
}