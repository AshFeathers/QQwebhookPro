export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface Connection {
  secret: string;
  connected: boolean;
  enabled: boolean;
  description?: string;
  createdAt?: string;
  lastUsed?: string;
  connectedAt: string;
}

export interface Secret {
  secret: string;
  enabled: boolean;
  description?: string;
  maxConnections?: number;
  createdAt: string;
  lastUsed?: string;
}

export interface Config {
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
    };
  };  security: {
    enableSignatureValidation: boolean;
    defaultAllowNewConnections: boolean;
    maxConnectionsPerSecret: number;
    requireManualKeyManagement: boolean; // 是否需要手动管理密钥
  };auth: {
    username: string;
    password: string;
    sessionTimeout: number;
  };
  ui?: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    compactMode?: boolean;
    language?: 'zh-CN' | 'en-US';
  };  logging: {
    level: 'debug' | 'info' | 'warning' | 'error';
    maxLogEntries: number;
    enableFileLogging: boolean;
    logFilePath: string;
  };
  websocket?: {
    enableHeartbeat: boolean;
    heartbeatInterval: number;
    heartbeatTimeout: number;
    clientHeartbeatInterval: number;
  };
  secrets: {
    [key: string]: {
      enabled: boolean;
      description?: string;
      maxConnections?: number;
      createdAt: string;
      lastUsed?: string;
    };
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}
