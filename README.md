# QQ Webhook Pro

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

一个现代化的 QQ 机器人 Webhook 转 WebSocket 服务，提供实时消息转发、管理界面和完整的 API 文档。

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [API 文档](#-api-接口) • [部署指南](#-部署指南) • [常见问题](#-常见问题)

</div>

## 📖 项目简介

QQ Webhook Pro 是一个高性能的 QQ 机器人消息转发服务，将传统的 HTTP Webhook 请求转换为实时的 WebSocket 连接，提供更优秀的开发体验和消息处理能力。项目采用 TypeScript 全栈开发，前端基于 React + Arco Design，后端使用 Express + WebSocket。

### 🎯 核心优势

- **🚀 实时性**: WebSocket 连接提供毫秒级消息推送
- **🛡️ 安全性**: 完整的签名验证和权限管理机制  
- **🎨 现代化**: 美观的管理界面，支持暗夜模式和主题定制
- **📊 可观测**: 完整的日志系统和实时监控面板
- **🔧 易用性**: 零配置启动，可视化管理所有功能

## ✨ 功能特性

### 🎯 核心功能
- **Webhook 转 WebSocket**: 将 HTTP Webhook 实时转发为 WebSocket 消息
- **多密钥管理**: 支持多个机器人密钥，独立管理和监控
- **签名验证**: Ed25519 数字签名确保消息安全性
- **自动/手动模式**: 支持自动添加密钥或手动管理模式

### 🌐 管理界面
- **现代化 UI**: 基于 Arco Design 的响应式设计
- **暗夜模式**: 完整的亮色/暗色主题支持，可跟随系统
- **实时监控**: WebSocket 连接状态、服务器统计、活动日志
- **可视化管理**: 密钥管理、连接管理、封禁管理

### 🛡️ 安全特性
- **JWT 认证**: 安全的会话管理和 API 访问控制
- **图形验证码**: 防止暴力破解攻击
- **IP 封禁**: 自动和手动封禁可疑连接
- **权限控制**: 细粒度的密钥权限管理

### 📊 监控和日志
- **实时日志**: 所有操作和错误的详细记录
- **性能监控**: CPU、内存使用率和连接统计
- **仪表盘**: 直观的数据可视化面板
- **日志分级**: 支持不同级别的日志输出

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.0+ 
- **npm**: 7.0+ 或 **yarn**: 1.22+
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### 安装和启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd qq-webhook-pro

# 2. 安装依赖
npm install

# 3. 启动开发环境
npm run dev
```

启动成功后访问：
- 🌐 **管理界面**: http://localhost:5173
- 🔧 **API 服务**: http://localhost:3002

### 首次登录

1. 打开管理界面: http://localhost:5173
2. 使用默认账号登录：
   - **用户名**: `admin`
   - **密码**: `admin123`
3. 完成图形验证码验证

### 快速配置

1. **添加密钥**: 进入「密钥管理」页面，添加机器人密钥
2. **配置 Webhook**: 将生成的 URL 配置到机器人平台
3. **连接 WebSocket**: 使用密钥连接 WebSocket 接收消息

## 📖 详细使用指南

### 1. 密钥管理

#### 添加新密钥
```bash
# 手动模式：在管理界面手动添加
1. 进入「密钥管理」页面
2. 点击「添加密钥」
3. 输入密钥标识和描述
4. 设置连接限制和权限

# 自动模式：通过 Webhook 签名验证自动添加
1. 启用自动密钥管理
2. 机器人首次请求时自动创建密钥
3. 需要通过签名验证才能成功添加
```

#### 密钥配置选项
- **描述**: 便于识别的密钥描述
- **启用状态**: 是否允许连接
- **最大连接数**: 同时连接的 WebSocket 数量限制
- **访问权限**: 细粒度的功能访问控制

### 2. Webhook 配置

将以下 URL 配置到你的机器人平台：

```
http://localhost:3002/api/webhook?secret=YOUR_SECRET_KEY
```

#### 支持的请求格式

**签名验证请求**:
```json
{
  "d": {
    "event_ts": "1640995200",
    "plain_token": "verification_token"
  }
}
```

**普通消息**:
```json
{
  "type": "message",
  "data": {
    "user_id": "12345",
    "content": "Hello World",
    "timestamp": 1640995200
  }
}
```

### 3. WebSocket 连接

#### JavaScript 示例
```javascript
const ws = new WebSocket('ws://localhost:3002/ws/YOUR_SECRET_KEY');

ws.onopen = function(event) {
    console.log('WebSocket 连接已建立');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
    
    // 处理不同类型的消息
    switch(data.type) {
        case 'log':
            console.log('系统日志:', data.data);
            break;
        case 'connected':
            console.log('连接确认:', data.data);
            break;
        default:
            console.log('Webhook 消息:', data);
    }
};

ws.onerror = function(error) {
    console.error('WebSocket 错误:', error);
};

ws.onclose = function(event) {
    console.log('WebSocket 连接已关闭');
    // 可以在这里实现重连逻辑
};
```

#### Python 示例
```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"收到消息: {data}")

def on_error(ws, error):
    print(f"WebSocket 错误: {error}")

def on_close(ws, close_status_code, close_msg):
    print("WebSocket 连接已关闭")

def on_open(ws):
    print("WebSocket 连接已建立")

if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://localhost:3002/ws/YOUR_SECRET_KEY",
                              on_open=on_open,
                              on_message=on_message,
                              on_error=on_error,
                              on_close=on_close)
    ws.run_forever()
```

### 4. 主题和界面定制

#### 主题配置
- **亮色/暗色模式**: 手动切换或跟随系统
- **主色调**: 支持多种预设颜色和自定义颜色
- **紧凑模式**: 适合小屏幕设备的紧凑布局
- **语言**: 支持中文和英文界面

#### 自定义主题
```javascript
// 通过 localStorage 自定义主题
localStorage.setItem('qq-webhook-theme', JSON.stringify({
  theme: 'dark',           // 'light' | 'dark' | 'auto'
  primaryColor: '#165DFF', // 主色调
  compactMode: false       // 紧凑模式
}));
```

## 📡 API 接口

### 认证接口

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 验证 Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### 密钥管理

#### 获取密钥列表
```http
GET /api/secrets
Authorization: Bearer <token>
```

#### 添加密钥
```http
POST /api/secrets
Authorization: Bearer <token>
Content-Type: application/json

{
  "secret": "my-bot-key",
  "description": "测试机器人",
  "enabled": true,
  "maxConnections": 5
}
```

#### 更新密钥
```http
PUT /api/secrets/:secret
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "更新的描述",
  "enabled": false
}
```

#### 删除密钥
```http
DELETE /api/secrets/:secret
Authorization: Bearer <token>
```

### 系统管理

#### 获取系统配置
```http
GET /api/config
Authorization: Bearer <token>
```

#### 更新系统配置
```http
PUT /api/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "security": {
    "enableSignatureValidation": true,
    "requireManualKeyManagement": false
  },
  "auth": {
    "sessionTimeout": 86400000
  }
}
```

#### 获取日志
```http
GET /api/logs?limit=100&level=error
Authorization: Bearer <token>
```

#### 获取连接状态
```http
GET /api/connections
Authorization: Bearer <token>
```

#### 获取仪表盘统计
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

### WebSocket 管理

#### 踢出连接
```http
POST /api/connections/:secret/kick
Authorization: Bearer <token>
```

#### 封禁密钥
```http
POST /api/secrets/:secret/block
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "违规行为"
}
```

#### 解除封禁
```http
POST /api/secrets/:secret/unblock
Authorization: Bearer <token>
```

## 🐳 部署指南

### Docker 部署

#### 构建和运行
```bash
# 构建镜像
docker build -t qq-webhook-pro .

# 运行容器
docker run -d \
  --name qq-webhook-pro \
  -p 3002:3002 \
  -v $(pwd)/config.json:/app/config.json \
  qq-webhook-pro
```

#### Docker Compose
```yaml
version: '3.8'
services:
  qq-webhook-pro:
    build: .
    ports:
      - "3002:3002"
    volumes:
      - ./config.json:/app/config.json
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    restart: unless-stopped
```

### 生产环境部署

#### 1. 构建项目
```bash
npm run build
```

#### 2. 启动生产服务
```bash
npm start
```

#### 3. 使用 PM2 管理进程
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/server/index.js --name qq-webhook-pro

# 设置开机自启
pm2 startup
pm2 save
```

#### 4. Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## ⚙️ 配置说明

### 配置文件结构 (config.json)

```json
{
  "server": {
    "port": 3002,                    // 服务器端口
    "host": "0.0.0.0",               // 绑定地址
    "cors": {
      "origin": ["*"]                // CORS 允许的域名
    }
  },
  "security": {
    "enableSignatureValidation": true,      // 启用签名验证
    "defaultAllowNewConnections": true,     // 默认允许新连接
    "maxConnectionsPerSecret": 5,           // 每个密钥最大连接数
    "requireManualKeyManagement": false     // 是否需要手动管理密钥
  },
  "auth": {
    "username": "admin",             // 管理员用户名
    "password": "admin123",          // 管理员密码
    "sessionTimeout": 86400000       // 会话超时时间(毫秒)
  },
  "ui": {
    "theme": "auto",                 // 主题模式: light/dark/auto
    "primaryColor": "#165DFF",       // 主色调
    "compactMode": false,            // 紧凑模式
    "language": "zh-CN"              // 语言: zh-CN/en-US
  },
  "logging": {
    "level": "info",                 // 日志级别: debug/info/warning/error
    "maxLogEntries": 1000,           // 最大日志条数
    "enableFileLogging": false,      // 启用文件日志
    "logFilePath": "./logs/webhook.log"  // 日志文件路径
  },
  "secrets": {
    "your-secret-key": {
      "enabled": true,               // 是否启用
      "description": "机器人描述",    // 描述信息
      "createdAt": "2025-06-15T00:00:00.000Z",  // 创建时间
      "lastUsed": "2025-06-15T00:00:00.000Z"    // 最后使用时间
    }
  }
}
```

### 环境变量

```bash
# 服务器配置
PORT=3002                           # 服务器端口
NODE_ENV=production                 # 运行环境

# 安全配置  
JWT_SECRET=your-jwt-secret          # JWT 签名密钥

# 日志配置
LOG_LEVEL=info                      # 日志级别
LOG_FILE=./logs/webhook.log         # 日志文件路径
```

## 🔧 开发指南

### 项目结构

```
qq-webhook-pro/
├── server/                 # 后端服务
│   ├── index.ts           # 主服务文件
│   ├── config.ts          # 配置管理
│   └── crypto.ts          # 加密和签名
├── src/                   # 前端源码
│   ├── components/        # React 组件
│   ├── hooks/            # 自定义 Hooks
│   ├── api.ts            # API 接口
│   └── types.ts          # 类型定义
├── public/               # 静态资源
├── config.json           # 配置文件
└── package.json          # 项目配置
```

### 开发脚本

```bash
# 开发环境
npm run dev                # 同时启动前后端开发服务器
npm run client:dev         # 仅启动前端开发服务器
npm run server:dev         # 仅启动后端开发服务器

# 构建
npm run build              # 构建整个项目
npm run client:build       # 仅构建前端
npm run server:build       # 仅构建后端

# 其他
npm run lint               # 代码检查
npm run preview            # 预览构建结果
```

### 技术栈

**前端**:
- React 19 + TypeScript
- Arco Design (UI 组件库)
- Vite (构建工具)
- Axios (HTTP 客户端)

**后端**:
- Node.js + Express
- TypeScript
- WebSocket (ws)
- JWT 认证
- Ed25519 签名验证

## 🆘 常见问题

### 安装和启动问题

**Q: npm install 失败？**
```bash
# 清除缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: 启动时端口被占用？**
```bash
# 修改配置文件中的端口
# 或者设置环境变量
PORT=3003 npm run dev
```

### 连接问题

**Q: WebSocket 连接失败？**
- 检查密钥是否正确
- 确认密钥已通过 Webhook 签名验证
- 检查防火墙和网络设置
- 查看浏览器控制台错误信息

**Q: Webhook 请求返回 403？**
- 确认密钥参数是否正确
- 检查密钥是否已启用
- 验证签名是否正确
- 查看服务器日志获取详细错误

### 配置问题

**Q: 忘记管理员密码？**
```bash
# 删除配置文件，重启服务器会重置为默认密码
rm config.json
npm restart
# 默认用户名: admin, 密码: admin123
```

**Q: 如何修改默认配置？**
```bash
# 直接编辑 config.json 文件
# 或者通过管理界面的「系统配置」页面修改
```

### 性能问题

**Q: 内存使用过高？**
- 减少日志保留数量 (`maxLogEntries`)
- 限制同时连接数 (`maxConnectionsPerSecret`)
- 启用日志文件输出，减少内存缓存

**Q: WebSocket 连接经常断开？**
- 检查网络稳定性
- 增加心跳检测
- 实现自动重连机制

### 安全问题

**Q: 如何增强安全性？**
- 启用签名验证 (`enableSignatureValidation`)
- 使用强密码和自定义 JWT 密钥
- 启用手动密钥管理模式
- 配置防火墙和反向代理

## 📊 性能优化

### 系统调优

```bash
# 1. 增加系统文件描述符限制
ulimit -n 65536

# 2. 优化 Node.js 内存使用
node --max-old-space-size=4096 dist/server/index.js

# 3. 启用集群模式 (可选)
npm install -g pm2
pm2 start ecosystem.config.js
```

### 监控和告警

```bash
# 使用 PM2 监控
pm2 monit

# 查看实时日志
pm2 logs qq-webhook-pro

# 设置内存告警
pm2 start app.js --max-memory-restart 1000M
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！

### 贡献方式

1. **提交 Issue**: 报告 Bug 或提出功能需求
2. **提交 PR**: 修复问题或添加新功能
3. **完善文档**: 改进文档和示例代码
4. **分享经验**: 分享使用心得和最佳实践

### 开发流程

```bash
# 1. Fork 项目到你的 GitHub
# 2. 克隆到本地
git clone https://github.com/your-username/qq-webhook-pro.git

# 3. 创建功能分支
git checkout -b feature/new-feature

# 4. 开发和测试
npm run dev
npm run lint

# 5. 提交更改
git add .
git commit -m "feat: add new feature"

# 6. 推送分支
git push origin feature/new-feature

# 7. 创建 Pull Request
```

### 代码规范

- 使用 TypeScript 和 ESLint
- 遵循 Conventional Commits 规范
- 添加必要的单元测试
- 更新相关文档

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## 🙏 致谢

感谢以下开源项目和贡献者：

- [React](https://reactjs.org/) - 前端框架
- [Arco Design](https://arco.design/) - UI 组件库
- [Express](https://expressjs.com/) - 后端框架
- [ws](https://github.com/websockets/ws) - WebSocket 库
- [noble-ed25519](https://github.com/paulmillr/noble-ed25519) - 签名验证

## 📞 联系我们

- **项目主页**: [GitHub Repository](https://github.com/your-username/qq-webhook-pro)
- **问题反馈**: [Issues](https://github.com/your-username/qq-webhook-pro/issues)
- **功能请求**: [Feature Requests](https://github.com/your-username/qq-webhook-pro/discussions)

---

<div align="center">

**QQ Webhook Pro v2.0.0** - 让 QQ 机器人消息处理更简单、更高效！

Made with ❤️ by the QQ Webhook Pro Team

</div>

### 1. 首次登录

1. 打开管理界面：http://localhost:5173
2. 使用默认账号登录：
   - 用户名: `admin`
   - 密码: `admin123`
3. 输入验证码完成登录

### 2. 密钥管理

1. 进入「密钥管理」页面
2. 添加新的机器人密钥：
   - 输入密钥名称（如：测试机器人）
   - 点击「添加密钥」生成唯一密钥
3. 复制生成的 Webhook URL 和 WebSocket URL

### 3. 配置机器人平台

将生成的 Webhook URL 配置到对应的机器人平台：

```
http://localhost:3000/api/webhook?secret=YOUR_SECRET_KEY
```

### 4. 接收实时消息

使用 WebSocket URL 接收实时转发的消息：

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/YOUR_SECRET_KEY');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到消息:', data);
};
```

### 5. 系统配置

在「系统配置」页面可以修改：
- 管理员用户名和密码
- 会话超时时间
- 服务器端口等设置

## 📡 API 接口

### 认证接口
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出

### 密钥管理
- `GET /api/secrets` - 获取密钥列表
- `POST /api/secrets` - 添加新密钥
- `DELETE /api/secrets/:id` - 删除密钥

### Webhook 接口
- `POST /api/webhook?secret=KEY` - 接收 Webhook 消息

### WebSocket 连接
- `WS /ws/:secret` - WebSocket 连接端点

### 系统管理
- `GET /api/logs` - 获取系统日志
- `GET /api/stats` - 获取服务器统计
- `GET /api/config` - 获取系统配置
- `PUT /api/config` - 更新系统配置

## 🛡️ 安全特性

- **登录验证码**: 防止暴力破解
- **JWT 认证**: 安全的会话管理
- **IP 封禁**: 自动封禁异常 IP
- **密钥验证**: Webhook 请求密钥验证
- **CORS 配置**: 跨域请求控制

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t qq-webhook-pro .

# 运行容器
docker run -d -p 3000:3000 --name qq-webhook-pro qq-webhook-pro
```

## 📝 配置文件

系统配置保存在 `config.json` 文件中：

```json
{
  "port": 3000,
  "auth": {
    "username": "admin",
    "password": "admin123",
    "sessionTimeout": 3600
  },
  "secrets": [
    {
      "id": "1",
      "name": "测试机器人",
      "key": "generated-secret-key",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## 🔍 开发调试

### 查看日志
```bash
# 开发模式下查看后端日志
npm run server:dev

# 查看前端构建日志
npm run client:dev
```

### 环境变量
```bash
# 可选的环境变量
PORT=3000                    # 服务器端口
NODE_ENV=development         # 运行环境
JWT_SECRET=your-jwt-secret   # JWT 密钥
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add some feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## 📄 许可证

MIT License

## 🆘 常见问题

### Q: 忘记管理员密码怎么办？
A: 删除 `config.json` 文件，重启服务器会重置为默认密码 `admin123`。

### Q: WebSocket 连接失败？
A: 检查密钥是否正确，确保 WebSocket URL 格式为 `ws://localhost:3000/ws/YOUR_SECRET`。

### Q: Webhook 请求失败？
A: 检查密钥参数是否正确，URL 格式为 `http://localhost:3000/api/webhook?secret=YOUR_SECRET`。

### Q: 如何修改服务器端口？
A: 在系统配置页面修改端口设置，或直接编辑 `config.json` 文件。

## 📞 技术支持

如有问题或建议，请提交 Issue 或联系开发团队。

---

**QQ Webhook Pro v2.0.0** - 让 QQ 机器人消息处理更简单、更高效！
