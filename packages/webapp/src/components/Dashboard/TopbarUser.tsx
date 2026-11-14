import React, { useEffect, useState } from 'react';
import {
  Menu,
  MenuItem,
  MenuDivider,
  Button,
  Popover,
  Position,
} from '@blueprintjs/core';
import * as FF from 'fp-ts/function';
import { useHistory } from 'react-router-dom';
import type { WithDialogActionsProps } from '@/containers/Dialog/withDialogActions';
import { FormattedMessage as T } from '@/components';
import {
  APP_THEMES,
  AppThemeDefinition,
  AppThemeId,
  applyAppTheme,
  getCurrentAppThemeId,
} from '@/constants/themes';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { useAuthenticatedAccount } from '@/hooks/query';
import { useAuthActions, useAuthOrganizationId } from '@/hooks/state';
import { firstLettersArgs } from '@/utils';

/**
 * Dashboard topbar user.
 */
function DashboardTopbarUser({
  // #withDialogActions
  openDialog,
}: Pick<WithDialogActionsProps, 'openDialog'>) {
  const history = useHistory();
  const { setLogout } = useAuthActions();
  const [activeThemeId, setActiveThemeId] = useState<AppThemeId>(() =>
    getCurrentAppThemeId(),
  );

  useEffect(() => {
    const onThemeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<AppThemeDefinition>;
      if (customEvent.detail?.id) {
        setActiveThemeId(customEvent.detail.id);
      }
    };
    window.addEventListener('borngreat-theme-changed', onThemeChanged);
    return () =>
      window.removeEventListener('borngreat-theme-changed', onThemeChanged);
  }, []);

  // Retrieve authenticated user information.
  const { data: user } = useAuthenticatedAccount();
  const organizationId = useAuthOrganizationId();

  const onClickLogout = () => {
    setLogout();
  };

  const onKeyboardShortcut = () => {
    openDialog('keyboard-shortcuts');
  };

  return (
    <Popover
      content={
        <Menu className={'menu--logged-user-dropdown'}>
          <MenuItem
            multiline={true}
            className={'menu-item--profile'}
            text={
              <div>
                <div className="person">
                  {user.firstName} {user.lastName}
                </div>
                <div className="org">
                  <T id="organization_id" />: {organizationId}
                </div>
              </div>
            }
          />
          <MenuDivider />
          <MenuItem
            text={<T id={'keyboard_shortcuts'} />}
            onClick={onKeyboardShortcut}
          />
          <MenuItem
            text={<T id={'preferences'} />}
            onClick={() => history.push('/preferences')}
          />
          <MenuItem text={`Themes (${APP_THEMES.length})`} icon="tint">
            {APP_THEMES.map((theme) => (
              <MenuItem
                key={theme.id}
                text={theme.name}
                icon={theme.id === activeThemeId ? 'tick' : 'blank'}
                labelElement={
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: theme.preview.primary,
                      border: '1px solid rgba(255,255,255,0.35)',
                    }}
                  />
                }
                onClick={() => {
                  applyAppTheme(theme.id);
                  setActiveThemeId(theme.id);
                }}
              />
            ))}
            <MenuDivider />
            <MenuItem
              text="All Themes & Appearance..."
              icon="style"
              onClick={() => history.push('/preferences/themes')}
            />
          </MenuItem>
          <MenuItem text={<T id={'logout'} />} onClick={onClickLogout} />
        </Menu>
      }
      position={Position.BOTTOM}
    >
      <Button>
        <div className="user-text">
          {firstLettersArgs(user.firstName, user.lastName)}
        </div>
      </Button>
    </Popover>
  );
}
export default FF.pipe(DashboardTopbarUser, withDialogActions);
