// 主题系统导出
export * from './colors';
export * from './utils';
export { ThemeProvider, useThemeContext } from './ThemeProvider';

// 便捷的主题常量
export const THEME_CONSTANTS = {
  STORAGE_KEY: 'qq-webhook-theme',
  DEFAULT_PRIMARY_COLOR: '#165DFF',
  ANIMATION_DURATION: '0.2s',
  BORDER_RADIUS: '6px',
} as const;
