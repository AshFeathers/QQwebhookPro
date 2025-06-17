import { useState, useEffect, useCallback } from 'react';
import { applyThemeToDOM } from '../theme/utils';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeConfig {
  theme: Theme;
  primaryColor: string;
  compactMode: boolean;
}

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  theme: 'auto',
  primaryColor: '#165DFF',
  compactMode: false
};

const THEME_STORAGE_KEY = 'qq-webhook-theme';

export function useTheme() {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored ? { ...DEFAULT_THEME_CONFIG, ...JSON.parse(stored) } : DEFAULT_THEME_CONFIG;
    } catch {
      return DEFAULT_THEME_CONFIG;
    }
  });

  const [isDark, setIsDark] = useState(false);

  // 检测系统主题
  const getSystemTheme = useCallback(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // 获取实际应用的主题
  const getEffectiveTheme = useCallback(() => {
    if (themeConfig.theme === 'auto') {
      return getSystemTheme();
    }
    return themeConfig.theme;
  }, [themeConfig.theme, getSystemTheme]);

  // 更新主题配置
  const updateThemeConfig = useCallback((config: Partial<ThemeConfig>) => {
    setThemeConfig(prev => {
      const newConfig = { ...prev, ...config };
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);

  // 应用主题到DOM
  const applyTheme = useCallback(() => {
    const effectiveTheme = getEffectiveTheme();
    const isDarkTheme = effectiveTheme === 'dark';
    
    setIsDark(isDarkTheme);
    
    // 使用新的主题工具函数
    applyThemeToDOM(effectiveTheme, themeConfig.primaryColor, themeConfig.compactMode);
  }, [themeConfig, getEffectiveTheme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeConfig.theme === 'auto') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeConfig.theme, applyTheme]);

  // 初始化主题
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // 切换主题的便捷方法
  const toggleTheme = useCallback(() => {
    const currentEffective = getEffectiveTheme();
    updateThemeConfig({ 
      theme: currentEffective === 'dark' ? 'light' : 'dark' 
    });
  }, [getEffectiveTheme, updateThemeConfig]);

  return {
    themeConfig,
    isDark,
    effectiveTheme: getEffectiveTheme(),
    updateThemeConfig,
    toggleTheme
  };
}
