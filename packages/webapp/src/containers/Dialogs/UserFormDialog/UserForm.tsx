import { Intent } from '@blueprintjs/core';
import { Formik, type FormikHelpers } from 'formik';
import * as FF from 'fp-ts/function';
import React from 'react';
import intl from 'react-intl-universal';
import { CreateUserFormSchema, UserFormSchema } from './UserForm.schema';
import { UserFormContent } from './UserFormContent';
import { useUserFormContext } from './UserFormProvider';
import { transformErrors } from './utils';
import type { UserFormValues } from './types';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import { AppToaster } from '@/components';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { transformToForm } from '@/utils';

const initialValues: UserFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: '',
  active: true,
};

interface UserFormProps extends WithDialogActionsProps {}

/**
 * User form.
 */
function UserFormInner({ closeDialog }: UserFormProps): React.ReactElement {
  const [calloutCode, setCalloutCode] = React.useState<number[]>([]);

  const { dialogName, user, userId, isEditMode, CreateUserMutate, EditUserMutate } =
    useUserFormContext();

  const initialFormValues: UserFormValues = {
    ...initialValues,
    ...(isEditMode && transformToForm(user, initialValues)),
  };

  const handleSubmit = (
    values: UserFormValues,
    { setSubmitting, setErrors }: FormikHelpers<UserFormValues>,
  ) => {
    const form = { ...values };

    // Handle close the dialog after success response.
    const afterSubmit = () => {
      closeDialog(dialogName);
    };

    const onSuccess = () => {
      AppToaster.show({
        message: isEditMode
          ? intl.get('user_edited_successfully') || 'User updated successfully.'
          : 'User added successfully and can now sign in.',
        intent: Intent.SUCCESS,
      });
      afterSubmit();
    };

    // Handle the response error.
    const onError = (error: any) => {
      const errors = error?.response?.data?.errors ?? error?.data?.errors ?? [];
      transformErrors(errors, { setErrors, setCalloutCode });
      if (!errors.length) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to save user.';
        AppToaster.show({
          message: Array.isArray(msg) ? msg.join(', ') : String(msg),
          intent: Intent.DANGER,
        });
      }
      setSubmitting(false);
    };

    if (isEditMode && userId) {
      EditUserMutate([
        userId,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          roleId: Number(form.roleId),
        },
      ])
        .then(onSuccess)
        .catch(onError);
    } else {
      CreateUserMutate({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        roleId: Number(form.roleId),
        active: Boolean(form.active),
      })
        .then(onSuccess)
        .catch(onError);
    }
  };

  return (
    <Formik
      validationSchema={isEditMode ? UserFormSchema : CreateUserFormSchema}
      initialValues={initialFormValues}
      onSubmit={handleSubmit}
    >
      <UserFormContent calloutCode={calloutCode} />
    </Formik>
  );
}
export const UserForm = FF.pipe(UserFormInner, withDialogActions);
