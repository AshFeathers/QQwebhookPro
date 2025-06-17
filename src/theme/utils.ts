import { themeColors, lightTheme, darkTheme, componentStyles } from './colors';

// 生成CSS变量
export function generateCSSVariables(theme: 'light' | 'dark', primaryColor = '#165DFF') {
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme;
  
  return {
    // 主色调
    '--primary-color': primaryColor,
    '--primary-color-hover': adjustColor(primaryColor, 0.1),
    '--primary-color-active': adjustColor(primaryColor, -0.1),
    '--primary-color-disabled': adjustColor(primaryColor, 0.5),
    
    // 背景色
    '--color-bg-1': currentTheme.colors.bg.primary,
    '--color-bg-2': currentTheme.colors.bg.secondary,
    '--color-bg-3': currentTheme.colors.bg.tertiary,
    '--color-bg-4': currentTheme.colors.bg.quaternary,
    
    // 文字色
    '--color-text-1': currentTheme.colors.text.primary,
    '--color-text-2': currentTheme.colors.text.secondary,
    '--color-text-3': currentTheme.colors.text.tertiary,
    '--color-text-4': currentTheme.colors.text.quaternary,
    
    // 边框色
    '--color-border-1': currentTheme.colors.border.primary,
    '--color-border-2': currentTheme.colors.border.secondary,
    '--color-border-3': currentTheme.colors.border.tertiary,
    '--color-border-4': currentTheme.colors.border.quaternary,
    
    // 功能色
    '--color-success': themeColors.success[500],
    '--color-warning': themeColors.warning[500],
    '--color-danger': themeColors.danger[500],
    
    // 阴影
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.1)',
    '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
    '--shadow-lg': '0 8px 24px rgba(0, 0, 0, 0.2)',
    
    // 圆角
    '--border-radius': componentStyles.card.borderRadius,
    '--border-radius-sm': '4px',
    '--border-radius-lg': '12px',
    
    // 过渡时间
    '--transition-duration': '0.2s',
    '--transition-timing': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  };
}

// 颜色调整函数
export function adjustColor(color: string, amount: number): string {
  // 简单的颜色亮度调整，实际项目中可以使用更复杂的颜色库
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const adjust = (value: number) => {
    const newValue = Math.round(value + (255 - value) * amount);
    return Math.max(0, Math.min(255, newValue));
  };
  
  const newR = adjust(r).toString(16).padStart(2, '0');
  const newG = adjust(g).toString(16).padStart(2, '0');
  const newB = adjust(b).toString(16).padStart(2, '0');
  
  return `#${newR}${newG}${newB}`;
}

// 应用主题到DOM
export function applyThemeToDOM(theme: 'light' | 'dark', primaryColor = '#165DFF', compact = false) {
  const root = document.documentElement;
  const variables = generateCSSVariables(theme, primaryColor);
  
  // 设置CSS变量
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // 设置主题类
  if (theme === 'dark') {
    root.classList.add('dark');
    document.body.setAttribute('arco-theme', 'dark');
  } else {
    root.classList.remove('dark');
    document.body.removeAttribute('arco-theme');
  }
  
  // 设置紧凑模式
  if (compact) {
    root.classList.add('compact');
  } else {
    root.classList.remove('compact');
  }
}

// 获取主题相关的样式类
export function getThemeClassName(variant: string, size?: string) {
  const baseClass = `theme-${variant}`;
  return size ? `${baseClass} ${baseClass}--${size}` : baseClass;
}

// 生成状态颜色
export function getStatusColor(status: 'success' | 'warning' | 'danger' | 'info' | 'default') {
  switch (status) {
    case 'success':
      return themeColors.success[500];
    case 'warning':
      return themeColors.warning[500];
    case 'danger':
      return themeColors.danger[500];
    case 'info':
      return themeColors.primary[500];
    default:
      return themeColors.gray[500];
  }
}

// 生成渐变色
export function generateGradient(color1: string, color2: string, direction = '45deg') {
  return `linear-gradient(${direction}, ${color1}, ${color2})`;
}

// 主题工具类
export class ThemeUtils {
  static isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }
  
  static isCompactMode(): boolean {
    return document.documentElement.classList.contains('compact');
  }
  
  static getCurrentPrimaryColor(): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-color') || '#165DFF';
  }
  
  static toggleDarkMode(): void {
    const isDark = this.isDarkMode();
    applyThemeToDOM(isDark ? 'light' : 'dark', this.getCurrentPrimaryColor(), this.isCompactMode());
  }
  
  static toggleCompactMode(): void {
    const isCompact = this.isCompactMode();
    applyThemeToDOM(this.isDarkMode() ? 'dark' : 'light', this.getCurrentPrimaryColor(), !isCompact);
  }
}
