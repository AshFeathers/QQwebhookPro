import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Badge,
  Modal,
  Form,
  Input,
  Switch,
  InputNumber,
  Popconfirm,
  Typography,
  Tooltip,
  Alert,
  Checkbox,
  Upload,
  Statistic,
  Divider,
  Progress,
  Grid,
  Dropdown,
  Menu
} from '@arco-design/web-react';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconCopy,
  IconInfo,
  IconDownload,
  IconUpload,
  IconEye,
  IconRefresh,
  IconMore,
  IconLink
} from '@arco-design/web-react/icon';
import { api } from '../api';
import type { Secret, Config } from '../types';
import { Message } from '../utils/messageWrapper';

const { Title, Text } = Typography;
const { Row, Col } = Grid;

interface SecretManagerProps {
  onRefresh?: () => void;
}

interface SecretsStats {
  total: number;
  enabled: number;
  disabled: number;
  recentlyUsed: number;
  neverUsed: number;
}

export default function SecretManager({ onRefresh }: SecretManagerProps) {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [stats, setStats] = useState<SecretsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [selectedSecrets, setSelectedSecrets] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<'enable' | 'disable' | 'delete' | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSecrets();
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.getConfig();
      setConfig(response);
    } catch (error) {
      Message.error('获取配置失败');
      console.error('Error loading config:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getSecretsStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSecrets = async () => {
    try {
      setLoading(true);
      const response = await api.getSecrets();
      setSecrets(response.secrets);
    } catch (error) {
      Message.error('加载密钥失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSecret = () => {
    setEditingSecret(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditSecret = (secret: Secret) => {
    setEditingSecret(secret);
    form.setFieldsValue(secret);
    setModalVisible(true);
  };
  const handleSaveSecret = async (values: any) => {
    try {
      if (editingSecret) {
        await api.updateSecret(editingSecret.secret, values);
        Message.success('密钥更新成功');      } else {
        await api.addSecret({
          secret: values.secret,
          description: values.description,
          enabled: values.enabled,
          maxConnections: values.maxConnections
        });
        Message.success('密钥添加成功');
      }
      setModalVisible(false);
      loadSecrets();
      onRefresh?.();
    } catch (error) {
      Message.error(editingSecret ? '更新失败' : '添加失败');
    }
  };

  const handleDeleteSecret = async (secret: string) => {
    try {
      await api.deleteSecret(secret);
      Message.success('密钥删除成功');
      loadSecrets();
      onRefresh?.();
    } catch (error) {
      Message.error('删除失败');
    }
  };

  // 优化的复制功能，修复React 19兼容性问题
  const copyToClipboard = async (text: string, type: string = '内容') => {
    if (!text) {
      Message.error('复制内容为空');
      return false;
    }

    try {
      // 现代浏览器使用 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        Message.success(`${type}已复制到剪贴板`);
        return true;
      } else {
        // 兼容性备选方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.style.opacity = '0';
        textArea.style.zIndex = '-1';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          Message.success(`${type}已复制到剪贴板`);
          return true;
        } else {
          throw new Error('execCommand failed');
        }
      }
    } catch (error) {
      console.error('复制操作失败:', error);
      // 简化错误处理，避免Modal兼容性问题
      Message.error(`复制失败：${(error as Error).message}`);
      return false;
    }
  };

  // 获取当前域名和端口
  const getCurrentDomain = () => {
    const { protocol, hostname, port } = window.location;
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  };

  // 获取服务器端口，支持配置和默认值
  const getServerPort = () => {
    return config?.server?.port || 3002;
  };

  // 生成Webhook URL，支持自动域名检测
  const generateWebhookUrl = (secret: string) => {
    const serverPort = getServerPort();
    const currentDomain = getCurrentDomain();
    
    // 如果当前域名包含端口且与服务器端口不同，使用服务器端口
    if (window.location.port && window.location.port !== serverPort.toString()) {
      return `${window.location.protocol}//${window.location.hostname}:${serverPort}/api/webhook?secret=${secret}`;
    }
    
    // 否则使用当前域名
    return `${currentDomain}/api/webhook?secret=${secret}`;
  };

  // 生成WebSocket URL，支持协议自动检测
  const generateWebSocketUrl = (secret: string) => {
    const serverPort = getServerPort();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // 如果当前域名包含端口且与服务器端口不同，使用服务器端口
    if (window.location.port && window.location.port !== serverPort.toString()) {
      return `${protocol}//${window.location.hostname}:${serverPort}/ws/${secret}`;
    }
    
    // 否则使用当前域名，但需要确保WebSocket协议正确
    const currentHost = `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
    return `${protocol}//${currentHost}/ws/${secret}`;
  };

  // 复制所有相关URL的便捷函数
  const copyAllUrls = async (secret: string) => {
    const webhookUrl = generateWebhookUrl(secret);
    const websocketUrl = generateWebSocketUrl(secret);
    const allUrls = `Webhook URL: ${webhookUrl}\nWebSocket URL: ${websocketUrl}`;
    
    await copyToClipboard(allUrls, '所有URL');
  };

  // 导出功能
  const handleExportSecrets = async () => {
    try {
      const response = await api.exportSecrets();
      const dataStr = JSON.stringify(response, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `secrets-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Message.success('密钥导出成功');
    } catch (error) {
      Message.error('导出失败');
      console.error('Export error:', error);
    }
  };

  // 导入功能
  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setImportData(data);
        setImportModalVisible(true);
      } catch (error) {
        Message.error('文件格式无效');
      }
    };
    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  const handleImportSecrets = async () => {
    if (!importData) return;
    
    try {
      const response = await api.importSecrets(importData, overwriteExisting);
      if (response.success) {
        const { imported, skipped, errors } = response.result;
        Message.success(
          `导入完成：成功 ${imported} 个，跳过 ${skipped} 个${
            errors.length > 0 ? `，错误 ${errors.length} 个` : ''
          }`
        );
        loadSecrets();
        loadStats();
        setImportModalVisible(false);
        setImportData(null);
        onRefresh?.();
      }
    } catch (error) {
      Message.error('导入失败');
      console.error('Import error:', error);
    }
  };

  // 批量操作
  const handleBatchAction = async (action: 'enable' | 'disable' | 'delete') => {
    if (selectedSecrets.length === 0) {
      Message.warning('请选择要操作的密钥');
      return;
    }

    setBatchAction(action);
    setBatchLoading(true);
    
    try {
      const response = await api.batchOperateSecrets(action, selectedSecrets);
      if (response.success) {
        const { success, failed, errors } = response.results;
        Message.success(
          `批量操作完成：成功 ${success} 个，失败 ${failed} 个${
            errors.length > 0 ? `，错误详情请查看日志` : ''
          }`
        );
        loadSecrets();
        loadStats();
        setSelectedSecrets([]);
        onRefresh?.();
      }
    } catch (error) {
      Message.error('批量操作失败');
      console.error('Batch operation error:', error);
    } finally {
      setBatchLoading(false);
      setBatchAction(null);
    }
  };

  // 选择/取消选择
  const handleSelectSecret = (secret: string, checked: boolean) => {
    if (checked) {
      setSelectedSecrets([...selectedSecrets, secret]);
    } else {
      setSelectedSecrets(selectedSecrets.filter(s => s !== secret));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSecrets(secrets.map(s => s.secret));
    } else {
      setSelectedSecrets([]);
    }
  };
  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedSecrets.length === secrets.length && secrets.length > 0}
          indeterminate={selectedSecrets.length > 0 && selectedSecrets.length < secrets.length}
          onChange={handleSelectAll}
        >
          选择
        </Checkbox>
      ),
      dataIndex: 'select',
      key: 'select',
      width: 80,
      render: (_: any, record: Secret) => (
        <Checkbox
          checked={selectedSecrets.includes(record.secret)}
          onChange={(checked) => handleSelectSecret(record.secret, checked)}
        />
      )
    },
    {
      title: '密钥',
      dataIndex: 'secret',
      key: 'secret',
      width: 220,
      render: (secret: string) => (
        <div className="secret-cell">
          <div className="secret-code">
            {secret}
          </div>
          <Tooltip content="复制密钥">
            <Button
              size="mini"
              type="text"
              icon={<IconCopy />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(secret, '密钥');
              }}
              className="copy-button"
            />
          </Tooltip>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-'
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Badge
          status={enabled ? 'processing' : 'default'}
          text={enabled ? '启用' : '禁用'}
        />
      )
    },
    {
      title: '最大连接数',
      dataIndex: 'maxConnections',
      key: 'maxConnections',
      width: 120,
      render: (count: number) => count || '默认'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      width: 160,
      render: (time: string) => time ? new Date(time).toLocaleString() : '从未使用'
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Secret) => (
        <Space size="small">
          <Tooltip content="复制 Webhook URL">
            <Button
              size="small"
              type="outline"
              icon={<IconLink />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(generateWebhookUrl(record.secret), 'Webhook URL');
              }}
            >
              Hook
            </Button>
          </Tooltip>
          
          <Tooltip content="复制 WebSocket URL">
            <Button
              size="small"
              type="outline"
              icon={<IconLink />}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(generateWebSocketUrl(record.secret), 'WebSocket URL');
              }}
            >
              WS
            </Button>
          </Tooltip>

          <Dropdown
            droplist={
              <Menu>
                <Menu.Item 
                  key="edit" 
                  onClick={() => handleEditSecret(record)}
                >
                  <IconEdit style={{ marginRight: '8px' }} />
                  编辑密钥
                </Menu.Item>
                <Menu.Item 
                  key="copyAll" 
                  onClick={() => copyAllUrls(record.secret)}
                >
                  <IconCopy style={{ marginRight: '8px' }} />
                  复制所有URL
                </Menu.Item>
                <Menu.Item 
                  key="copySecret" 
                  onClick={() => copyToClipboard(record.secret, '密钥')}
                >
                  <IconCopy style={{ marginRight: '8px' }} />
                  复制密钥
                </Menu.Item>
                <Menu.Item 
                  key="copyJson" 
                  onClick={() => {
                    const secretInfo = {
                      secret: record.secret,
                      webhookUrl: generateWebhookUrl(record.secret),
                      websocketUrl: generateWebSocketUrl(record.secret),
                      description: record.description,
                      enabled: record.enabled
                    };
                    copyToClipboard(JSON.stringify(secretInfo, null, 2), '密钥信息(JSON)');
                  }}
                >
                  <IconLink style={{ marginRight: '8px' }} />
                  复制JSON格式
                </Menu.Item>
                <Menu.Item 
                  key="delete" 
                  onClick={() => {
                    Modal.confirm({
                      title: '确认删除',
                      content: '确认删除此密钥？删除后将无法恢复，相关连接也会被断开',
                      okText: '确认删除',
                      cancelText: '取消',
                      okButtonProps: { status: 'danger' },
                      onOk: () => handleDeleteSecret(record.secret)
                    });
                  }}
                >
                  <IconDelete style={{ marginRight: '8px', color: '#f53f3f' }} />
                  <span style={{ color: '#f53f3f' }}>删除密钥</span>
                </Menu.Item>
              </Menu>
            }
            position="bottom"
            trigger="click"
          >
            <Button
              size="small"
              type="text"
              icon={<IconMore />}
            />
          </Dropdown>
        </Space>
      )
    }
  ];
  return (
    <div>
      {/* 统计信息卡片 */}
      {stats && (
        <Card 
          className="stats-card"
          style={{ marginBottom: '16px' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconEye />
              <span>密钥统计</span>
            </div>
          }
          extra={
            <Button
              type="text"
              icon={<IconRefresh />}
              onClick={loadStats}
              size="small"
            >
              刷新
            </Button>
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div className="stats-number" style={{ color: 'var(--primary-color)' }}>
                  {stats.total}
                </div>
                <div className="stats-label">总数</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div className="stats-number" style={{ color: 'var(--color-success)' }}>
                  {stats.enabled}
                </div>
                <div className="stats-label">启用</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div className="stats-number" style={{ color: 'var(--color-danger)' }}>
                  {stats.disabled}
                </div>
                <div className="stats-label">禁用</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div className="stats-number" style={{ color: 'var(--color-warning)' }}>
                  {stats.neverUsed}
                </div>
                <div className="stats-label">从未使用</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Title heading={5} style={{ margin: 0 }}>密钥管理</Title>
            <Space>
              <Button
                icon={<IconEye />}
                onClick={() => setStatsModalVisible(true)}
                size="small"
              >
                统计
              </Button>
              <Button
                icon={<IconDownload />}
                onClick={handleExportSecrets}
                size="small"
              >
                导出
              </Button>
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={handleImportFile}
              >
                <Button
                  icon={<IconUpload />}
                  size="small"
                >
                  导入
                </Button>
              </Upload>
              <Button
                type="primary"
                icon={<IconPlus />}
                onClick={handleAddSecret}
              >
                添加密钥
              </Button>
            </Space>
          </div>
        }
        bordered={false}
      >
        {/* 批量操作工具栏 */}
        {selectedSecrets.length > 0 && (
          <div className="batch-toolbar">
            <div className="batch-toolbar-left">
              <Text style={{ fontWeight: 600 }}>
                已选择 {selectedSecrets.length} 个密钥
              </Text>
            </div>
            <div className="batch-toolbar-right">
              <Button
                size="small"
                type="primary"
                loading={batchLoading && batchAction === 'enable'}
                onClick={() => handleBatchAction('enable')}
                style={{ minWidth: '80px' }}
              >
                批量启用
              </Button>
              <Button
                size="small"
                status="warning"
                loading={batchLoading && batchAction === 'disable'}
                onClick={() => handleBatchAction('disable')}
                style={{ minWidth: '80px' }}
              >
                批量禁用
              </Button>
              <Popconfirm
                title="确认批量删除？"
                content={`将删除 ${selectedSecrets.length} 个密钥，此操作不可撤销`}
                onOk={() => handleBatchAction('delete')}
              >
                <Button
                  size="small"
                  status="danger"
                  loading={batchLoading && batchAction === 'delete'}
                  style={{ minWidth: '80px' }}
                >
                  批量删除
                </Button>
              </Popconfirm>
              <Button
                size="small"
                onClick={() => setSelectedSecrets([])}
                style={{ minWidth: '80px' }}
              >
                取消选择
              </Button>
            </div>
          </div>
        )}

        <Table
          columns={columns}
          data={secrets}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="secret"
          stripe
          size="small"
        />
      </Card>      <Modal
        title={editingSecret ? '编辑密钥' : '添加密钥'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
        style={{ width: '600px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSaveSecret}
        >          <Form.Item
            label="密钥"
            field="secret"
            rules={[
              { required: true, message: '请输入密钥' },
              { minLength: 3, message: '密钥长度至少3个字符' }
            ]}
          >
            <Input 
              placeholder="请输入密钥" 
              disabled={!!editingSecret}
              suffix={
                <Tooltip content="生成随机密钥">
                  <Button
                    size="mini"
                    type="text"
                    icon={<IconRefresh />}
                    disabled={!!editingSecret}
                    onClick={() => {
                      const randomSecret = Math.random().toString(36).substring(2, 15) + 
                                         Math.random().toString(36).substring(2, 15);
                      form.setFieldValue('secret', randomSecret);
                    }}
                  />
                </Tooltip>
              }
            />
          </Form.Item>

          <Form.Item
            label="描述"
            field="description"
          >
            <Input.TextArea 
              placeholder="请输入描述信息（可选）" 
              rows={3}
              maxLength={200}
              showWordLimit
            />
          </Form.Item>

          <Form.Item
            label="启用状态"
            field="enabled"
            initialValue={true}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Switch 
                checkedText="启用" 
                uncheckedText="禁用"
                className="theme-switch"
              />
              <Text type="secondary">
                {form.getFieldValue('enabled') ? '密钥启用后可以接收请求' : '密钥禁用后将拒绝所有请求'}
              </Text>
            </div>
          </Form.Item>

          <Form.Item
            label="最大连接数"
            field="maxConnections"
            tooltip="同时连接到此密钥的WebSocket连接数限制"
          >
            <InputNumber 
              placeholder="留空使用默认值" 
              min={1}
              max={100}
              style={{ width: '100%' }}
              suffix="个连接"
            />
          </Form.Item>

          {/* URL预览区域 */}
          {form.getFieldValue('secret') && (
            <Form.Item label="URL预览">
              <div className="url-preview-container">
                <div className="url-preview-item">
                  <span className="url-preview-label">Webhook URL:</span>
                  <div className="url-preview-value">
                    <span className="url-text">
                      {generateWebhookUrl(form.getFieldValue('secret'))}
                    </span>
                    <Button
                      size="mini"
                      type="text"
                      icon={<IconCopy />}
                      onClick={() => copyToClipboard(
                        generateWebhookUrl(form.getFieldValue('secret')), 
                        'Webhook URL'
                      )}
                      className="copy-button"
                    />
                  </div>
                </div>
                <div className="url-preview-item">
                  <span className="url-preview-label">WebSocket URL:</span>
                  <div className="url-preview-value websocket">
                    <span className="url-text">
                      {generateWebSocketUrl(form.getFieldValue('secret'))}
                    </span>
                    <Button
                      size="mini"
                      type="text"
                      icon={<IconCopy />}
                      onClick={() => copyToClipboard(
                        generateWebSocketUrl(form.getFieldValue('secret')), 
                        'WebSocket URL'
                      )}
                      className="copy-button"
                    />
                  </div>
                </div>
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>{/* 导入模态框 */}
      <Modal
        title="导入密钥"
        visible={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportData(null);
        }}
        onOk={handleImportSecrets}
        okText="导入"
        cancelText="取消"
      >
        {importData && (
          <div>
            <Alert
              type="info"
              showIcon
              content={`将导入 ${importData.secrets?.length || 0} 个密钥`}
              style={{ marginBottom: '16px' }}
            />            <Form.Item label="冲突处理">
              <Switch
                checked={overwriteExisting}
                onChange={setOverwriteExisting}
                checkedText="覆盖已存在"
                uncheckedText="跳过已存在"
                className="theme-switch"
              />
            </Form.Item>
            <div style={{ marginTop: '16px' }}>
              <Text>预览导入内容：</Text>
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'auto', 
                border: '1px solid #e5e6eb', 
                borderRadius: '4px',
                padding: '8px',
                marginTop: '8px',
                fontSize: '12px',
                backgroundColor: '#f7f8fa'
              }}>
                {importData.secrets?.map((secret: any, index: number) => (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <Text code>{secret.secret}</Text>
                    {secret.description && (
                      <Text style={{ marginLeft: '8px', color: '#86909c' }}>
                        - {secret.description}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 统计详情模态框 */}
      <Modal
        title="密钥统计详情"
        visible={statsModalVisible}
        onCancel={() => setStatsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setStatsModalVisible(false)}>
            关闭
          </Button>
        ]}
        style={{ width: '600px' }}
      >
        {stats && (
          <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic title="总密钥数" value={stats.total} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <div>
                    <div style={{ fontSize: '14px', color: '#86909c', marginBottom: '4px' }}>
                      启用率
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {stats.total > 0 ? ((stats.enabled / stats.total) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
            
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>状态分布</Text>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#00b42a', 
                  borderRadius: '2px',
                  marginRight: '8px' 
                }} />
                <Text>启用: {stats.enabled}</Text>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.enabled / stats.total) * 100 : 0} 
                status="success"
                showText={false}
                size="small"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: '#f53f3f', 
                  borderRadius: '2px',
                  marginRight: '8px' 
                }} />
                <Text>禁用: {stats.disabled}</Text>
              </div>
              <Progress 
                percent={stats.total > 0 ? (stats.disabled / stats.total) * 100 : 0} 
                status="error"
                showText={false}
                size="small"
              />
            </div>

            <Divider />

            <div>
              <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>使用情况</Text>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <Text>最近使用: {stats.recentlyUsed}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text>从未使用: {stats.neverUsed}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {config?.security.requireManualKeyManagement ? (
        <Alert
          style={{ marginTop: '16px' }}
          type="info"
          icon={<IconInfo />}
          content="当前为手动密钥管理模式，需要手动添加所有密钥"
          showIcon
        />
      ) : (
        <Alert
          style={{ marginTop: '16px' }}
          type="success"
          icon={<IconInfo />}
          content="当前为自动密钥管理模式，新密钥将自动添加"
          showIcon
        />
      )}
    </div>
  );
}
