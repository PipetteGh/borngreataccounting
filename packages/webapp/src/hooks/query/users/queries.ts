import {
  fetchUsers,
  fetchUser,
  inviteUser,
  editUser,
  inactivateUser,
  activateUser,
  deleteUser,
  fetchAuthedAccount,
  fetchDashboardBootMeta,
} from '@borngreataccounting/sdk-ts';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import axios from 'axios';
import { useEffect } from 'react';
import { useAuthOrganizationId, useAuthToken, useSetAuthEmailConfirmed } from '../../state/authentication';
import { useApiFetcher } from '../../useRequest';
import { usersKeys } from './query-keys';
import type {
  UsersListResponse,
  User,
  EditUserBody,
  InviteUserBody,
  GetDashboardBootMetaResponse,
  AuthedAccount,
} from '@borngreataccounting/sdk-ts';

const commonInvalidateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: usersKeys.all() });
};

export interface CreateUserBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  active?: boolean;
}

export function useCreateUser(
  props?: UseMutationOptions<unknown, Error, CreateUserBody>,
) {
  const queryClient = useQueryClient();
  const token = useAuthToken();
  const organizationId = useAuthOrganizationId();

  return useMutation({
    ...props,
    mutationFn: async (values: CreateUserBody) => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (organizationId) headers['organization-id'] = organizationId;
      const res = await axios.post(
        '/api/users',
        {
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          password: values.password,
          role_id: Number(values.roleId),
          active: values.active ?? true,
        },
        { headers },
      );
      return res.data;
    },
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useCreateInviteUser(
  props?: UseMutationOptions<void, Error, InviteUserBody>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values: InviteUserBody) => inviteUser(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useEditUser(
  props?: UseMutationOptions<void, Error, [number, EditUserBody]>,
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditUserBody]) =>
      editUser(fetcher, id, values),
    onSuccess: (_res, [id]) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useInactivateUser(
  props?: UseMutationOptions<void, Error, number>,
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    ...props,
    mutationFn: (userId: number) => inactivateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useActivateUser(
  props?: UseMutationOptions<void, Error, number>,
) {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation({
    ...props,
    mutationFn: (userId: number) => activateUser(fetcher, userId),
    onSuccess: (_res, userId) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useDeleteUser(props?: UseMutationOptions<void, Error, number>) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteUser(fetcher, id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useUsers(
  props?: Omit<UseQueryOptions<UsersListResponse>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    ...props,
    queryKey: usersKeys.all(),
    queryFn: () => fetchUsers(fetcher),
  });
}

export function useUser(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>,
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    ...props,
    queryKey: usersKeys.detail(id),
    queryFn: () => fetchUser(fetcher, id!),
    enabled: id != null && (props?.enabled ?? true),
  });
}

export function useAuthenticatedAccount(
  props?: Omit<UseQueryOptions<AuthedAccount>, 'queryKey' | 'queryFn'>,
) {
  const setEmailConfirmed = useSetAuthEmailConfirmed();
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  const state = useQuery<AuthedAccount, Error>({
    ...props,
    queryKey: usersKeys.authenticatedAccount(),
    queryFn: () => fetchAuthedAccount(fetcher),
  });
  useEffect(() => {
    if (state.isSuccess && state.data) {
      setEmailConfirmed(state.data.verified, state.data.email);
    }
  }, [state.isSuccess, state.data, setEmailConfirmed]);
  return { ...state, data: state.data ?? ({} as AuthedAccount) };
}

export const useDashboardMeta = (
  props?: Omit<
    UseQueryOptions<GetDashboardBootMetaResponse>,
    'queryKey' | 'queryFn'
  >,
) => {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    ...props,
    queryKey: usersKeys.dashboardMeta(),
    queryFn: () => fetchDashboardBootMeta(fetcher),
  });
};
