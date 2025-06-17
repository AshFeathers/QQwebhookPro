import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Result, Button } from '@arco-design/web-react';
import { IconExclamationCircle } from '@arco-design/web-react/icon';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--color-bg-1, #f7f8fa)'
        }}>
          <Card style={{ maxWidth: 600, width: '90%' }}>
            <Result
              status="error"
              title="应用程序遇到错误"
              subTitle="很抱歉，应用程序遇到了意外错误。请尝试刷新页面或联系管理员。"
              extra={[
                <Button type="primary" key="reload" onClick={this.handleReload}>
                  刷新页面
                </Button>,
                <Button key="reset" onClick={this.handleReset}>
                  重试
                </Button>
              ]}
            />
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ 
                marginTop: 20, 
                padding: 16, 
                background: '#f5f5f5', 
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>错误详情:</div>
                <div style={{ color: '#ff4d4f' }}>{this.state.error.toString()}</div>
                {this.state.errorInfo && (
                  <div style={{ marginTop: 8, color: '#666' }}>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
