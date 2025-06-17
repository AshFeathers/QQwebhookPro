import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Message,
  Space,
  Typography,
  Divider,
  Select,
  Grid,
  Modal,
  Alert
} from '@arco-design/web-react';
import { IconSave, IconRefresh, IconLock, IconUser } from '@arco-design/web-react/icon';
import { api } from '../api';
import type { Config } from '../types';

const { Title, Text } = Typography;
const { Row, Col } = Grid;

// 自定义主题开关组件
const ThemeSwitch = ({ checkedText, uncheckedText, ...props }: any) => (
  <Switch 
    checkedText={checkedText}
    uncheckedText={uncheckedText}
    size="default"
    {...props}
    className={`theme-switch ${props.className || ''}`}
    style={{
      ...props.style
    }}
  />
);

interface ConfigManagerProps {
  onRefresh?: () => void;
}

export default function ConfigManager({ onRefresh }: ConfigManagerProps) {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.getConfig();
      setConfig(response);
      form.setFieldsValue(response);
    } catch (error) {
      Message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveConfig = async (values: any) => {
    try {
      setSaving(true);
      
      // 如果密码被更改，显示确认消息
      if (passwordChanged) {
        Message.info('密码将被更新，下次登录请使用新密码');
      }
      
      await api.updateConfig(values);
      Message.success('配置保存成功');
      setPasswordChanged(false);
      loadConfig();
      onRefresh?.();
    } catch (error) {
      Message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title heading={5} style={{ margin: 0 }}>系统配置</Title>
            <Space>
              <Button
                icon={<IconRefresh />}
                onClick={loadConfig}
                loading={loading}
              >
                重新加载
              </Button>              <Button
                type="primary"
                icon={<IconSave />}
                onClick={() => {
                  if (passwordChanged) {
                    // 密码被修改时需要确认
                    Modal.confirm({
                      title: '确认保存配置',
                      content: '您即将更改管理员密码，这将影响下次登录。确定要继续吗？',
                      onOk: () => form.submit(),
                    });
                  } else {
                    form.submit();
                  }
                }}
                loading={saving}
              >
                保存配置
              </Button>
            </Space>
          </div>
        }
        bordered={false}
        loading={loading}
      >
        {config && (
          <Form
            form={form}
            layout="vertical"
            onSubmit={handleSaveConfig}
            initialValues={config}
          >            <Row gutter={24}>
              <Col span={12}>
                <Card title="服务器配置" size="small">
                  <Form.Item
                    label="服务端口"
                    field="server.port"
                    rules={[{ required: true, message: '请输入端口号' }]}
                  >
                    <InputNumber 
                      placeholder="3002" 
                      min={1}
                      max={65535}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="认证配置" size="small">
                  <Form.Item
                    label="管理员用户名"
                    field="auth.username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { minLength: 3, message: '用户名至少3个字符' }
                    ]}
                  >
                    <Input 
                      prefix={<IconUser />}
                      placeholder="admin"
                      allowClear
                    />
                  </Form.Item>                  <Form.Item
                    label="管理员密码"
                    field="auth.password"
                    rules={[
                      { required: true, message: '请输入密码' },
                      { minLength: 6, message: '密码至少6个字符' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<IconLock />}
                      placeholder="请输入新密码"
                      visibilityToggle
                      onChange={() => setPasswordChanged(true)}
                    />
                  </Form.Item>

                  <Form.Item
                    label="会话超时(小时)"
                    field="auth.sessionTimeout"
                    rules={[{ required: true, message: '请输入会话超时时间' }]}
                  >
                    <InputNumber 
                      min={1}
                      max={168}
                      step={1}
                      style={{ width: '100%' }}
                      placeholder="24"
                    />
                  </Form.Item>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={24}>
              <Col span={12}>                <Card title="安全配置" size="small">                  <Form.Item
                    label="启用签名验证"
                    field="security.enableSignatureValidation"
                  >
                    <ThemeSwitch 
                      checkedText="启用" 
                      uncheckedText="禁用"
                    />
                  </Form.Item>

                  <Form.Item
                    label="密钥管理模式"
                    field="security.requireManualKeyManagement"
                    tooltip="开启后需要手动添加密钥，关闭后自动接受新密钥"
                  >
                    <ThemeSwitch 
                      checkedText="手动管理" 
                      uncheckedText="自动模式"
                    />
                  </Form.Item>

                  <Form.Item
                    label="每个密钥最大连接数"
                    field="security.maxConnectionsPerSecret"
                    rules={[{ required: true, message: '请输入最大连接数' }]}
                  >
                    <InputNumber 
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={24}>
              <Col span={12}>
                <Card title="日志配置" size="small">
                  <Form.Item
                    label="日志级别"
                    field="logging.level"
                    rules={[{ required: true, message: '请选择日志级别' }]}
                  >
                    <Select placeholder="选择日志级别">
                      <Select.Option value="debug">Debug</Select.Option>
                      <Select.Option value="info">Info</Select.Option>
                      <Select.Option value="warning">Warning</Select.Option>
                      <Select.Option value="error">Error</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="最大日志条数"
                    field="logging.maxLogEntries"
                    rules={[{ required: true, message: '请输入最大日志条数' }]}
                  >
                    <InputNumber 
                      min={100}
                      max={10000}
                      step={100}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="系统信息" size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>当前端口:</Text>
                      <Text bold>{config?.server?.port || 3002}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>签名验证:</Text>
                      <Text bold>
                        {config?.security?.enableSignatureValidation ? '已启用' : '已禁用'}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>最大连接数:</Text>
                      <Text bold>{config?.security?.maxConnectionsPerSecret || 5}</Text>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>日志级别:</Text>
                      <Text bold>{config?.logging?.level || 'info'}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={24}>
              <Col span={24}>
                <Card title="WebSocket 配置" size="small">
                  <Row gutter={16}>
                    <Col span={8}>                      <Form.Item
                        label="启用心跳检测"
                        field="websocket.enableHeartbeat"
                        triggerPropName="checked"
                        tooltip="是否启用WebSocket心跳检测机制"
                      >
                        <ThemeSwitch 
                          checkedText="启用" 
                          uncheckedText="禁用"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="服务器心跳间隔 (ms)"
                        field="websocket.heartbeatInterval"
                        rules={[
                          { required: true, message: '请输入心跳间隔' },
                          { type: 'number', min: 5000, max: 300000, message: '心跳间隔应在5秒到5分钟之间' }
                        ]}
                        tooltip="服务器发送心跳包的间隔时间（毫秒）"
                      >
                        <InputNumber 
                          min={5000}
                          max={300000}
                          step={1000}
                          style={{ width: '100%' }}
                          placeholder="30000"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="心跳超时时间 (ms)"
                        field="websocket.heartbeatTimeout"
                        rules={[
                          { required: true, message: '请输入超时时间' },
                          { type: 'number', min: 1000, max: 30000, message: '超时时间应在1秒到30秒之间' }
                        ]}
                        tooltip="等待心跳响应的超时时间（毫秒）"
                      >
                        <InputNumber 
                          min={1000}
                          max={30000}
                          step={500}
                          style={{ width: '100%' }}
                          placeholder="5000"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="客户端心跳间隔 (ms)"
                        field="websocket.clientHeartbeatInterval"
                        rules={[
                          { required: true, message: '请输入客户端心跳间隔' },
                          { type: 'number', min: 5000, max: 300000, message: '心跳间隔应在5秒到5分钟之间' }
                        ]}
                        tooltip="客户端发送心跳包的间隔时间（毫秒），建议比服务器心跳间隔稍短"
                      >
                        <InputNumber 
                          min={5000}
                          max={300000}
                          step={1000}
                          style={{ width: '100%' }}
                          placeholder="25000"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={16}>                      <Alert
                        type="info"
                        title="配置说明"
                        content="心跳机制用于检测连接状态，防止长时间无数据传输时连接被中断。客户端心跳间隔应比服务器心跳间隔短5-10秒。"
                        showIcon
                        style={{ height: '100%' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </Card>
    </div>
  );
}
