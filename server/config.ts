import fs from 'fs/promises';

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
    requireManualKeyManagement: boolean;
  };  auth: {
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

const defaultConfig: Config = {
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: {
      origin: ['*']
    }
  },  security: {
    enableSignatureValidation: true,
    defaultAllowNewConnections: true,
    maxConnectionsPerSecret: 5,
    requireManualKeyManagement: false // 默认自动模式
  },  auth: {
    username: 'admin',
    password: 'admin123',
    sessionTimeout: 86400000
  },
  ui: {
    theme: 'auto',
    primaryColor: '#165DFF',
    compactMode: false,
    language: 'zh-CN'
  },  logging: {
    level: 'info',
    maxLogEntries: 1000,
    enableFileLogging: false,
    logFilePath: './logs/webhook.log'
  },
  websocket: {
    enableHeartbeat: false,
    heartbeatInterval: 30000,
    heartbeatTimeout: 5000,
    clientHeartbeatInterval: 25000
  },
  secrets: {}
};

class ConfigManager {
  private config: Config = defaultConfig;
  private configPath: string;

  constructor(configPath = './config.json') {
    this.configPath = configPath;
  }  async load(): Promise<Config> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = { ...defaultConfig, ...JSON.parse(data) };
      
      // 确保关键配置字段存在
      if (!this.config.secrets) {
        this.config.secrets = {};
      }
      
      // 验证并修复配置完整性
      await this.validateAndRepairConfig();
      
      console.log(`✅ 配置文件加载成功: ${this.configPath}`);
      console.log(`📊 已加载 ${Object.keys(this.config.secrets).length} 个密钥`);
      
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('⚠️  配置文件不存在，创建默认配置');
      } else {
        console.error('❌ 配置文件损坏，使用默认配置:', error.message);
      }
      
      this.config = { ...defaultConfig };
      await this.save();
    }
    return this.config;
  }

  async save(): Promise<void> {
    try {
      // 创建配置备份
      await this.createBackup();
      
      // 保存配置
      const configData = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configPath, configData);
      
      console.log(`💾 配置已保存: ${this.configPath}`);
    } catch (error: any) {
      console.error('❌ 保存配置文件失败:', error);
      throw error;
    }
  }

  // 验证和修复配置完整性
  private async validateAndRepairConfig(): Promise<void> {
    let needsSave = false;

    // 确保所有密钥都有必要的字段
    for (const [secret, config] of Object.entries(this.config.secrets)) {
      if (!config.createdAt) {
        config.createdAt = new Date().toISOString();
        needsSave = true;
      }
      if (typeof config.enabled !== 'boolean') {
        config.enabled = true;
        needsSave = true;
      }
    }

    // 确保其他必要字段存在
    if (!this.config.ui) {
      this.config.ui = defaultConfig.ui;
      needsSave = true;
    }
    if (!this.config.websocket) {
      this.config.websocket = defaultConfig.websocket;
      needsSave = true;
    }

    if (needsSave) {
      await this.save();
      console.log('🔧 配置已自动修复');
    }
  }

  // 创建配置备份
  private async createBackup(): Promise<void> {
    try {
      const backupPath = `${this.configPath}.backup.${Date.now()}`;
      const data = await fs.readFile(this.configPath, 'utf-8');
      await fs.writeFile(backupPath, data);
      
      // 只保留最新的5个备份
      await this.cleanupBackups();
    } catch (error: any) {
      // 备份失败不应该阻止主要操作
      console.warn('⚠️  创建配置备份失败:', error.message);
    }
  }

  // 清理旧备份
  private async cleanupBackups(): Promise<void> {
    try {
      const { readdir, stat, unlink } = fs;
      const dir = require('path').dirname(this.configPath);
      const basename = require('path').basename(this.configPath);
      
      const files = await readdir(dir);
      const backupFiles = files
        .filter(file => file.startsWith(`${basename}.backup.`))
        .map(async file => {
          const filePath = require('path').join(dir, file);
          const stats = await stat(filePath);
          return { path: filePath, mtime: stats.mtime };
        });

      const backups = await Promise.all(backupFiles);
      backups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // 删除超过5个的旧备份
      for (let i = 5; i < backups.length; i++) {
        await unlink(backups[i].path);
      }
    } catch (error: any) {
      console.warn('⚠️  清理备份文件失败:', error.message);
    }
  }

  get(): Config {
    return this.config;
  }

  async update(updates: Partial<Config>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.save();
  }

  async addSecret(secret: string, options: {
    description?: string;
    enabled?: boolean;
    maxConnections?: number;
  } = {}): Promise<void> {
    this.config.secrets[secret] = {
      enabled: options.enabled ?? true,
      description: options.description,
      maxConnections: options.maxConnections,
      createdAt: new Date().toISOString()
    };
    await this.save();
  }

  async updateSecret(secret: string, updates: Partial<Config['secrets'][string]>): Promise<void> {
    if (this.config.secrets[secret]) {
      this.config.secrets[secret] = { ...this.config.secrets[secret], ...updates };
      await this.save();
    }
  }

  async removeSecret(secret: string): Promise<void> {
    delete this.config.secrets[secret];
    await this.save();
  }
  isSecretEnabled(secret: string): boolean {
    const secretConfig = this.config.secrets[secret];
    
    // 如果密钥已存在，直接返回其启用状态
    if (secretConfig) {
      return secretConfig.enabled;
    }
    
    // 如果密钥不存在，根据管理模式决定
    if (this.config.security.requireManualKeyManagement) {
      // 手动模式：只允许手动添加的密钥
      return false;
    } else {
      // 自动模式：允许新连接（根据默认配置）
      return this.config.security.defaultAllowNewConnections;
    }
  }
  async markSecretUsed(secret: string): Promise<void> {
    if (this.config.secrets[secret]) {
      this.config.secrets[secret].lastUsed = new Date().toISOString();
      await this.save();
    }
  }

  // 导出所有密钥数据
  async exportSecrets(): Promise<{ secrets: any; metadata: any }> {
    return {
      secrets: { ...this.config.secrets },
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        totalSecrets: Object.keys(this.config.secrets).length
      }
    };
  }

  // 导入密钥数据
  async importSecrets(data: { secrets: any; metadata?: any }, options: {
    overwriteExisting?: boolean;
    backupBefore?: boolean;
  } = {}): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const { overwriteExisting = false, backupBefore = true } = options;
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      if (backupBefore) {
        await this.createBackup();
      }

      for (const [secret, secretConfig] of Object.entries(data.secrets || {})) {
        try {
          if (this.config.secrets[secret] && !overwriteExisting) {
            result.skipped++;
            continue;
          }

          // 验证密钥配置格式
          if (typeof secretConfig === 'object' && secretConfig !== null) {
            const config = secretConfig as {
              enabled?: boolean;
              description?: string;
              maxConnections?: number;
              createdAt?: string;
              lastUsed?: string;
            };
            
            this.config.secrets[secret] = {
              enabled: config.enabled ?? true,
              description: config.description || '导入的密钥',
              maxConnections: config.maxConnections,
              createdAt: config.createdAt || new Date().toISOString(),
              lastUsed: config.lastUsed
            };
            result.imported++;
          } else {
            result.errors.push(`密钥 ${secret} 配置格式无效`);
          }
        } catch (error: any) {
          result.errors.push(`导入密钥 ${secret} 失败: ${error.message}`);
        }
      }

      await this.save();
      console.log(`📥 密钥导入完成: 导入 ${result.imported} 个，跳过 ${result.skipped} 个，错误 ${result.errors.length} 个`);

    } catch (error: any) {
      result.errors.push(`导入过程失败: ${error.message}`);
    }

    return result;
  }

  // 获取密钥统计信息
  getSecretsStats(): {
    total: number;
    enabled: number;
    disabled: number;
    recentlyUsed: number;
    neverUsed: number;
  } {
    const secrets = Object.values(this.config.secrets);
    const now = Date.now();
    const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7天

    return {
      total: secrets.length,
      enabled: secrets.filter(s => s.enabled).length,
      disabled: secrets.filter(s => !s.enabled).length,
      recentlyUsed: secrets.filter(s => s.lastUsed && (now - new Date(s.lastUsed).getTime()) < recentThreshold).length,
      neverUsed: secrets.filter(s => !s.lastUsed).length
    };
  }
}

export const configManager = new ConfigManager();
