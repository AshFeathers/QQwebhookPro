import React, { useState, useEffect } from 'react';
import type { Connection } from '../types';
import { api } from '../api';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  color = 'blue',
  icon 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700'
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs opacity-70 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="opacity-60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const ServerStats: React.FC = () => {
  const [stats, setStats] = useState({
    status: '正在加载...',
    version: '-',
    connections: 0,
    uptime: '-'
  });
  const [connections, setConnections] = useState<Connection[]>([]);

  const loadStats = async () => {
    try {
      const [statusRes, connectionsRes] = await Promise.all([
        api.getStatus(),
        api.getConnections()
      ]);
      
      setStats({
        status: statusRes.status === 'running' ? '运行中' : '已停止',
        version: statusRes.version || '1.0.0',
        connections: connectionsRes.total || 0,
        uptime: '正常运行'
      });
      
      setConnections(connectionsRes.connections || []);
    } catch (error) {
      console.error('获取状态失败:', error);
      setStats(prev => ({
        ...prev,
        status: '连接失败'
      }));
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeConnections = connections.filter(conn => conn.connected).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatsCard
        title="服务状态"
        value={stats.status}
        color={stats.status === '运行中' ? 'green' : 'red'}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
      />
      
      <StatsCard
        title="活跃连接"
        value={activeConnections}
        description={`总共 ${stats.connections} 个密钥`}
        color="blue"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        }
      />
      
      <StatsCard
        title="服务版本"
        value={stats.version}
        color="yellow"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M7 8h10M7 8L5 6m2 2l2-2m8 0l2 2m-2-2l-2-2" />
          </svg>
        }
      />
      
      <StatsCard
        title="运行状态"
        value={stats.uptime}
        color="green"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
};

export default ServerStats;
