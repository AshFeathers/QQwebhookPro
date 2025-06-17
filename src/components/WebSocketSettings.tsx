import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  InputNumber,
  Button,
  Space,
  Divider,
  Typography,
  Alert
} from '@arco-design/web-react';
import { IconSettings, IconWifi } from '@arco-design/web-react/icon';
import { api } from '../api';
import type { Config } from '../types';
import { Message } from '../utils/messageWrapper';

const { Title, Text } = Typography;

export function WebSocketSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);
  const loadConfig = async () => {
    try {
      const response = await api.getConfig();
      setConfig(response);
      
      // 设置表单值
      const websocketConfig = response.websocket || {
        enableHeartbeat: false,
        heartbeatInterval: 30000,
        heartbeatTimeout: 5000,
        clientHeartbeatInterval: 25000
      };
      
      form.setFieldsValue(websocketConfig);
    } catch (error) {
      Message.error('加载配置失败');
    }
  };
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const updatedConfig: Config = {
        ...config!,
        websocket: values
      };
      
      await api.updateConfig(updatedConfig);
      setConfig(updatedConfig);
      Message.success('WebSocket配置已保存');
    } catch (error) {
      Message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    const defaultValues = {
      enableHeartbeat: false,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      clientHeartbeatInterval: 25000
    };
    form.setFieldsValue(defaultValues);
  };

  if (!config) {
    return <Card loading style={{ height: 400 }} />;
  }

  return (
    <Card
      title={
        <Space>
          <IconWifi />
          <span>WebSocket 配置</span>
        </Space>
      }
      extra={
        <Button
          type="outline"
          icon={<IconSettings />}
          onClick={handleReset}
        >
          重置默认值
        </Button>
      }
    >      <Alert
        type="info"
        title="WebSocket 心跳配置"
        content="心跳机制用于检测连接状态，防止长时间无数据传输时连接被中断。如果网络环境稳定，可以禁用心跳以减少开销。"
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onSubmit={handleSave}
        autoComplete="off"
      >        <Form.Item
          label="启用心跳检测"
          field="enableHeartbeat"
          triggerPropName="checked"
          tooltip="是否启用WebSocket心跳检测机制"
        >
          <Switch
            checkedText="启用"
            uncheckedText="禁用"
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prev, next) => prev.enableHeartbeat !== next.enableHeartbeat}
        >
          {(values) => {
            return values.enableHeartbeat ? (
              <>
                <Divider />
                <Title heading={6} style={{ margin: '16px 0' }}>
                  心跳参数配置
                </Title>

                <Form.Item
                  label="服务器心跳间隔"
                  field="heartbeatInterval"
                  tooltip="服务器发送心跳包的间隔时间（毫秒）"
                  rules={[
                    { required: true, message: '请输入心跳间隔' },
                    { type: 'number', min: 5000, max: 300000, message: '心跳间隔应在5秒到5分钟之间' }
                  ]}
                >
                  <InputNumber
                    placeholder="30000"
                    min={5000}
                    max={300000}
                    step={1000}
                    suffix="ms"
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item
                  label="心跳超时时间"
                  field="heartbeatTimeout"
                  tooltip="等待心跳响应的超时时间（毫秒）"
                  rules={[
                    { required: true, message: '请输入超时时间' },
                    { type: 'number', min: 1000, max: 30000, message: '超时时间应在1秒到30秒之间' }
                  ]}
                >
                  <InputNumber
                    placeholder="5000"
                    min={1000}
                    max={30000}
                    step={500}
                    suffix="ms"
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item
                  label="客户端心跳间隔"
                  field="clientHeartbeatInterval"
                  tooltip="客户端发送心跳包的间隔时间（毫秒），建议比服务器心跳间隔稍短"
                  rules={[
                    { required: true, message: '请输入客户端心跳间隔' },
                    { type: 'number', min: 5000, max: 300000, message: '心跳间隔应在5秒到5分钟之间' }
                  ]}
                >
                  <InputNumber
                    placeholder="25000"
                    min={5000}
                    max={300000}
                    step={1000}
                    suffix="ms"
                    style={{ width: '100%' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>                <Alert
                  type="warning"
                  title="配置建议"
                  content={
                    <div>
                      <Text>• 客户端心跳间隔应比服务器心跳间隔短5-10秒</Text><br />
                      <Text>• 网络环境良好时可适当增加心跳间隔以减少开销</Text><br />
                      <Text>• 修改配置后需要重新连接WebSocket才能生效</Text>
                    </div>
                  }
                  style={{ marginTop: 16 }}
                />
              </>
            ) : null;
          }}
        </Form.Item>

        <Divider />

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              保存配置
            </Button>
            <Button
              onClick={loadConfig}
              disabled={loading}
            >
              重新加载
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
