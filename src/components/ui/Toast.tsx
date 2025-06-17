// 简单的 Toast 通知系统，完全避免 Arco Design 的 Message 组件
import React, { createContext, useContext, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // 显示动画
    setTimeout(() => setIsVisible(true), 10);
    
    // 自动移除
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#52c41a';
      case 'error':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      case 'info':
      default:
        return '#1890ff';
    }
  };

  return (
    <div
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        marginBottom: '8px',
        padding: '12px 16px',
        borderRadius: '6px',
        backgroundColor: getBackgroundColor(),
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '400px',
        wordBreak: 'break-word'
      }}
    >
      <span>{getIcon()}</span>
      <span>{toast.message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0',
          lineHeight: '1'
        }}
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// 全局 Toast API（不依赖于 Context）
let globalToastContainer: HTMLElement | null = null;
let globalToastRoot: any = null;
let globalToasts: Toast[] = [];

const createGlobalToastContainer = () => {
  if (!globalToastContainer) {
    globalToastContainer = document.createElement('div');
    globalToastContainer.id = 'global-toast-container';
    document.body.appendChild(globalToastContainer);
    globalToastRoot = createRoot(globalToastContainer);
  }
};

const renderGlobalToasts = () => {
  if (!globalToastRoot) return;
  
  globalToastRoot.render(
    <ToastContainer 
      toasts={globalToasts} 
      onRemove={(id) => {
        globalToasts = globalToasts.filter(toast => toast.id !== id);
        renderGlobalToasts();
      }} 
    />
  );
};

const showGlobalToast = (toast: Omit<Toast, 'id'>) => {
  createGlobalToastContainer();
  
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  globalToasts = [...globalToasts, { ...toast, id }];
  renderGlobalToasts();
};

// 导出全局 Toast API
export const Toast = {
  success: (message: string, duration?: number) => {
    showGlobalToast({ type: 'success', message, duration });
  },
  error: (message: string, duration?: number) => {
    showGlobalToast({ type: 'error', message, duration });
  },
  warning: (message: string, duration?: number) => {
    showGlobalToast({ type: 'warning', message, duration });
  },
  info: (message: string, duration?: number) => {
    showGlobalToast({ type: 'info', message, duration });
  }
};
