import React, { useState, useEffect } from 'react';
import type { LogEntry } from '../types';
import { Card, Button, Badge } from './ui';
import { formatTime, cn } from '../utils';

interface LogViewerProps {
  logs: LogEntry[];
  isLive?: boolean;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, isLive = false }) => {
  const [filter, setFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const filteredLogs = logs.filter(log => {
    if (levelFilter && log.level !== levelFilter) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const getLevelConfig = (level: string) => {
    switch (level) {
      case 'error': 
        return { 
          variant: 'danger' as const, 
          bgColor: 'bg-red-50 border-red-200',
          icon: '🚨'
        };
      case 'warning': 
        return { 
          variant: 'warning' as const, 
          bgColor: 'bg-yellow-50 border-yellow-200',
          icon: '⚠️'
        };
      case 'info': 
        return { 
          variant: 'info' as const, 
          bgColor: 'bg-blue-50 border-blue-200',
          icon: 'ℹ️'
        };
      default: 
        return { 
          variant: 'default' as const, 
          bgColor: 'bg-gray-50 border-gray-200',
          icon: '📝'
        };
    }
  };

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  useEffect(() => {
    if (isAutoScroll && isLive) {
      const container = document.getElementById('log-container');
      if (container) {
        container.scrollTop = 0;
      }
    }
  }, [logs, isAutoScroll, isLive]);

  return (
    <Card      title={
        <div className="flex items-center gap-2">
          <span>运行日志</span>
          {isLive && (
            <Badge variant="success" className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              实时
            </Badge>
          )}
        </div>
      }
      description={`共 ${filteredLogs.length} 条日志${filter || levelFilter ? ' (已过滤)' : ''}`}
      actions={
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="搜索日志..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
          />
          
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有级别</option>
            <option value="info">信息</option>
            <option value="warning">警告</option>
            <option value="error">错误</option>
          </select>

          {isLive && (
            <Button
              size="sm"
              variant={isAutoScroll ? 'primary' : 'secondary'}
              onClick={() => setIsAutoScroll(!isAutoScroll)}
            >
              自动滚动
            </Button>
          )}
        </div>
      }
    >
      <div 
        id="log-container"
        className="h-96 overflow-y-auto space-y-2"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">
              {logs.length === 0 ? '暂无日志' : '没有匹配的日志'}
            </p>
            <p className="text-sm">
              {logs.length === 0 ? '等待系统生成日志记录' : '尝试调整搜索条件'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const levelConfig = getLevelConfig(log.level);
            const isExpanded = expandedLogs.has(log.id);
            
            return (
              <div
                key={log.id}
                className={cn(
                  'p-4 rounded-lg border transition-all hover:shadow-sm cursor-pointer',
                  levelConfig.bgColor
                )}
                onClick={() => log.details && toggleLogExpansion(log.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {levelConfig.icon}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={levelConfig.variant} size="sm">
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                      {log.details && (
                        <span className="text-xs text-gray-400">
                          {isExpanded ? '点击折叠' : '点击展开详情'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                      {log.message}
                    </p>
                    
                    {log.details && isExpanded && (
                      <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">详细信息:</div>
                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  {log.details && (
                    <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <svg 
                        className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default LogViewer;
