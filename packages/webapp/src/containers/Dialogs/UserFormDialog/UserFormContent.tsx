import { Intent, Classes, Button, HTMLSelect, Switch } from '@blueprintjs/core';
import classNames from 'classnames';
import { Form, useFormikContext } from 'formik';
import * as FF from 'fp-ts/function';
import React from 'react';
import intl from 'react-intl-universal';
import { UserFormCalloutAlerts } from './components';
import { useUserFormContext } from './UserFormProvider';
import type { UserFormValues } from './types';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import {
  FFormGroup,
  FInputGroup,
  FSelect,
  FormattedMessage as T,
  FieldRequiredHint,
} from '@/components';
import { CLASSES } from '@/constants/classes';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';

interface UserFormContentProps extends WithDialogActionsProps {
  calloutCode: number[];
}

/**
 * User form content.
 */
function UserFormContentInner({
  calloutCode,
  closeDialog,
}: UserFormContentProps): React.ReactElement {
  const { isSubmitting, values, setFieldValue } =
    useFormikContext<UserFormValues>();
  const { dialogName, roles, isAuth, isEditMode } = useUserFormContext();

  const handleClose = () => {
    closeDialog(dialogName);
  };

  return (
    <Form>
      <div className={Classes.DIALOG_BODY}>
        <UserFormCalloutAlerts calloutCodes={calloutCode} />

        {/* ----------- Email ----------- */}
        <FFormGroup
          name={'email'}
          label={intl.get('email')}
          labelInfo={<FieldRequiredHint />}
        >
          <FInputGroup name={'email'} />
        </FFormGroup>

        {/* ----------- First name ----------- */}
        <FFormGroup
          name={'firstName'}
          label={intl.get('first_name')}
          labelInfo={<FieldRequiredHint />}
        >
          <FInputGroup name={'firstName'} />
        </FFormGroup>

        {/* ----------- Last name ----------- */}
        <FFormGroup
          name={'lastName'}
          label={intl.get('last_name')}
          labelInfo={<FieldRequiredHint />}
        >
          <FInputGroup name={'lastName'} />
        </FFormGroup>

        {/* ----------- Password (create mode) ----------- */}
        {!isEditMode && (
          <FFormGroup
            name={'password'}
            label={'Password'}
            labelInfo={<FieldRequiredHint />}
          >
            <FInputGroup
              name={'password'}
              type="password"
              placeholder="Minimum 6 characters"
            />
          </FFormGroup>
        )}

        {/* ----------- Role name ----------- */}
        <FFormGroup
          name={'roleId'}
          label={intl.get('roles.label.role_name')}
          labelInfo={<FieldRequiredHint />}
          className={classNames(CLASSES.FILL, 'form-group--role_name')}
        >
          <HTMLSelect
            name={'roleId'}
            fill
            value={values.roleId || ''}
            onChange={(e) => setFieldValue('roleId', e.target.value)}
            disabled={isAuth}
          >
            <option value="">Select a role...</option>
            {(Array.isArray(roles) ? roles : []).map((role: any) => (
              <option key={role.id} value={String(role.id)}>
                {role.name}
              </option>
            ))}
          </HTMLSelect>
        </FFormGroup>

        {/* ----------- Active status (create mode) ----------- */}
        {!isEditMode && (
          <Switch
            checked={Boolean(values.active)}
            label="Active (user can sign in immediately)"
            onChange={(e) =>
              setFieldValue('active', (e.target as HTMLInputElement).checked)
            }
          />
        )}
      </div>

      <div className={CLASSES.DIALOG_FOOTER}>
        <div className={CLASSES.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={handleClose}>
            <T id={'cancel'} />
          </Button>

          <Button
            intent={Intent.PRIMARY}
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            style={{ minWidth: '85px' }}
          >
            <T id={'save'} />
          </Button>
        </div>
      </div>
    </Form>
  );
}
export const UserFormContent = FF.pipe(UserFormContentInner, withDialogActions);
