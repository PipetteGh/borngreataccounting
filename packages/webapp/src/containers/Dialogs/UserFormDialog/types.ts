import type {
  EditUserBody,
  Role,
  RolesListResponse,
  User,
} from '@borngreataccounting/sdk-ts';

import type { CreateUserBody } from '@/hooks/query/users/queries';

export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  active: boolean;
}

export type UserFormDialogPayload = {
  action?: string;
  userId?: number | null;
};

export type UserFormContextValue = {
  isAuth: boolean;
  userId: number | null;
  dialogName: string;
  user: User | undefined;
  CreateUserMutate: (vars: CreateUserBody) => Promise<unknown>;
  // FIXME: capital `E` is inconsistent with peers; kept to avoid touching all
  // call sites.
  EditUserMutate: (vars: [number, EditUserBody]) => Promise<unknown>;
  // FIXME: `isEditMode = userId` is a number (truthy) rather than a boolean.
  // Kept as a union to reflect runtime while flagging the mismatch.
  isEditMode: number | boolean;
  roles: RolesListResponse | Role[] | undefined;
};
