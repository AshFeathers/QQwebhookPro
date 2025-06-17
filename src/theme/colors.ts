// 主题颜色配置文件
export const themeColors = {
  // 主色调配置
  primary: {
    50: '#f0f7ff',
    100: '#c7e2ff',
    200: '#9dceff',
    300: '#74baff',
    400: '#4ba6ff',
    500: '#165DFF', // 主色
    600: '#0d4fff',
    700: '#0a42e5',
    800: '#0735cc',
    900: '#0429b3',
  },
  
  // 功能色配置
  success: {
    50: '#f0f9f5',
    100: '#d4edda',
    200: '#b8e2bf',
    300: '#9cd7a4',
    400: '#80cc89',
    500: '#00B42A', // 成功色
    600: '#00a024',
    700: '#008c1e',
    800: '#007818',
    900: '#006412',
  },
  
  warning: {
    50: '#fff8f0',
    100: '#ffe7d1',
    200: '#ffd6b2',
    300: '#ffc593',
    400: '#ffb474',
    500: '#FF7D00', // 警告色
    600: '#e67000',
    700: '#cc6300',
    800: '#b35600',
    900: '#994900',
  },
  
  danger: {
    50: '#fef2f2',
    100: '#fde8e8',
    200: '#fbd5d5',
    300: '#f8b4b4',
    400: '#f98080',
    500: '#F53F3F', // 危险色
    600: '#e53e3e',
    700: '#c53030',
    800: '#9b2c2c',
    900: '#742a2a',
  },
  
  // 中性色配置  
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// 主题模式配置
export const lightTheme = {
  colors: {
    bg: {
      primary: '#ffffff',
      secondary: '#f7f8fa',
      tertiary: '#f2f3f5',
      quaternary: '#e5e6eb',
    },
    text: {
      primary: '#1d2129',
      secondary: '#4e5969',
      tertiary: '#86909c',
      quaternary: '#c9cdd4',
    },
    border: {
      primary: '#f0f0f0',
      secondary: '#e5e6eb',
      tertiary: '#c9cdd4',
      quaternary: '#86909c',
    },
  },
};

export const darkTheme = {
  colors: {
    bg: {
      primary: '#17171a',
      secondary: '#1d1d21',
      tertiary: '#232324',
      quaternary: '#2a2a2b',
    },
    text: {
      primary: '#f7f8fa',
      secondary: '#c9cdd4',
      tertiary: '#86909c',
      quaternary: '#6b6b70',
    },
    border: {
      primary: '#3c3c3f',
      secondary: '#333334',
      tertiary: '#2a2a2b',
      quaternary: '#232324',
    },
  },
};

// 预设主题颜色
export const presetThemes = [
  { name: 'Arco 蓝', value: '#165DFF', description: '默认主题色' },
  { name: '科技紫', value: '#722ED1', description: '科技感十足' },
  { name: '活力橙', value: '#FF7D00', description: '充满活力' },
  { name: '成功绿', value: '#00B42A', description: '清新自然' },
  { name: '错误红', value: '#F53F3F', description: '警示醒目' },
  { name: '极客绿', value: '#52C41A', description: '程序员专属' },
  { name: '深空蓝', value: '#1890FF', description: '深邃神秘' },
  { name: '薄荷绿', value: '#36CFC9', description: '清凉薄荷' },
  { name: '梦幻紫', value: '#B37FEB', description: '梦幻浪漫' },
  { name: '暖阳黄', value: '#FADB14', description: '温暖阳光' },
];

// 组件样式配置
export const componentStyles = {
  card: {
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '16px',
  },
  button: {
    borderRadius: '6px',
    transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
  input: {
    borderRadius: '6px',
    transition: 'all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
  modal: {
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  },
};

// 动画配置
export const animations = {
  duration: {
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s',
  },
  easing: {
    ease: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    easeIn: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  },
};

// 布局配置
export const layout = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  compact: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
};
