import {
  defaultTheme,
  ThemeProvider as XStyledEmotionThemeProvider,
} from '@xstyled/emotion';
import React, { useEffect } from 'react';
import {
  ThemeProvider as StyleComponentsThemeProvider,
  StyleSheetManager,
} from 'styled-components';
import rtlcss from 'stylis-rtlcss';
import { useAppIntlContext } from '../AppIntlProvider';
import { applyAppTheme, getCurrentAppThemeId } from '@/constants/themes';

const theme = {
  ...defaultTheme,
  bpPrefix: 'bp4',
};

interface DashboardThemeProviderProps {
  children: React.ReactNode;
}

export function DashboardThemeProvider({
  children,
}: DashboardThemeProviderProps) {
  const { direction } = useAppIntlContext();

  useEffect(() => {
    applyAppTheme(getCurrentAppThemeId());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        applyAppTheme(getCurrentAppThemeId());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <StyleSheetManager
      {...(direction === 'rtl' ? { stylisPlugins: [rtlcss] } : {})}
    >
      <StyleComponentsThemeProvider theme={{ dir: direction }}>
        <XStyledEmotionThemeProvider theme={theme}>
          {children}
        </XStyledEmotionThemeProvider>
      </StyleComponentsThemeProvider>
    </StyleSheetManager>
  );
}
