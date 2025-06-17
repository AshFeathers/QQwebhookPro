import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Layout,
  Menu,
  Typography,
  Card,
  Badge,
  Space,
  Button,
  Message,
  Switch,
  Drawer,
  Divider,
  ConfigProvider
} from '@arco-design/web-react';
import {
  IconDashboard,
  IconSettings,
  IconSafe,
  IconHistory,
  IconLink,
  IconRefresh,
  IconMoon,
  IconSun,
  IconPoweroff,
  IconExclamationCircle,
  IconBook,
  IconPalette
} from '@arco-design/web-react/icon';
import { api, authManager } from './api';
import { useTheme } from './hooks/useTheme';
import { ThemeProvider } from './theme/ThemeProvider';
import type { LogEntry, Connection } from './types';
import SecretManager from './components/SecretManager';
import ConfigManager from './components/ConfigManager';
import ThemeSettings from './components/ThemeSettings';
import Login from './components/Login';
import BanManager from './components/BanManager';
import EnhancedDashboard from './components/EnhancedDashboard';
import ApiDocs from './components/ApiDocs';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', icon: <IconDashboard />, label: '仪表盘' },
  { key: 'websocket', icon: <IconLink />, label: '连接管理' },
  { key: 'secrets', icon: <IconSafe />, label: '密钥管理' },
  { key: 'bans', icon: <IconExclamationCircle />, label: '封禁管理' },
  { key: 'logs', icon: <IconHistory />, label: '系统日志' },
  { key: 'docs', icon: <IconBook />, label: 'API文档' },
  { key: 'config', icon: <IconSettings />, label: '系统配置' },
  { key: 'theme', icon: <IconPalette />, label: '主题设置' }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [blockedSecrets, setBlockedSecrets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    return localStorage.getItem('autoRefresh') === 'true';
  });
  const [refreshInterval, setRefreshInterval] = useState(() => {
    return parseInt(localStorage.getItem('refreshInterval') || '30000');
  });

  // 主题管理
  const { isDark, toggleTheme } = useTheme();
  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await api.checkAuth();
        setIsAuthenticated(authState.isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleRefresh = async () => {
    await loadData();
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setCurrentTab('dashboard');
      Message.success('已安全登出');
    } catch (error) {
      console.error('Logout error:', error);
      // 即使登出失败，也清除本地状态
      authManager.clearToken();
      setIsAuthenticated(false);
    }
  };

  // 自动刷新
  useEffect(() => {
    if (autoRefresh && isAuthenticated) {
      const timer = setInterval(loadData, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [autoRefresh, refreshInterval, isAuthenticated]);

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem('autoRefresh', autoRefresh.toString());
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem('refreshInterval', refreshInterval.toString());
  }, [refreshInterval]);

  // 加载初始数据
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, connectionsRes, blockedRes] = await Promise.all([
        api.getLogs(),
        api.getConnections(),
        api.getBlockedSecrets()
      ]);      setLogs(logsRes.logs || []);
      setConnections(connectionsRes.connections || []);
      setBlockedSecrets(blockedRes.blockedSecrets || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      Message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const kickConnection = async (secret: string) => {
    try {
      await api.kickConnection(secret);
      Message.success(`已踢出连接: ${secret}`);
      loadData();
    } catch (error) {
      Message.error('踢出连接失败');
    }
  };

  const blockSecret = async (secret: string) => {
    try {
      await api.blockSecret(secret);
      setBlockedSecrets(prev => [...prev, secret]);
      Message.success(`已封禁密钥: ${secret}`);
      loadData();
    } catch (error) {
      Message.error('封禁失败');
    }
  };

  const unblockSecret = async (secret: string) => {
    try {
      await api.unblockSecret(secret);
      setBlockedSecrets(prev => prev.filter(s => s !== secret));
      Message.success(`已解除封禁: ${secret}`);
      loadData();
    } catch (error) {
      Message.error('解除封禁失败');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <EnhancedDashboard
            logs={logs}
            connections={connections}
            blockedSecrets={blockedSecrets}
            isConnected={true}
            onRefresh={loadData}
            loading={loading}
            onNavigate={setCurrentTab}
          />
        );
        
      case 'websocket':
        return (
          <Card title="连接管理" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {connections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无活跃连接
                </div>
              ) : (
                connections.map((conn) => (
                  <Card key={conn.secret} size="small" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <Badge
                          status={conn.connected ? 'processing' : 'default'}
                          text={conn.connected ? '已连接' : '未连接'}
                        />
                        <strong style={{ fontFamily: 'monospace' }}>{conn.secret}</strong>
                        {conn.description && <span style={{ color: '#666' }}>({conn.description})</span>}
                        {blockedSecrets.includes(conn.secret) && (
                          <Badge count="已封禁" style={{ backgroundColor: '#ff4d4f' }} />
                        )}
                      </Space>
                      <Space>
                        {conn.lastUsed && (
                          <span style={{ fontSize: '12px', color: '#999' }}>
                            最后使用: {new Date(conn.lastUsed).toLocaleString()}
                          </span>
                        )}
                        {conn.connected && (
                          <Button 
                            size="small" 
                            type="outline" 
                            status="warning"
                            onClick={() => kickConnection(conn.secret)}
                          >
                            踢出
                          </Button>
                        )}
                        {blockedSecrets.includes(conn.secret) ? (
                          <Button 
                            size="small" 
                            type="outline" 
                            status="success"
                            onClick={() => unblockSecret(conn.secret)}
                          >
                            解除封禁
                          </Button>
                        ) : (
                          <Button 
                            size="small" 
                            type="outline" 
                            status="danger"
                            onClick={() => blockSecret(conn.secret)}
                          >
                            封禁
                          </Button>
                        )}
                      </Space>
                    </div>
                  </Card>
                ))
              )}
            </Space>
          </Card>
        );
        
      case 'secrets':
        return <SecretManager onRefresh={loadData} />;
        
      case 'bans':
        return <BanManager onRefresh={loadData} />;
        
      case 'logs':
        return (
          <Card title="系统日志" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无日志记录
                </div>
              ) : (
                logs.map((log, index) => (
                  <Card key={index} size="small" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <Badge 
                            status={
                              log.level === 'error' ? 'error' : 
                              log.level === 'warning' ? 'warning' : 
                              log.level === 'info' ? 'processing' : 'default'
                            } 
                          />
                          <span style={{ 
                            marginLeft: '8px', 
                            fontWeight: 'bold',
                            color: log.level === 'error' ? '#ff4d4f' : 
                                   log.level === 'warning' ? '#faad14' : '#52c41a'
                          }}>
                            {log.level.toUpperCase()}
                          </span>
                          <span style={{ marginLeft: '12px', fontSize: '12px', color: '#999' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ marginLeft: '20px' }}>
                          {log.message}
                          {log.details && (
                            <div style={{ 
                              marginTop: '4px', 
                              fontSize: '12px', 
                              color: '#666',
                              fontFamily: 'monospace',
                              backgroundColor: '#f6f6f6',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}>
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </Space>
          </Card>
        );
        
      case 'config':
        return <ConfigManager onRefresh={loadData} />;
        
      case 'theme':
        return <ThemeSettings onThemeChange={loadData} />;
        
      case 'docs':
        return <ApiDocs />;
        
      default:
        return null;
    }
  };

  // 如果正在检查认证状态，显示加载状态
  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--color-bg-1)'
      }}>
        <Card loading style={{ width: 300, height: 200 }} />
      </div>
    );
  }

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  return (
    <ThemeProvider>
      <Layout style={{ height: '100vh' }}>
        <Sider
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            background: 'var(--color-bg-2)',
            borderRight: '1px solid var(--color-border-2)',
          }}
          width={240}
          collapsedWidth={60}
        >
          <div style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 16px',
            borderBottom: '1px solid var(--color-border-2)',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--color-text-1)',
          }}>
            {collapsed ? '🚀' : '🚀 QQ Webhook Pro'}
          </div>

          <Menu
            selectedKeys={[currentTab]}
            style={{ background: 'transparent', border: 'none' }}
            onClickMenuItem={(key) => setCurrentTab(key)}
          >
            {menuItems.map((item) => (
              <Menu.Item key={item.key} style={{ margin: '4px 8px' }}>
                <Space>
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Space>
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Layout>
          <Header style={{
            background: 'var(--color-bg-2)',
            borderBottom: '1px solid var(--color-border-2)',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Space size="large">
              <Title heading={4} style={{ margin: 0, color: 'var(--color-text-1)' }}>
                {menuItems.find(item => item.key === currentTab)?.label}
              </Title>
            </Space>

            <Space>
              <Button
                type="outline"
                icon={<IconRefresh />}
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>

              <Button
                type="outline"
                icon={<IconSettings />}
                onClick={() => setSettingsVisible(true)}
              >
                设置
              </Button>

              <Button
                type="outline"
                icon={isDark ? <IconSun /> : <IconMoon />}
                onClick={toggleTheme}
              />

              <Button
                type="outline"
                icon={<IconPoweroff />}
                onClick={handleLogout}
                status="danger"
              >
                登出
              </Button>
            </Space>
          </Header>

          <Content style={{
            padding: '16px',
            background: 'var(--color-bg-1)',
            overflow: 'auto'
          }}>
            {renderContent()}
          </Content>
        </Layout>

        <Drawer
          title="快速设置"
          visible={settingsVisible}
          onCancel={() => setSettingsVisible(false)}
          footer={null}
          width={360}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card title="自动刷新" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>启用自动刷新</span>
                  <Switch
                    checked={autoRefresh}
                    onChange={setAutoRefresh}
                  />
                </div>
                
                {autoRefresh && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>刷新间隔</span>
                    <Space>
                      <Button
                        size="small"
                        type={refreshInterval === 10000 ? 'primary' : 'outline'}
                        onClick={() => setRefreshInterval(10000)}
                      >
                        10秒
                      </Button>
                      <Button
                        size="small"
                        type={refreshInterval === 30000 ? 'primary' : 'outline'}
                        onClick={() => setRefreshInterval(30000)}
                      >
                        30秒
                      </Button>
                      <Button
                        size="small"
                        type={refreshInterval === 60000 ? 'primary' : 'outline'}
                        onClick={() => setRefreshInterval(60000)}
                      >
                        1分钟
                      </Button>
                    </Space>
                  </div>
                )}
              </Space>
            </Card>

            <Divider />

            <Card title="显示设置" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>主题模式</span>
                  <Button
                    type="outline"
                    icon={isDark ? <IconSun /> : <IconMoon />}
                    onClick={toggleTheme}
                  >
                    {isDark ? '切换到日间' : '切换到夜间'}
                  </Button>
                </div>
              </Space>
            </Card>
          </Space>        </Drawer>
      </Layout>
    </ThemeProvider>
  );
}
