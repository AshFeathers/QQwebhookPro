import { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Statistic,
  Progress,
  Space,
  Typography,
  Badge,
  Button,
  Tag,
  Divider
} from '@arco-design/web-react';
import {
  IconRefresh,
  IconLink,
  IconSafe,
  IconHistory,
  IconClockCircle,
  IconDesktop,
  IconExclamationCircle
} from '@arco-design/web-react/icon';
import { api } from '../api';
import type { LogEntry, Connection } from '../types';

const { Row, Col } = Grid;
const { Text } = Typography;

interface DashboardProps {
  logs: LogEntry[];
  connections: Connection[];
  blockedSecrets: string[];
  isConnected: boolean;
  onRefresh: () => void;
  loading: boolean;
  onNavigate?: (tab: string) => void; // 添加导航回调
}

interface DashboardStats {
  connections: { total: number; active: number; };
  secrets: { total: number; blocked: number; };
  logs: { total: number; errors: number; warnings: number; };
  system: { uptime: number; memory: number; cpu: number; };
}

export default function EnhancedDashboard({
  logs,
  connections,
  blockedSecrets,
  isConnected,
  onRefresh,
  loading,
  onNavigate
}: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await api.getDashboardStats();
      setStats(response);
    } catch (error) {
      // 静默处理错误，避免控制台污染
    } finally {
      setStatsLoading(false);
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const getMemoryColor = (usage: number) => {
    if (usage > 80) return '#ff4d4f';
    if (usage > 60) return '#faad14';
    return '#52c41a';
  };

  const getCpuColor = (usage: number) => {
    if (usage > 80) return '#ff4d4f';
    if (usage > 60) return '#faad14';
    return '#52c41a';
  };

  // 计算活跃连接数
  const activeConnections = connections.filter(c => c.connected).length;
  const totalConnections = connections.length;
  const connectionRate = totalConnections > 0 ? (activeConnections / totalConnections) * 100 : 0;

  // 计算日志统计
  const errorLogs = logs.filter(log => log.level === 'error').length;
  const warningLogs = logs.filter(log => log.level === 'warning').length;
  const totalLogs = logs.length;

  return (
    <div>
      {/* 系统状态卡片 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconDesktop />
              <span>系统概览</span>
            </div>
            <Space>
              <Badge
                status={isConnected ? 'processing' : 'error'}
                text={isConnected ? 'WebSocket 已连接' : 'WebSocket 断开'}
              />
              <Button
                size="small"
                icon={<IconRefresh />}
                onClick={() => { onRefresh(); loadStats(); }}
                loading={loading || statsLoading}
              >
                刷新
              </Button>
            </Space>
          </div>
        }
        bordered={false}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[24, 24]}>
          {/* 连接统计 */}
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', height: '120px' }}>
              <Statistic
                title="活跃连接"
                value={activeConnections}
                suffix={`/ ${totalConnections}`}
                prefix={<IconLink style={{ color: '#1890ff' }} />}
                countUp
              />
              <Progress
                percent={connectionRate}
                size="small"
                color="#1890ff"
                showText={false}
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>

          {/* 密钥统计 */}
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', height: '120px' }}>
              <Statistic
                title="封禁密钥"
                value={blockedSecrets.length}
                suffix={stats?.secrets?.total ? `/ ${stats.secrets.total}` : ''}
                prefix={<IconSafe style={{ color: '#ff4d4f' }} />}
                countUp
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="red" size="small">
                  {blockedSecrets.length} 个被封禁
                </Tag>
              </div>
            </Card>
          </Col>

          {/* 日志统计 */}
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', height: '120px' }}>
              <Statistic
                title="错误日志"
                value={errorLogs}
                suffix={`/ ${totalLogs}`}
                prefix={<IconExclamationCircle style={{ color: '#faad14' }} />}
                countUp
              />
              <Space size="small" style={{ marginTop: '8px' }}>
                <Tag color="orange" size="small">{warningLogs} 警告</Tag>
                <Tag color="red" size="small">{errorLogs} 错误</Tag>
              </Space>
            </Card>
          </Col>

          {/* 运行时间 */}
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', height: '120px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <IconClockCircle style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                <Text bold>运行时间</Text>
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                  {stats?.system?.uptime ? formatUptime(stats.system.uptime) : '--'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 系统性能 */}
        <Col span={12}>
          <Card title="系统性能" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>内存使用率</Text>
                  <Text bold style={{ color: getMemoryColor(stats?.system.memory || 0) }}>
                    {stats?.system.memory || 0}%
                  </Text>
                </div>
                <Progress
                  percent={stats?.system.memory || 0}
                  color={getMemoryColor(stats?.system.memory || 0)}
                  size="small"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>CPU 使用率</Text>
                  <Text bold style={{ color: getCpuColor(stats?.system.cpu || 0) }}>
                    {stats?.system.cpu || 0}%
                  </Text>
                </div>
                <Progress
                  percent={stats?.system.cpu || 0}
                  color={getCpuColor(stats?.system.cpu || 0)}
                  size="small"
                />
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">服务器端口</Text>
                <Text code>3002</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">WebSocket 状态</Text>
                <Badge
                  status={isConnected ? 'processing' : 'error'}
                  text={isConnected ? '正常' : '断开'}
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* 最近日志 */}
        <Col span={12}>
          <Card
            title="最近日志"
            bordered={false}
            extra={
              <Button 
                size="small" 
                type="text"
                onClick={() => onNavigate?.('logs')}
              >
                查看全部
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {logs.slice(0, 5).map((log, index) => (
                <Card key={index} size="small" style={{ 
                  borderLeft: `3px solid ${log.level === 'error' ? '#ff4d4f' : log.level === 'warning' ? '#faad14' : '#52c41a'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <Badge 
                          status={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'success'} 
                          text={log.level.toUpperCase()}
                        />
                        <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </Text>
                      </div>
                      <Text style={{ fontSize: '13px' }}>{log.message}</Text>
                    </div>
                  </div>
                </Card>
              ))}
              {logs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  暂无日志记录
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" bordered={false} style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button 
              type="outline" 
              long 
              icon={<IconLink />}
              onClick={() => onNavigate?.('websocket')}
            >
              连接管理
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type="outline" 
              long 
              icon={<IconSafe />}
              onClick={() => onNavigate?.('secrets')}
            >
              密钥管理
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type="outline" 
              long 
              icon={<IconHistory />}
              onClick={() => onNavigate?.('logs')}
            >
              日志查看
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              type="outline" 
              long 
              icon={<IconExclamationCircle />}
              onClick={() => onNavigate?.('bans')}
            >
              封禁管理
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
