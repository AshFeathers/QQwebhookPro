import { useState } from 'react';
import {
  Card,
  Typography,
  Collapse,
  Space,
  Tag,
  Button,
  Message,
  Alert,
  Divider,
  Table
} from '@arco-design/web-react';
import {
  IconBook,
  IconCopy
} from '@arco-design/web-react/icon';

const { Title, Text, Paragraph } = Typography;
const { Item: CollapseItem } = Collapse;

interface ApiDocsProps {}

export default function ApiDocs({}: ApiDocsProps) {
  const [activeKey, setActiveKey] = useState(['1']);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      Message.success('已复制到剪贴板');
    } catch (error) {
      Message.error('复制失败');
    }
  };

  const webhookColumns = [
    {
      title: '参数',
      dataIndex: 'param',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '必填',
      dataIndex: 'required',
      width: 60,
      render: (required: boolean) => 
        <Tag color={required ? 'red' : 'gray'}>{required ? '是' : '否'}</Tag>
    },
    {
      title: '说明',
      dataIndex: 'description',
    },
  ];

  const webhookParams = [
    {
      param: 'secret',
      type: 'string',
      required: true,
      description: '在系统中配置的密钥，用于标识和验证请求来源'
    }
  ];

  const responseColumns = [
    {
      title: '字段',
      dataIndex: 'field',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (type: string) => <Tag color="green">{type}</Tag>
    },
    {
      title: '说明',
      dataIndex: 'description',
    },
  ];

  const responseFields = [
    {
      field: 'plain_token',
      type: 'string',
      description: '原始令牌（仅在验证请求时返回）'
    },
    {
      field: 'signature',
      type: 'string',
      description: '签名结果（启用签名验证时）'
    },
    {
      field: 'status',
      type: 'string',
      description: '消息推送状态'
    },
    {
      field: 'error',
      type: 'string',
      description: '错误信息（发生错误时）'
    }
  ];

  const codeExamples = {
    curl: `# 发送Webhook消息
curl -X POST "http://localhost:3002/api/webhook?secret=YOUR_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "message",
    "data": {
      "user_id": "12345",
      "message": "Hello World",
      "timestamp": 1634567890
    }
  }'`,
    
    javascript: `// JavaScript 示例
const webhook = {
  url: 'http://localhost:3002/api/webhook?secret=YOUR_SECRET',
  data: {
    event: 'message',
    data: {
      user_id: '12345',
      message: 'Hello World',
      timestamp: Date.now()
    }
  }
};

fetch(webhook.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(webhook.data)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));`,

    python: `# Python 示例
import requests
import json

webhook_url = "http://localhost:3002/api/webhook?secret=YOUR_SECRET"
data = {
    "event": "message",
    "data": {
        "user_id": "12345",
        "message": "Hello World",
        "timestamp": 1634567890
    }
}

try:
    response = requests.post(
        webhook_url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(data)
    )
    print("Response:", response.json())
except Exception as e:
    print("Error:", e)`,

    websocket: `// WebSocket 客户端示例
const ws = new WebSocket('ws://localhost:3002/ws/YOUR_SECRET');

ws.onopen = function(event) {
    console.log('WebSocket连接已建立');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
    
    // 处理不同类型的消息
    if (data.type === 'log') {
        console.log('日志消息:', data.data);
    } else {
        console.log('Webhook消息:', data);
    }
};

ws.onerror = function(error) {
    console.error('WebSocket错误:', error);
};

ws.onclose = function(event) {
    console.log('WebSocket连接已关闭');
};`
  };

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconBook />
            <Title heading={5} style={{ margin: 0 }}>API 接入文档</Title>
          </div>
        }
        bordered={false}
      >
        <Alert
          type="info"
          content="欢迎使用 QQ Webhook Pro！本文档将帮助您快速集成和使用我们的 Webhook 服务。"
          style={{ marginBottom: '24px' }}
        />        <Collapse 
          activeKey={activeKey} 
          onChange={(keys) => setActiveKey(Array.isArray(keys) ? keys : [keys])}
          accordion={false}
        >
          {/* 快速开始 */}
          <CollapseItem header="🚀 快速开始" name="1">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title heading={6}>1. 配置密钥</Title>
                <Text>在"密钥管理"页面添加您的密钥，启用后即可开始使用。</Text>
              </div>
              
              <div>
                <Title heading={6}>2. 连接 WebSocket</Title>                <div style={{ background: '#f7f8fa', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                  <Text code>ws://localhost:3002/ws/YOUR_SECRET</Text>
                  <Button 
                    size="mini" 
                    icon={<IconCopy />} 
                    style={{ marginLeft: '8px' }}
                    onClick={() => copyToClipboard('ws://localhost:3002/ws/YOUR_SECRET')}
                  />
                </div>
              </div>

              <div>
                <Title heading={6}>3. 发送 Webhook</Title>                <div style={{ background: '#f7f8fa', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                  <Text code>POST http://localhost:3002/api/webhook?secret=YOUR_SECRET</Text>
                  <Button 
                    size="mini" 
                    icon={<IconCopy />} 
                    style={{ marginLeft: '8px' }}
                    onClick={() => copyToClipboard('http://localhost:3002/api/webhook?secret=YOUR_SECRET')}
                  />
                </div>
              </div>
            </Space>
          </CollapseItem>

          {/* Webhook API */}
          <CollapseItem header="🪝 Webhook API" name="2">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title heading={6}>接口地址</Title>
                <div style={{ background: '#f7f8fa', padding: '12px', borderRadius: '4px' }}>
                  <Text code>POST /api/webhook</Text>
                </div>
              </div>

              <div>
                <Title heading={6}>请求参数</Title>
                <Table
                  columns={webhookColumns}
                  data={webhookParams}
                  pagination={false}
                  size="small"
                />
              </div>

              <div>
                <Title heading={6}>响应格式</Title>
                <Table
                  columns={responseColumns}
                  data={responseFields}
                  pagination={false}
                  size="small"
                />
              </div>

              <div>
                <Title heading={6}>特殊说明</Title>
                <Alert
                  type="warning"
                  content="首次连接时，QQ会发送验证请求，包含 d.event_ts 和 d.plain_token 字段。系统会自动处理签名验证并返回相应结果。"
                />
              </div>
            </Space>
          </CollapseItem>

          {/* WebSocket */}
          <CollapseItem header="📡 WebSocket 连接" name="3">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title heading={6}>连接地址</Title>                <div style={{ background: '#f7f8fa', padding: '12px', borderRadius: '4px' }}>
                  <Text code>ws://localhost:3002/ws/YOUR_SECRET</Text>
                </div>
              </div>

              <div>
                <Title heading={6}>消息格式</Title>
                <Paragraph>
                  WebSocket 会实时推送所有发送到对应密钥的 Webhook 消息。消息格式为原始的 JSON 数据。
                </Paragraph>
              </div>

              <div>
                <Title heading={6}>连接状态</Title>
                <ul>
                  <li><Tag color="green">连接成功</Tag> - 可以正常接收消息</li>
                  <li><Tag color="orange">连接中</Tag> - 正在建立连接</li>
                  <li><Tag color="red">连接断开</Tag> - 需要重新连接</li>
                </ul>
              </div>
            </Space>
          </CollapseItem>

          {/* 代码示例 */}
          <CollapseItem header="💻 代码示例" name="4">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title heading={6}>cURL 示例</Title>
                <div style={{ background: '#2d3748', color: '#fff', padding: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{codeExamples.curl}</pre>
                </div>
                <Button 
                  size="small" 
                  icon={<IconCopy />} 
                  style={{ marginTop: '8px' }}
                  onClick={() => copyToClipboard(codeExamples.curl)}
                >
                  复制代码
                </Button>
              </div>

              <div>
                <Title heading={6}>JavaScript 示例</Title>
                <div style={{ background: '#2d3748', color: '#fff', padding: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{codeExamples.javascript}</pre>
                </div>
                <Button 
                  size="small" 
                  icon={<IconCopy />} 
                  style={{ marginTop: '8px' }}
                  onClick={() => copyToClipboard(codeExamples.javascript)}
                >
                  复制代码
                </Button>
              </div>

              <div>
                <Title heading={6}>Python 示例</Title>
                <div style={{ background: '#2d3748', color: '#fff', padding: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{codeExamples.python}</pre>
                </div>
                <Button 
                  size="small" 
                  icon={<IconCopy />} 
                  style={{ marginTop: '8px' }}
                  onClick={() => copyToClipboard(codeExamples.python)}
                >
                  复制代码
                </Button>
              </div>

              <div>
                <Title heading={6}>WebSocket 客户端示例</Title>
                <div style={{ background: '#2d3748', color: '#fff', padding: '16px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{codeExamples.websocket}</pre>
                </div>
                <Button 
                  size="small" 
                  icon={<IconCopy />} 
                  style={{ marginTop: '8px' }}
                  onClick={() => copyToClipboard(codeExamples.websocket)}
                >
                  复制代码
                </Button>
              </div>
            </Space>
          </CollapseItem>

          {/* 配置说明 */}
          <CollapseItem header="⚙️ 配置说明" name="5">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title heading={6}>签名验证</Title>
                <Paragraph>
                  启用后会验证 QQ 官方的 Ed25519 签名，确保消息来源的真实性。
                  禁用后可接受任何来源的 Webhook 请求（仅用于测试）。
                </Paragraph>
              </div>

              <div>
                <Title heading={6}>连接限制</Title>
                <Paragraph>
                  每个密钥最多允许指定数量的 WebSocket 连接，超出限制的连接会被自动断开。
                </Paragraph>
              </div>

              <div>
                <Title heading={6}>日志级别</Title>
                <ul>
                  <li><Tag>debug</Tag> - 显示所有日志信息</li>
                  <li><Tag>info</Tag> - 显示一般信息和错误</li>
                  <li><Tag>warning</Tag> - 仅显示警告和错误</li>
                  <li><Tag>error</Tag> - 仅显示错误信息</li>
                </ul>
              </div>
            </Space>
          </CollapseItem>          {/* 常见问题 */}
          <CollapseItem header="❓ 常见问题" name="6">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title heading={6}>Q: WebSocket 连接失败怎么办？</Title>
                <Paragraph>
                  1. 检查密钥是否正确且已启用<br/>
                  2. 确认服务器地址和端口是否正确<br/>
                  3. 检查网络连接和防火墙设置
                </Paragraph>
              </div>

              <div>
                <Title heading={6}>Q: 收不到 Webhook 消息怎么办？</Title>
                <Paragraph>
                  1. 确认 WebSocket 连接状态正常<br/>
                  2. 检查密钥参数是否匹配<br/>
                  3. 查看系统日志获取详细错误信息
                </Paragraph>
              </div>

              <div>
                <Title heading={6}>Q: 如何处理签名验证失败？</Title>
                <Paragraph>
                  1. 确认启用了签名验证功能<br/>
                  2. 检查服务器时间是否准确<br/>
                  3. 如果是测试环境，可以临时禁用签名验证
                </Paragraph>
              </div>

              <div>
                <Title heading={6}>Q: 如何提高安全性？</Title>
                <Paragraph>
                  1. 使用复杂的密钥字符串<br/>
                  2. 启用签名验证功能<br/>
                  3. 定期更换密钥<br/>
                  4. 监控连接状态和访问日志
                </Paragraph>
              </div>
            </Space>
          </CollapseItem>

          {/* WebSocket 心跳配置 */}
          <CollapseItem header="💓 WebSocket 心跳机制" name="5">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Alert
                type="info"
                title="心跳机制说明"
                content="心跳机制用于检测 WebSocket 连接状态，防止长时间无数据传输时连接被中断。"
                showIcon
              />

              <div>
                <Title heading={6}>服务器端配置</Title>
                <Paragraph>
                  在系统配置页面的 WebSocket 配置部分，可以设置以下参数：
                </Paragraph>
                <ul>
                  <li><strong>启用心跳检测</strong>：是否开启心跳机制</li>
                  <li><strong>服务器心跳间隔</strong>：服务器发送 ping 的间隔时间（推荐 30 秒）</li>
                  <li><strong>心跳超时时间</strong>：等待 pong 响应的超时时间（推荐 5 秒）</li>
                  <li><strong>客户端心跳间隔</strong>：客户端发送心跳的间隔时间（推荐 25 秒）</li>
                </ul>
              </div>

              <div>
                <Title heading={6}>客户端心跳实现</Title>
                <Paragraph>
                  客户端需要定期发送心跳消息，并处理服务器的心跳响应：
                </Paragraph>
                <div style={{
                  backgroundColor: '#f6f8fa',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  position: 'relative'
                }}>
                  <Button
                    type="text"
                    icon={<IconCopy />}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      opacity: 0.6
                    }}
                    onClick={() => copyToClipboard(`const ws = new WebSocket('ws://localhost:3002/ws/YOUR_SECRET');

// 心跳配置
let heartbeatInterval;
const HEARTBEAT_INTERVAL = 25000; // 25秒，比服务器心跳稍短

ws.onopen = function() {
    console.log('WebSocket 连接已建立');
    
    // 启动客户端心跳
    startHeartbeat();
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'pong') {
        console.log('收到服务器心跳响应');
    } else if (data.type === 'connected') {
        console.log('连接确认:', data.data);
    } else {
        console.log('收到消息:', data);
    }
};

ws.onclose = function(event) {
    console.log('连接已关闭');
    stopHeartbeat();
    
    // 非正常关闭时尝试重连
    if (event.code !== 1000) {
        setTimeout(() => {
            console.log('尝试重连...');
            // 重新建立连接
        }, 5000);
    }
};

ws.onerror = function(error) {
    console.error('WebSocket 错误:', error);
    stopHeartbeat();
};

// 启动心跳
function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
            }));
            console.log('发送客户端心跳');
        }
    }, HEARTBEAT_INTERVAL);
}

// 停止心跳
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}`)}
                  />
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`const ws = new WebSocket('ws://localhost:3002/ws/YOUR_SECRET');

// 心跳配置
let heartbeatInterval;
const HEARTBEAT_INTERVAL = 25000; // 25秒，比服务器心跳稍短

ws.onopen = function() {
    console.log('WebSocket 连接已建立');
    
    // 启动客户端心跳
    startHeartbeat();
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'pong') {
        console.log('收到服务器心跳响应');
    } else if (data.type === 'connected') {
        console.log('连接确认:', data.data);
    } else {
        console.log('收到消息:', data);
    }
};

ws.onclose = function(event) {
    console.log('连接已关闭');
    stopHeartbeat();
    
    // 非正常关闭时尝试重连
    if (event.code !== 1000) {
        setTimeout(() => {
            console.log('尝试重连...');
            // 重新建立连接
        }, 5000);
    }
};

ws.onerror = function(error) {
    console.error('WebSocket 错误:', error);
    stopHeartbeat();
};

// 启动心跳
function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
            }));
            console.log('发送客户端心跳');
        }
    }, HEARTBEAT_INTERVAL);
}

// 停止心跳
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <Title heading={6}>Python 心跳实现</Title>
                <Paragraph>
                  使用 websocket-client 库实现心跳机制：
                </Paragraph>
                <div style={{
                  backgroundColor: '#f6f8fa',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  position: 'relative'
                }}>
                  <Button
                    type="text"
                    icon={<IconCopy />}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      opacity: 0.6
                    }}
                    onClick={() => copyToClipboard(`import websocket
import json
import threading
import time

class HeartbeatWebSocket:
    def __init__(self, url):
        self.url = url
        self.ws = None
        self.heartbeat_thread = None
        self.heartbeat_interval = 25  # 25秒
        self.running = False
    
    def on_open(self, ws):
        print("WebSocket 连接已建立")
        self.running = True
        self.start_heartbeat()
    
    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            if data.get('type') == 'pong':
                print("收到服务器心跳响应")
            elif data.get('type') == 'connected':
                print(f"连接确认: {data.get('data')}")
            else:
                print(f"收到消息: {data}")
        except json.JSONDecodeError:
            print(f"收到非JSON消息: {message}")
    
    def on_error(self, ws, error):
        print(f"WebSocket 错误: {error}")
        self.stop_heartbeat()
    
    def on_close(self, ws, close_status_code, close_msg):
        print("WebSocket 连接已关闭")
        self.stop_heartbeat()
    
    def start_heartbeat(self):
        def heartbeat():
            while self.running and self.ws:
                try:
                    if self.ws.sock and self.ws.sock.connected:
                        heartbeat_msg = json.dumps({
                            'type': 'ping',
                            'timestamp': int(time.time() * 1000)
                        })
                        self.ws.send(heartbeat_msg)
                        print("发送客户端心跳")
                    time.sleep(self.heartbeat_interval)
                except Exception as e:
                    print(f"心跳发送失败: {e}")
                    break
        
        self.heartbeat_thread = threading.Thread(target=heartbeat)
        self.heartbeat_thread.daemon = True
        self.heartbeat_thread.start()
    
    def stop_heartbeat(self):
        self.running = False
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=1)
    
    def connect(self):
        self.ws = websocket.WebSocketApp(
            self.url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        self.ws.run_forever()

# 使用示例
if __name__ == "__main__":
    client = HeartbeatWebSocket("ws://localhost:3002/ws/YOUR_SECRET")
    client.connect()`)}
                  />
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px' }}>
{`import websocket
import json
import threading
import time

class HeartbeatWebSocket:
    def __init__(self, url):
        self.url = url
        self.ws = None
        self.heartbeat_thread = None
        self.heartbeat_interval = 25  # 25秒
        self.running = False
    
    def on_open(self, ws):
        print("WebSocket 连接已建立")
        self.running = True
        self.start_heartbeat()
    
    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            if data.get('type') == 'pong':
                print("收到服务器心跳响应")
            elif data.get('type') == 'connected':
                print(f"连接确认: {data.get('data')}")
            else:
                print(f"收到消息: {data}")
        except json.JSONDecodeError:
            print(f"收到非JSON消息: {message}")
    
    def on_error(self, ws, error):
        print(f"WebSocket 错误: {error}")
        self.stop_heartbeat()
    
    def on_close(self, ws, close_status_code, close_msg):
        print("WebSocket 连接已关闭")
        self.stop_heartbeat()
    
    def start_heartbeat(self):
        def heartbeat():
            while self.running and self.ws:
                try:
                    if self.ws.sock and self.ws.sock.connected:
                        heartbeat_msg = json.dumps({
                            'type': 'ping',
                            'timestamp': int(time.time() * 1000)
                        })
                        self.ws.send(heartbeat_msg)
                        print("发送客户端心跳")
                    time.sleep(self.heartbeat_interval)
                except Exception as e:
                    print(f"心跳发送失败: {e}")
                    break
        
        self.heartbeat_thread = threading.Thread(target=heartbeat)
        self.heartbeat_thread.daemon = True
        self.heartbeat_thread.start()
    
    def stop_heartbeat(self):
        self.running = False
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=1)
    
    def connect(self):
        self.ws = websocket.WebSocketApp(
            self.url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )
        self.ws.run_forever()

# 使用示例
if __name__ == "__main__":
    client = HeartbeatWebSocket("ws://localhost:3002/ws/YOUR_SECRET")
    client.connect()`}
                  </pre>
                </div>
              </div>

              <div>
                <Title heading={6}>心跳消息格式</Title>
                <Paragraph>
                  客户端和服务器之间的心跳消息使用以下 JSON 格式：
                </Paragraph>
                <div style={{
                  backgroundColor: '#f6f8fa',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>客户端发送 ping：</strong>
                    <pre style={{ margin: '8px 0 0 0' }}>
{`{
  "type": "ping",
  "timestamp": 1672531200000
}`}
                    </pre>
                  </div>
                  <div>
                    <strong>服务器回复 pong：</strong>
                    <pre style={{ margin: '8px 0 0 0' }}>
{`{
  "type": "pong",
  "timestamp": 1672531200000
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <Title heading={6}>配置建议</Title>
                <ul>
                  <li>客户端心跳间隔应比服务器心跳间隔短 5-10 秒</li>
                  <li>网络环境良好时可适当增加心跳间隔以减少开销</li>
                  <li>生产环境建议启用心跳检测以提高连接稳定性</li>
                  <li>修改心跳配置后需要重新连接 WebSocket 才能生效</li>
                  <li>心跳超时时间不宜设置过短，避免网络抖动导致误判</li>
                </ul>
              </div>
            </Space>
          </CollapseItem>
        </Collapse>

        <Divider />

        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="secondary">
            如有其他问题，请查看系统日志或联系技术支持
          </Text>
        </div>
      </Card>
    </div>
  );
}
