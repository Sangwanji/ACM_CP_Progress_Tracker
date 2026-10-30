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

export const useOverview = () =>
  useQuery({ queryKey: ['dashboard', 'overview'], queryFn: () => api('/dashboard/overview') });

export const useReviewQueue = (enabled = true) =>
  useQuery({ queryKey: ['dashboard', 'review-queue'], queryFn: () => api('/dashboard/review-queue'), enabled });

export const useTasks = () =>
  useQuery({ queryKey: ['tasks'], queryFn: async () => (await api('/tasks')).tasks });

export const useTask = (id) =>
  useQuery({ queryKey: ['tasks', String(id)], queryFn: async () => (await api(`/tasks/${id}`)).task });

// Expert: own mentees. Admin (or expert-admin): everyone, so filter by mentorIds where it matters.
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: async () => (await api('/users')).users });

export function useReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api(`/assignments/${id}/review`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api('/tasks', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

const refreshAll = (qc) => {
  ['tasks', 'dashboard', 'assignments'].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
};

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api(`/tasks/${id}`, { method: 'PATCH', body }),
    onSuccess: () => refreshAll(qc),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => refreshAll(qc),
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeIds }) => api(`/tasks/${id}/assign`, { method: 'POST', body: { assigneeIds } }),
    onSuccess: () => refreshAll(qc),
  });
}

export function useRemoveAssignee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assigneeId }) =>
      api(`/tasks/${taskId}/assignees/${assigneeId}`, { method: 'DELETE' }),
    onSuccess: () => refreshAll(qc),
  });
}