import type { LogEntry, Connection, Secret, Config } from './types';

const API_BASE = '/api';

// 认证相关类型
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token?: string;
}

// 封禁管理类型
interface BanInfo {
  secret: string;
  reason?: string;
  bannedAt: string;
  bannedBy: string;
}

// 认证管理器
class AuthManager {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthHeaders(): HeadersInit {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

export const authManager = new AuthManager();

export const api = {
  // 认证相关
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.success && data.token) {
      authManager.setToken(data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authManager.getAuthHeaders(),
      });
    } finally {
      authManager.clearToken();
    }
  },

  async checkAuth(): Promise<AuthState> {
    if (!authManager.isAuthenticated()) {
      return { isAuthenticated: false };
    }
    
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        headers: authManager.getAuthHeaders(),
      });
      const data = await response.json();
      return { isAuthenticated: data.valid, token: authManager.getToken() || undefined };
    } catch {
      authManager.clearToken();
      return { isAuthenticated: false };
    }
  },

  // 数据获取相关（需要认证）
  async getLogs(limit?: number, level?: string): Promise<{ logs: LogEntry[], total: number }> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (level) params.append('level', level);
    
    const response = await fetch(`${API_BASE}/logs?${params}`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  async getConnections(): Promise<{ connections: Connection[], total: number }> {
    const response = await fetch(`${API_BASE}/connections`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  async getSecrets(): Promise<{ secrets: Secret[] }> {
    const response = await fetch(`${API_BASE}/secrets`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  async addSecret(secret: { secret: string; description?: string; enabled?: boolean; maxConnections?: number }): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/secrets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authManager.getAuthHeaders(),
      },
      body: JSON.stringify(secret),
    });
    return response.json();
  },

  async updateSecret(secret: string, updates: Partial<Secret>): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/secrets/${secret}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authManager.getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  async deleteSecret(secret: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/secrets/${secret}`, {
      method: 'DELETE',
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  // 配置管理
  async getConfig(): Promise<Config> {
    const response = await fetch(`${API_BASE}/config`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  async updateConfig(config: Partial<Config>): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authManager.getAuthHeaders(),
      },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  // 系统状态
  async getStatus(): Promise<any> {
    const response = await fetch(`${API_BASE}/status`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  // WebSocket 管理
  async kickConnection(secret: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/connections/${secret}/kick`, {
      method: 'POST',
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  // 封禁管理
  async blockSecret(secret: string, reason?: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/secrets/${secret}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authManager.getAuthHeaders(),
      },
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },

  async unblockSecret(secret: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/secrets/${secret}/unblock`, {
      method: 'POST',
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  async getBlockedSecrets(): Promise<{ blockedSecrets: string[], bans: BanInfo[] }> {
    const response = await fetch(`${API_BASE}/secrets/blocked`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  // 仪表盘统计
  async getDashboardStats(): Promise<{
    connections: { total: number; active: number; };
    secrets: { total: number; blocked: number; };
    logs: { total: number; errors: number; warnings: number; };
    system: { uptime: number; memory: number; cpu: number; };
  }> {
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  // 密钥导出导入相关
  async exportSecrets(): Promise<{ secrets: any; metadata: any }> {
    const response = await fetch(`${API_BASE}/secrets/export`, {
      headers: authManager.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('导出失败');
    }
    
    return response.json();
  },

  async importSecrets(data: { secrets: any; metadata?: any }, overwriteExisting = false): Promise<{
    success: boolean;
    result: { imported: number; skipped: number; errors: string[] };
  }> {
    const response = await fetch(`${API_BASE}/secrets/import?overwriteExisting=${overwriteExisting}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authManager.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('导入失败');
    }
    
    return response.json();
  },

  async getSecretsStats(): Promise<{
    success: boolean;
    stats: {
      total: number;
      enabled: number;
      disabled: number;
      recentlyUsed: number;
      neverUsed: number;
    };
  }> {
    const response = await fetch(`${API_BASE}/secrets/stats`, {
      headers: authManager.getAuthHeaders(),
    });
    return response.json();
  },

  async batchOperateSecrets(action: 'enable' | 'disable' | 'delete', secrets: string[]): Promise<{
    success: boolean;
    results: { success: number; failed: number; errors: string[] };
  }> {
    const response = await fetch(`${API_BASE}/secrets/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authManager.getAuthHeaders(),
      },
      body: JSON.stringify({ action, secrets }),
    });
    
    if (!response.ok) {
      throw new Error('批量操作失败');
    }
    
    return response.json();
  },
};

export type { LoginRequest, LoginResponse, AuthState, BanInfo };