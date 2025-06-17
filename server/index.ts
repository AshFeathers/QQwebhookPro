import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { configManager } from './config.js';
import { Ed25519Signer } from './crypto.js';

// 扩展Express Request类型以支持user属性
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 初始化配置
await configManager.load();
const config = configManager.get();

const app = express();
const port = process.env.PORT || config.server.port;

// 中间件配置
app.use(cors({
  origin: config.server.cors.origin,
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// WebSocket连接管理
const activeConnections = new Map<string, any>();
const heartbeatIntervals = new Map<string, NodeJS.Timeout>();

// 认证相关
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const blockedSecrets = new Set<string>();
const banHistory = new Map<string, {
  secret: string;
  reason?: string;
  bannedAt: string;
  bannedBy: string;
}>();

// 认证中间件
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
}

// 日志存储
const logs: Array<{
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  details?: any;
}> = [];

// 日志记录函数
function log(level: 'debug' | 'info' | 'warning' | 'error', message: string, details?: any) {
  const logEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    level,
    message,
    details
  };
  logs.push(logEntry);
  
  // 根据配置的日志级别过滤
  const logLevels = ['debug', 'info', 'warning', 'error'];
  const currentLevelIndex = logLevels.indexOf(config.logging.level);
  const messageLevelIndex = logLevels.indexOf(level);
  
  if (messageLevelIndex >= currentLevelIndex) {
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
  }
  
  // 广播日志到所有连接的客户端
  broadcast('log', logEntry);
  
  // 保持最新配置的日志数量
  if (logs.length > config.logging.maxLogEntries) {
    logs.shift();
  }
}

// 广播消息到所有WebSocket客户端
function broadcast(type: string, data: any) {
  const message = JSON.stringify({ type, data });
  activeConnections.forEach((ws, secret) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(message);
      } catch (error) {
        log('error', `广播失败`, { secret, error: (error as Error).message });
      }
    }
  });
}

// API路由

// 根路由
app.get('/api', (req, res) => {
  res.json({
    name: "QQwebhook",
    msg: "欢迎使用QQ机器人webhook服务",
    status: "running",
    version: "2.0.0",
    config: {
      signatureValidation: config.security.enableSignatureValidation,
      maxConnections: config.security.maxConnectionsPerSecret
    }
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: activeConnections.size
  });
});

// ==================== 认证API ====================

// 登录端点
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
      return;
    }

    // 从配置中获取认证信息
    const authConfig = config.auth || { username: 'admin', password: 'admin123' };
    
    if (username === authConfig.username && password === authConfig.password) {
      const token = jwt.sign(
        { username, loginTime: Date.now() },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      log('info', '用户登录成功', { username });
      
      res.json({
        success: true,
        token,
        message: '登录成功'
      });
    } else {
      log('warning', '用户登录失败', { username });
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    log('error', '登录处理失败', { error: (error as Error).message });
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 登出端点
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  log('info', '用户登出', { username: req.user.username });
  res.json({ success: true, message: '登出成功' });
});

// 验证token端点
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ==================== API路由（需要认证） ====================

// Webhook处理端点
app.post('/api/webhook', async (req, res) => {
  try {
    const secret = req.query.secret as string;
    
    if (!secret) {
      log('error', 'Webhook请求缺少secret参数');
      res.status(400).json({ error: 'Secret required' });
      return;
    }

    const config = configManager.get();
    const payload = req.body;
    
    // 标记是否应该自动添加密钥（只在签名验证通过时设置）
    let shouldAutoAddSecret = false;
    
    // 处理回调验证请求（签名校验）
    if (payload.d && payload.d.event_ts && payload.d.plain_token) {
      log('info', '收到签名校验请求', { secret });
      
      if (config.security.enableSignatureValidation) {
        try {
          const result = await Ed25519Signer.generateSignature(
            secret, 
            payload.d.event_ts, 
            payload.d.plain_token
          );
          
          log('info', '签名校验成功', { secret, signature: result.signature });
          
          // 签名验证成功，标记可以自动添加密钥
          shouldAutoAddSecret = true;
          
          // 如果启用自动模式且密钥不存在，现在添加密钥
          if (!config.secrets[secret] && !config.security.requireManualKeyManagement) {
            await configManager.addSecret(secret, {
              description: '自动生成的密钥（签名验证通过）',
              enabled: true
            });
            log('info', '签名验证通过，自动添加新密钥', { secret });
          }
          
          await configManager.markSecretUsed(secret);
          res.json(result);
          return;
        } catch (error) {
          log('error', '签名校验失败', { secret, error: (error as Error).message });
          res.status(400).json({ error: 'Signature validation failed' });
          return;
        }
      } else {
        // 如果禁用了签名验证，仍然允许自动添加密钥（兼容性考虑）
        log('warning', '签名验证已禁用，允许连接', { secret });
        shouldAutoAddSecret = true;
        
        // 如果启用自动模式且密钥不存在，自动添加
        if (!config.secrets[secret] && !config.security.requireManualKeyManagement) {
          await configManager.addSecret(secret, {
            description: '自动生成的密钥（签名验证已禁用）',
            enabled: true
          });
          log('info', '签名验证已禁用，自动添加新密钥', { secret });
        }
        
        res.json({
          plain_token: payload.d.plain_token,
          signature: 'signature_disabled'
        });
        return;
      }
    }

    // 检查密钥是否被允许连接
    if (!configManager.isSecretEnabled(secret)) {
      log('warning', '密钥被禁用或不存在', { secret });
      res.status(403).json({ error: 'Secret disabled or not found' });
      return;
    }

    // 处理普通消息（不自动添加密钥，必须先通过签名验证）
    const bodyStr = JSON.stringify(req.body);
    log('info', '收到Webhook消息', { secret, bodyLength: bodyStr.length });

    // 获取对应的WebSocket连接
    const ws = activeConnections.get(secret);
    
    if (ws && ws.readyState === 1) {
      try {
        ws.send(bodyStr);
        log('info', '消息推送成功', { secret });
        await configManager.markSecretUsed(secret);
        res.json({ status: '推送成功' });
      } catch (error) {
        log('error', '消息推送失败', { secret, error: (error as Error).message });
        res.json({ status: '推送失败', error: (error as Error).message });
      }
    } else {
      log('warning', '未找到活跃连接', { secret });
      res.json({ status: '连接未就绪' });
    }

  } catch (error) {
    log('error', 'Webhook处理异常', { error: (error as Error).message });
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取日志
app.get('/api/logs', authenticateToken, (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const level = req.query.level as string;
  
  let filteredLogs = logs;
  
  if (level) {
    filteredLogs = logs.filter(log => log.level === level);
  }
  
  res.json({
    logs: filteredLogs.slice(-limit).reverse(),
    total: filteredLogs.length
  });
});

// 获取连接状态
app.get('/api/connections', authenticateToken, (req, res) => {
  const connections = Array.from(activeConnections.keys()).map(secret => {
    const secretConfig = config.secrets[secret];
    return {
      secret,
      connected: activeConnections.get(secret)?.readyState === 1,
      enabled: configManager.isSecretEnabled(secret),
      description: secretConfig?.description,
      createdAt: secretConfig?.createdAt,
      lastUsed: secretConfig?.lastUsed,
      connectedAt: new Date().toISOString() // 实际应存储真实连接时间
    };
  });
  
  res.json({ connections, total: connections.length });
});

// 配置管理API
app.get('/api/config', authenticateToken, (req, res) => {
  res.json(configManager.get());
});

app.put('/api/config', authenticateToken, async (req, res) => {
  try {
    await configManager.update(req.body);
    log('info', '配置已更新');
    res.json({ success: true });
  } catch (error) {
    log('error', '更新配置失败', { error: (error as Error).message });
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 密钥管理API
app.get('/api/secrets', authenticateToken, (req, res) => {
  const secrets = Object.entries(config.secrets).map(([secret, config]) => ({
    secret,
    enabled: config.enabled,
    description: config.description,
    maxConnections: config.maxConnections,
    createdAt: config.createdAt,
    lastUsed: config.lastUsed
  }));
  res.json({ secrets });
});

app.post('/api/secrets', authenticateToken, async (req, res) => {
  try {
    const { secret, description, enabled = true, maxConnections } = req.body;
    if (!secret) {
      res.status(400).json({ error: '密钥不能为空' });
      return;
    }
    
    await configManager.addSecret(secret, { description, enabled, maxConnections });
    log('info', '新增密钥', { secret, description });
    res.json({ success: true });
  } catch (error) {
    log('error', '添加密钥失败', { error: (error as Error).message });
    res.status(500).json({ error: '添加密钥失败' });
  }
});

app.put('/api/secrets/:secret', authenticateToken, async (req, res) => {
  try {
    const { secret } = req.params;
    const updates = req.body;
    
    await configManager.updateSecret(secret, updates);
    log('info', '更新密钥配置', { secret, updates });
    res.json({ success: true });
  } catch (error) {
    log('error', '更新密钥失败', { error: (error as Error).message });
    res.status(500).json({ error: '更新密钥失败' });
  }
});

app.delete('/api/secrets/:secret', authenticateToken, async (req, res) => {
  try {
    const { secret } = req.params;
    
    await configManager.removeSecret(secret);
    
    // 断开对应的WebSocket连接
    const ws = activeConnections.get(secret);
    if (ws) {
      ws.close();
      activeConnections.delete(secret);
    }
    
    log('info', '删除密钥', { secret });
    res.json({ success: true });
  } catch (error) {
    log('error', '删除密钥失败', { error: (error as Error).message });
    res.status(500).json({ error: '删除密钥失败' });
  }
});

// WebSocket 管理API
app.post('/api/connections/:secret/kick', authenticateToken, async (req, res) => {
  try {
    const { secret } = req.params;
    
    const ws = activeConnections.get(secret);
    if (ws && ws.readyState === 1) {
      ws.close(1000, '管理员主动断开连接');
      activeConnections.delete(secret);
      log('info', '管理员踢出连接', { secret, admin: req.user.username });
      res.json({ success: true, message: '连接已断开' });
    } else {
      res.json({ success: false, message: '连接不存在或已断开' });
    }  } catch (error) {
    log('error', '踢出连接失败', { error: (error as Error).message });
    res.status(500).json({ success: false, error: '踢出连接失败' });
  }
});

app.post('/api/secrets/:secret/block', authenticateToken, async (req, res) => {
  try {
    const { secret } = req.params;
    const { reason } = req.body;
    const admin = req.user.username;
    
    // 更新密钥状态为禁用
    await configManager.updateSecret(secret, { enabled: false });
    
    // 记录封禁信息
    blockedSecrets.add(secret);
    banHistory.set(secret, {
      secret,
      reason: reason || '管理员封禁',
      bannedAt: new Date().toISOString(),
      bannedBy: admin
    });
    
    // 断开现有连接
    const ws = activeConnections.get(secret);
    if (ws && ws.readyState === 1) {
      ws.close(1000, '密钥已被封禁');
      activeConnections.delete(secret);
    }
    
    log('info', '管理员封禁密钥', { secret, reason, admin });
    res.json({ success: true, message: '密钥已封禁' });
  } catch (error) {
    log('error', '封禁密钥失败', { error: (error as Error).message });
    res.status(500).json({ success: false, error: '封禁密钥失败' });
  }
});

app.post('/api/secrets/:secret/unblock', authenticateToken, async (req, res) => {
  try {
    const { secret } = req.params;
    const admin = req.user.username;
    
    // 更新密钥状态为启用
    await configManager.updateSecret(secret, { enabled: true });
    
    // 移除封禁记录
    blockedSecrets.delete(secret);
    banHistory.delete(secret);
    
    log('info', '管理员解除封禁', { secret, admin });
    res.json({ success: true, message: '密钥封禁已解除' });
  } catch (error) {
    log('error', '解除封禁失败', { error: (error as Error).message });
    res.status(500).json({ success: false, error: '解除封禁失败' });
  }
});

app.get('/api/secrets/blocked', authenticateToken, (req, res) => {
  try {
    const config = configManager.get();
    const blockedSecrets = Object.entries(config.secrets)
      .filter(([_, secretConfig]) => !secretConfig.enabled)
      .map(([secret, _]) => secret);
    
    // 获取详细的封禁信息
    const bans = Array.from(banHistory.values());
      res.json({ 
      blockedSecrets, 
      bans,
      total: blockedSecrets.length 
    });
  } catch (error) {
    log('error', '获取封禁列表失败', { error: (error as Error).message });
    res.status(500).json({ error: '获取封禁列表失败' });
  }
});

// 密钥导出API
app.get('/api/secrets/export', authenticateToken, async (req, res) => {
  try {
    const exportData = await configManager.exportSecrets();
    log('info', '导出密钥数据', { 
      admin: req.user.username, 
      count: exportData.metadata.totalSecrets 
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="secrets-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    log('error', '导出密钥失败', { error: (error as Error).message });
    res.status(500).json({ error: '导出密钥失败' });
  }
});

// 密钥导入API
app.post('/api/secrets/import', authenticateToken, async (req, res) => {
  try {
    const { secrets, metadata } = req.body;
    const { overwriteExisting = false } = req.query;
    
    if (!secrets || typeof secrets !== 'object') {
      res.status(400).json({ error: '无效的导入数据格式' });
      return;
    }
    
    const result = await configManager.importSecrets(
      { secrets, metadata },
      { overwriteExisting: overwriteExisting === 'true' }
    );
    
    log('info', '导入密钥数据', { 
      admin: req.user.username, 
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    log('error', '导入密钥失败', { error: (error as Error).message });
    res.status(500).json({ error: '导入密钥失败' });
  }
});

// 密钥统计API
app.get('/api/secrets/stats', authenticateToken, (req, res) => {
  try {
    const stats = configManager.getSecretsStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    log('error', '获取密钥统计失败', { error: (error as Error).message });
    res.status(500).json({ error: '获取密钥统计失败' });
  }
});

// 密钥批量操作API
app.post('/api/secrets/batch', authenticateToken, async (req, res) => {
  try {
    const { action, secrets: secretList } = req.body;
    
    if (!Array.isArray(secretList) || secretList.length === 0) {
      res.status(400).json({ error: '请提供有效的密钥列表' });
      return;
    }
    
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const secret of secretList) {
      try {
        switch (action) {
          case 'enable':
            await configManager.updateSecret(secret, { enabled: true });
            results.success++;
            break;
          case 'disable':
            await configManager.updateSecret(secret, { enabled: false });
            results.success++;
            break;
          case 'delete':
            await configManager.removeSecret(secret);
            // 断开对应的WebSocket连接
            const ws = activeConnections.get(secret);
            if (ws) {
              ws.close();
              activeConnections.delete(secret);
            }
            results.success++;
            break;
          default:
            results.errors.push(`密钥 ${secret}: 未知操作 ${action}`);
            results.failed++;
        }
      } catch (error: any) {
        results.errors.push(`密钥 ${secret}: ${error.message}`);
        results.failed++;
      }
    }
    
    log('info', '批量操作密钥', {
      admin: req.user.username,
      action,
      count: secretList.length,
      success: results.success,
      failed: results.failed
    });
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    log('error', '批量操作失败', { error: (error as Error).message });
    res.status(500).json({ error: '批量操作失败' });
  }
});

// 服务前端静态文件
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 创建HTTP服务器
const server = createServer(app);

// 创建WebSocket服务器
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/');
  const secret = pathParts[pathParts.length - 1];

  if (!secret || secret === 'ws') {
    log('error', 'WebSocket连接缺少密钥');
    ws.close();
    return;
  }

  const currentConfig = configManager.get();
  
  // 普通密钥必须先通过 Webhook 签名验证才能连接
  if (!currentConfig.secrets[secret]) {
    log('warning', 'WebSocket连接被拒绝：密钥不存在，请先通过 Webhook 签名验证', { secret });
    ws.close();
    return;
  }

  // 检查密钥是否被允许连接
  if (!configManager.isSecretEnabled(secret)) {
    log('warning', 'WebSocket连接被拒绝：密钥被禁用', { secret });
    ws.close();
    return;
  }

  // 检查连接数限制
  const secretConfig = config.secrets[secret];
  const maxConnections = secretConfig?.maxConnections || config.security.maxConnectionsPerSecret;
  const currentConnections = Array.from(activeConnections.values()).filter(
    (conn, index, arr) => arr.indexOf(conn) === index
  ).length;

  if (currentConnections >= maxConnections) {
    log('warning', 'WebSocket连接被拒绝：超出最大连接数', { secret, maxConnections });
    ws.close();
    return;
  }

  // 关闭旧连接
  const oldWs = activeConnections.get(secret);
  if (oldWs && oldWs.readyState === 1) {
    try {
      oldWs.close();
      log('info', '关闭旧的WebSocket连接', { secret });
    } catch (error) {
      log('error', '关闭旧连接失败', { secret, error: (error as Error).message });
    }
  }
    // 注册新连接
  activeConnections.set(secret, ws);
  log('info', 'WebSocket长连接已建立', { secret });

  // 发送连接确认
  ws.send(JSON.stringify({
    type: 'connected',
    data: { secret, timestamp: new Date().toISOString() }
  }));

  // 可配置的心跳机制
  const websocketConfig = config.websocket || { enableHeartbeat: false, heartbeatInterval: 30000 };
  
  if (websocketConfig.enableHeartbeat) {
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === 1) {
        try {
          ws.ping();
          log('debug', '发送心跳包', { secret, interval: websocketConfig.heartbeatInterval });
        } catch (error) {
          log('error', '心跳发送失败', { secret, error: (error as Error).message });
          clearInterval(heartbeatInterval);
          heartbeatIntervals.delete(secret);
        }
      } else {
        clearInterval(heartbeatInterval);
        heartbeatIntervals.delete(secret);
      }
    }, websocketConfig.heartbeatInterval);

    heartbeatIntervals.set(secret, heartbeatInterval);

    // 处理 pong 响应
    ws.on('pong', () => {
      log('debug', '收到心跳响应', { secret });
    });
  }

  // 处理客户端心跳消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'ping') {
        // 响应客户端心跳
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        log('debug', '回复客户端心跳', { secret });
      } else {
        log('info', '收到WebSocket消息', { secret, data });
      }
    } catch (error) {
      log('error', 'WebSocket消息解析失败', { secret, error: (error as Error).message });
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    activeConnections.delete(secret);
    
    // 清理心跳定时器
    const heartbeatInterval = heartbeatIntervals.get(secret);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatIntervals.delete(secret);
    }
    
    log('info', 'WebSocket长连接已关闭', { secret });
  });

  // 处理错误
  ws.on('error', (error) => {
    // 清理心跳定时器
    const heartbeatInterval = heartbeatIntervals.get(secret);
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatIntervals.delete(secret);
    }
    
    log('error', 'WebSocket连接错误', { secret, error: error.message });
  });
});

// 启动服务器
server.listen(port, () => {
  log('info', `服务器启动成功 - 端口: ${port}`);
  console.log(`
╔══════════════════════ QQwebhook 服务端 ═════════════════════╗
║                                                            ║
║  🌐 Web管理界面: http://localhost:${port}                     ║
║  🪝 Webhook接口: http://localhost:${port}/api/webhook?secret=YOUR_SECRET ║
║  📡 WebSocket地址: ws://localhost:${port}/ws/YOUR_SECRET      ║
║                                                            ║
║  🔐 签名验证: ${config.security.enableSignatureValidation ? '启用' : '禁用'}                              ║
║  📊 最大连接数: ${config.security.maxConnectionsPerSecret}                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGINT', () => {
  log('info', '服务器正在关闭...');
  server.close(() => {
    log('info', '服务器已关闭');
    process.exit(0);
  });
});
