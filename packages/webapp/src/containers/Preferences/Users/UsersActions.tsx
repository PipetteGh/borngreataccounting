import { Button, Intent } from '@blueprintjs/core';
import * as FF from 'fp-ts/function';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Icon, FormattedMessage as T } from '@/components';
import {
  withDialogActions,
  type WithDialogActionsProps,
} from '@/containers/Dialog/withDialogActions';

function UsersActionsInner({ openDialog }: WithDialogActionsProps) {
  const history = useHistory();
  const onClickAddUser = () => {
    openDialog('user-form', { action: 'new', userId: null });
  };
  const onClickNewUser = () => {
    openDialog('invite-user');
  };
  const onClickNewRole = () => {
    history.push('/preferences/roles');
  };

  return (
    <div className="preferences-actions">
      <Button
        icon={<Icon icon="plus" iconSize={12} />}
        onClick={onClickAddUser}
        intent={Intent.PRIMARY}
        data-testid="add-user-btn"
      >
        Add User
      </Button>

      <Button
        icon={<Icon icon="envelope" iconSize={12} />}
        onClick={onClickNewUser}
      >
        <T id={'invite_user'} />
      </Button>

      <Button
        icon={<Icon icon="plus" iconSize={12} />}
        onClick={onClickNewRole}
      >
        <T id={'new_role'} />
      </Button>
    </div>
  );
}

export const UsersActions = FF.pipe(UsersActionsInner, withDialogActions);
