import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const animations = {
  fadeIn: "animate-in fade-in duration-500",
  slideUp: "animate-in slide-in-from-bottom-4 duration-500",
  slideDown: "animate-in slide-in-from-top-4 duration-500",
  scaleIn: "animate-in zoom-in-95 duration-200",
  pulse: "animate-pulse",
};

export const colors = {
  primary: {
    50: "bg-blue-50 text-blue-900 border-blue-200",
    100: "bg-blue-100 text-blue-900 border-blue-300",
    500: "bg-blue-500 text-white border-blue-500",
    600: "bg-blue-600 text-white border-blue-600",
    700: "bg-blue-700 text-white border-blue-700",
  },
  success: {
    50: "bg-green-50 text-green-900 border-green-200",
    100: "bg-green-100 text-green-900 border-green-300",
    500: "bg-green-500 text-white border-green-500",
    600: "bg-green-600 text-white border-green-600",
  },
  warning: {
    50: "bg-yellow-50 text-yellow-900 border-yellow-200",
    100: "bg-yellow-100 text-yellow-900 border-yellow-300",
    500: "bg-yellow-500 text-white border-yellow-500",
    600: "bg-yellow-600 text-white border-yellow-600",
  },
  danger: {
    50: "bg-red-50 text-red-900 border-red-200",
    100: "bg-red-100 text-red-900 border-red-300",
    500: "bg-red-500 text-white border-red-500",
    600: "bg-red-600 text-white border-red-600",
  },
  gray: {
    50: "bg-gray-50 text-gray-900 border-gray-200",
    100: "bg-gray-100 text-gray-900 border-gray-300",
    500: "bg-gray-500 text-white border-gray-500",
    600: "bg-gray-600 text-white border-gray-600",
  }
};

export const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  
  if (diffMs < 60000) { // 小于1分钟
    return '刚刚';
  } else if (diffMs < 3600000) { // 小于1小时
    return `${Math.floor(diffMs / 60000)}分钟前`;
  } else if (diffMs < 86400000) { // 小于1天
    return `${Math.floor(diffMs / 3600000)}小时前`;
  } else {
    return `${Math.floor(diffMs / 86400000)}天前`;
  }
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};
