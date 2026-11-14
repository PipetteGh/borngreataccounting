export type AppThemeId =
  | 'midnight'
  | 'light'
  | 'dark'
  | 'emerald'
  | 'emerald-dark'
  | 'indigo'
  | 'amethyst'
  | 'crimson'
  | 'amber'
  | 'ocean'
  | 'nord'
  | 'slate';

export interface AppThemeDefinition {
  id: AppThemeId;
  name: string;
  description: string;
  isDark: boolean;
  preview: {
    sidebar: string;
    canvas: string;
    surface: string;
    primary: string;
  };
}

export const DEFAULT_THEME_ID: AppThemeId = 'light';
export const THEME_STORAGE_KEY = 'theme';

export const APP_THEMES: AppThemeDefinition[] = [
  {
    id: 'light',
    name: 'Borngreat Classic Light',
    description: 'Crisp white workspace with royal blue sidebar & accents.',
    isDark: false,
    preview: {
      sidebar: '#0c234d',
      canvas: '#f6f8fb',
      surface: '#ffffff',
      primary: '#004dd0',
    },
  },
  {
    id: 'midnight',
    name: 'Borngreat Midnight',
    description: 'Deep navy-slate dark mode with electric blue highlights.',
    isDark: true,
    preview: {
      sidebar: '#0b162c',
      canvas: '#121a2a',
      surface: '#1a2438',
      primary: '#3b82f6',
    },
  },
  {
    id: 'dark',
    name: 'Obsidian Dark',
    description: 'Classic charcoal dark theme with sky-blue controls.',
    isDark: true,
    preview: {
      sidebar: '#181c22',
      canvas: '#1c2127',
      surface: '#252a31',
      primary: '#4c90f0',
    },
  },
  {
    id: 'emerald',
    name: 'Emerald Ledger',
    description: 'Clean mint-white canvas paired with a deep forest sidebar.',
    isDark: false,
    preview: {
      sidebar: '#064e3b',
      canvas: '#f2f9f6',
      surface: '#ffffff',
      primary: '#059669',
    },
  },
  {
    id: 'emerald-dark',
    name: 'Emerald Night',
    description: 'Deep pine dark workspace with luminous emerald accents.',
    isDark: true,
    preview: {
      sidebar: '#04241b',
      canvas: '#091915',
      surface: '#112922',
      primary: '#10b981',
    },
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    description: 'Modern cool-white workspace with deep indigo navigation.',
    isDark: false,
    preview: {
      sidebar: '#1e1b4b',
      canvas: '#f5f6fc',
      surface: '#ffffff',
      primary: '#4f46e5',
    },
  },
  {
    id: 'amethyst',
    name: 'Amethyst Dusk',
    description: 'Rich plum-obsidian dark theme with violet highlights.',
    isDark: true,
    preview: {
      sidebar: '#1a1130',
      canvas: '#120d21',
      surface: '#1d1633',
      primary: '#9333ea',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Executive',
    description: 'Warm executive ivory canvas with burgundy sidebar.',
    isDark: false,
    preview: {
      sidebar: '#450a18',
      canvas: '#fbf7f8',
      surface: '#ffffff',
      primary: '#be123c',
    },
  },
  {
    id: 'amber',
    name: 'Amber Gold',
    description: 'Warm espresso dark mode with refined gold accents.',
    isDark: true,
    preview: {
      sidebar: '#1c150c',
      canvas: '#14100a',
      surface: '#221b12',
      primary: '#d97706',
    },
  },
  {
    id: 'ocean',
    name: 'Oceanic Teal',
    description: 'Breezy coastal light theme with deep cyan-teal sidebar.',
    isDark: false,
    preview: {
      sidebar: '#083344',
      canvas: '#f2f9fa',
      surface: '#ffffff',
      primary: '#0d9488',
    },
  },
  {
    id: 'nord',
    name: 'Nordic Frost',
    description: 'Arctic slate-blue dark mode with crisp frost-cyan accents.',
    isDark: true,
    preview: {
      sidebar: '#19202b',
      canvas: '#1e2430',
      surface: '#273040',
      primary: '#38bdf8',
    },
  },
  {
    id: 'slate',
    name: 'Monochrome Slate',
    description: 'Minimalist neutral light theme with graphite navigation.',
    isDark: false,
    preview: {
      sidebar: '#18181b',
      canvas: '#f4f4f5',
      surface: '#ffffff',
      primary: '#27272a',
    },
  },
];

export function getThemeDefinition(themeId?: string | null): AppThemeDefinition {
  const found = APP_THEMES.find((t) => t.id === themeId);
  return found ?? APP_THEMES[0];
}

export function getCurrentAppThemeId(): AppThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return getThemeDefinition(stored).id;
}

export function applyAppTheme(themeId: AppThemeId): AppThemeDefinition {
  const theme = getThemeDefinition(themeId);
  if (typeof document !== 'undefined') {
    const isPaymentPortal = window.location.pathname.startsWith('/payment');
    document.documentElement.setAttribute('data-theme', theme.id);
    if (theme.isDark && !isPaymentPortal) {
      document.documentElement.classList.add('bp4-dark');
      document.body.classList.add('bp4-dark');
    } else {
      document.documentElement.classList.remove('bp4-dark');
      document.body.classList.remove('bp4-dark');
    }
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    window.dispatchEvent(
      new CustomEvent('borngreat-theme-changed', { detail: theme }),
    );
  }
  return theme;
}

export function cycleAppTheme(): AppThemeDefinition {
  const currentId = getCurrentAppThemeId();
  const currentIndex = APP_THEMES.findIndex((t) => t.id === currentId);
  const nextIndex = (currentIndex + 1) % APP_THEMES.length;
  return applyAppTheme(APP_THEMES[nextIndex].id);
}
