import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

import { palette } from './colors';

export const fedisuiteDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.accent,
    background: palette.ink,
    card: palette.panel,
    text: palette.text,
    border: palette.line,
    notification: palette.accentWarm,
  },
};

export const fedisuiteLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.accentStrong,
    background: palette.canvas,
    card: palette.surface,
    text: palette.lightText,
    border: palette.lightLine,
    notification: palette.accentWarm,
  },
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
};
