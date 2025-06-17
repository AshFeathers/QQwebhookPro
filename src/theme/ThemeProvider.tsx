import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { ConfigProvider } from '@arco-design/web-react';
import { useTheme } from '../hooks/useTheme';
import { applyThemeToDOM } from './utils';

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext({});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { themeConfig, isDark, effectiveTheme } = useTheme();

  useEffect(() => {
    applyThemeToDOM(effectiveTheme, themeConfig.primaryColor, themeConfig.compactMode);
  }, [effectiveTheme, themeConfig.primaryColor, themeConfig.compactMode]);

  return (
    <ThemeContext.Provider value={{}}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: themeConfig.primaryColor,
          },
        }}
        componentConfig={{
          Card: {
            bordered: true,
          },
          Button: {
            shape: 'round',
          },
          Input: {
            allowClear: true,
          },
          Modal: {
            closable: true,
            maskClosable: false,
          },
        }}
      >
        <div className={`app-theme ${isDark ? 'dark' : 'light'} ${themeConfig.compactMode ? 'compact' : ''}`}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
