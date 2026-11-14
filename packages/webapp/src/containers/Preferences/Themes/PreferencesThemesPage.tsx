import { Button, ButtonGroup, Intent, Tag } from '@blueprintjs/core';
import * as FF from 'fp-ts/function';
import { useEffect, useState } from 'react';
import type { WithDashboardActionsProps } from '@/containers/Dashboard/withDashboardActions';
import { AppToaster } from '@/components';
import {
  APP_THEMES,
  AppThemeDefinition,
  AppThemeId,
  DEFAULT_THEME_ID,
  applyAppTheme,
  getCurrentAppThemeId,
} from '@/constants/themes';
import { withDashboardActions } from '@/containers/Dashboard/withDashboardActions';
import { useIsDarkMode } from '@/hooks/useDarkMode';

type PreferencesThemesPageRootProps = Pick<
  WithDashboardActionsProps,
  'changePreferencesPageTitle'
>;

function PreferencesThemesPageRoot({
  changePreferencesPageTitle,
}: PreferencesThemesPageRootProps) {
  const isDarkMode = useIsDarkMode();
  const [activeThemeId, setActiveThemeId] = useState<AppThemeId>(() =>
    getCurrentAppThemeId(),
  );
  const [filter, setFilter] = useState<'all' | 'light' | 'dark'>('all');

  useEffect(() => {
    changePreferencesPageTitle('Themes & Appearance');
  }, [changePreferencesPageTitle]);

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

  const handleSelectTheme = (theme: AppThemeDefinition) => {
    applyAppTheme(theme.id);
    setActiveThemeId(theme.id);
    AppToaster.show({
      intent: Intent.SUCCESS,
      message: `Theme changed to "${theme.name}".`,
    });
  };

  const filteredThemes = APP_THEMES.filter((theme) => {
    if (filter === 'light') return !theme.isDark;
    if (filter === 'dark') return theme.isDark;
    return true;
  });

  const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.16)' : '#dbe3ee';
  const cardBg = isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff';
  const mutedColor = isDarkMode ? '#a7b6c2' : '#5c7080';

  return (
    <div
      style={{
        padding: '20px 40px 40px',
        maxWidth: 1080,
        width: '100%',
        flex: 1,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px' }}>
            Application Themes ({APP_THEMES.length} Available)
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: mutedColor }}>
            Choose a color theme for the workspace. Your preference is saved
            automatically and applies across the entire application.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ButtonGroup>
            <Button
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All ({APP_THEMES.length})
            </Button>
            <Button
              active={filter === 'light'}
              onClick={() => setFilter('light')}
            >
              Light ({APP_THEMES.filter((t) => !t.isDark).length})
            </Button>
            <Button
              active={filter === 'dark'}
              onClick={() => setFilter('dark')}
            >
              Dark ({APP_THEMES.filter((t) => t.isDark).length})
            </Button>
          </ButtonGroup>

          <Button
            minimal
            outlined
            onClick={() =>
              handleSelectTheme(
                APP_THEMES.find((t) => t.id === DEFAULT_THEME_ID)!,
              )
            }
          >
            Reset Default
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {filteredThemes.map((theme) => {
          const isActive = theme.id === activeThemeId;

          return (
            <div
              key={theme.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectTheme(theme)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectTheme(theme);
                }
              }}
              style={{
                cursor: 'pointer',
                borderRadius: 8,
                border: isActive
                  ? `2px solid ${theme.preview.primary}`
                  : `1px solid ${borderColor}`,
                background: cardBg,
                overflow: 'hidden',
                boxShadow: isActive
                  ? `0 0 0 2px ${theme.preview.primary}33`
                  : '0 1px 3px rgba(0, 0, 0, 0.06)',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
            >
              {/* Mini UI Layout Preview */}
              <div
                style={{
                  height: 92,
                  display: 'flex',
                  background: theme.preview.canvas,
                  borderBottom: `1px solid ${borderColor}`,
                }}
              >
                <div
                  style={{
                    width: 54,
                    background: theme.preview.sidebar,
                    padding: '10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      height: 8,
                      borderRadius: 3,
                      background: theme.preview.primary,
                    }}
                  />
                  <div
                    style={{
                      height: 5,
                      width: '80%',
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.45)',
                    }}
                  />
                  <div
                    style={{
                      height: 5,
                      width: '65%',
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      height: 16,
                      borderRadius: 4,
                      background: theme.preview.surface,
                      border: `1px solid ${borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      padding: '0 6px',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 8,
                        borderRadius: 3,
                        background: theme.preview.primary,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      borderRadius: 4,
                      background: theme.preview.surface,
                      border: `1px solid ${borderColor}`,
                      padding: 8,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        width: '60%',
                        borderRadius: 2,
                        background: theme.preview.primary,
                        opacity: 0.75,
                      }}
                    />
                    <div
                      style={{
                        height: 5,
                        width: '85%',
                        borderRadius: 2,
                        background: theme.isDark
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.12)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Theme Metadata */}
              <div style={{ padding: '12px 14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{theme.name}</strong>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag minimal intent={theme.isDark ? 'none' : 'primary'}>
                      {theme.isDark ? 'Dark' : 'Light'}
                    </Tag>
                    {isActive && <Tag intent={Intent.SUCCESS}>Active</Tag>}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: mutedColor }}>
                  {theme.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const PreferencesThemesPage = FF.pipe(
  PreferencesThemesPageRoot,
  withDashboardActions,
);
