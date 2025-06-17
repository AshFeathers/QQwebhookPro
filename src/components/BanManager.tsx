import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Message,
  Popconfirm,
  Badge,
  Modal,
  Form,
  Input,
  Typography,
  Tag,
  Divider
} from '@arco-design/web-react';
import {
  IconPlus,
  IconRefresh,
  IconExclamationCircle
} from '@arco-design/web-react/icon';
import { api, type BanInfo } from '../api';

const { Text } = Typography;
const FormItem = Form.Item;

interface BanManagerProps {
  onRefresh?: () => void;
}

export default function BanManager({ onRefresh }: BanManagerProps) {
  const [loading, setLoading] = useState(false);
  const [bans, setBans] = useState<BanInfo[]>([]);
  const [blockedSecrets, setBlockedSecrets] = useState<string[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    loadBans();
  }, []);

  const loadBans = async () => {
    setLoading(true);
    try {
      const response = await api.getBlockedSecrets();
      setBans(response.bans || []);
      setBlockedSecrets(response.blockedSecrets || []);
    } catch (error) {
      Message.error('加载封禁列表失败');
      console.error('Failed to load bans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (secret: string) => {
    try {
      await api.unblockSecret(secret);
      Message.success(`已解除封禁: ${secret}`);
      loadBans();
      onRefresh?.();
    } catch (error) {
      Message.error('解除封禁失败');
    }
  };

  const handleBlock = async (values: { secret: string; reason?: string }) => {
    try {
      await api.blockSecret(values.secret, values.reason);
      Message.success(`已封禁密钥: ${values.secret}`);
      setAddModalVisible(false);
      addForm.resetFields();
      loadBans();
      onRefresh?.();
    } catch (error) {
      Message.error('封禁失败');
    }
  };

  const columns = [
    {
      title: '密钥',
      dataIndex: 'secret',
      key: 'secret',
      render: (secret: string) => (
        <Text code style={{ fontFamily: 'monospace' }}>
          {secret}
        </Text>
      ),
    },
    {
      title: '封禁原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason?: string) => (
        reason ? (
          <Text type="secondary">{reason}</Text>
        ) : (
          <Text type="secondary">未提供原因</Text>
        )
      ),
    },
    {
      title: '封禁时间',
      dataIndex: 'bannedAt',
      key: 'bannedAt',
      render: (time: string) => (
        <Text type="secondary">
          {new Date(time).toLocaleString()}
        </Text>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'bannedBy',
      key: 'bannedBy',
      render: (bannedBy: string) => (
        <Tag color="blue">{bannedBy}</Tag>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: () => (
        <Badge status="error" text="已封禁" />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: BanInfo) => (
        <Space>
          <Popconfirm
            title="确定要解除封禁吗？"
            content="解除封禁后，该密钥将可以正常使用"
            onOk={() => handleUnblock(record.secret)}
          >
            <Button size="small" type="primary" status="success">
              解除封禁
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconExclamationCircle style={{ color: '#ff4d4f' }} />
            <span>封禁管理</span>
          </div>
        }
        bordered={false}
        extra={
          <Space>
            <Button
              size="small"
              icon={<IconRefresh />}
              onClick={loadBans}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<IconPlus />}
              onClick={() => setAddModalVisible(true)}
            >
              添加封禁
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <div>
              <Text type="secondary">封禁总数: </Text>
              <Badge count={bans.length} style={{ backgroundColor: '#ff4d4f' }} />
            </div>
            <div>
              <Text type="secondary">活跃封禁: </Text>
              <Badge count={blockedSecrets.length} style={{ backgroundColor: '#faad14' }} />
            </div>
          </Space>
        </div>

        <Table
          columns={columns}
          data={bans}
          loading={loading}          pagination={{
            pageSize: 10,
            showTotal: true,
          }}
          rowKey="secret"
          noDataElement={
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IconExclamationCircle style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
              <div style={{ color: '#999' }}>暂无封禁记录</div>
            </div>
          }
        />
      </Card>

      {/* 添加封禁弹窗 */}
      <Modal        title="添加封禁"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        style={{ width: 480 }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onSubmit={handleBlock}
        >
          <FormItem
            label="密钥"
            field="secret"
            rules={[
              { required: true, message: '请输入要封禁的密钥' },
              { minLength: 8, message: '密钥长度至少8个字符' }
            ]}
          >
            <Input
              placeholder="请输入要封禁的密钥"
              allowClear
            />
          </FormItem>

          <FormItem
            label="封禁原因"
            field="reason"
          >
            <Input.TextArea
              placeholder="请输入封禁原因（可选）"
              maxLength={200}
              showWordLimit
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </FormItem>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAddModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认封禁
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
