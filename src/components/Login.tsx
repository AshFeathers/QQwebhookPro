import { useState, useRef } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Divider,
  Modal
} from '@arco-design/web-react';
import {
  IconUser,
  IconLock
} from '@arco-design/web-react/icon';
import { api } from '../api';
import type { LoginRequest } from '../api';
import Captcha, { type CaptchaHandles } from './Captcha';
import { Message } from '../utils/messageWrapper';

const { Title, Text } = Typography;
const FormItem = Form.Item;

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [loginData, setLoginData] = useState<{ username: string; password: string } | null>(null);
  const captchaRef = useRef<CaptchaHandles>(null);
  const [generatedCaptchaCode, setGeneratedCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const handleSubmit = async (values: LoginRequest) => {
    // 先存储登录数据，然后显示验证码模态框
    setLoginData(values);
    setShowCaptchaModal(true);
    // 重置验证码输入
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleCaptchaInputChange = (value: string) => {
    setCaptchaInput(value);
    setCaptchaError('');
  };

  const handleCaptchaConfirm = async () => {
    if (!captchaInput) {
      setCaptchaError('请输入验证码');
      return;
    }
    
    if (!generatedCaptchaCode) {
      setCaptchaError('验证码未生成，请刷新');
      captchaRef.current?.refresh();
      return;
    }
    
    if (captchaInput.toLowerCase() !== generatedCaptchaCode.toLowerCase()) {
      setCaptchaError('验证码错误，请重新输入');
      captchaRef.current?.refresh();
      setCaptchaInput('');
      return;
    }

    if (!loginData) {
      setCaptchaError('登录数据丢失，请重新登录');
      setShowCaptchaModal(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(loginData.username, loginData.password);
      if (response.success) {
        Message.success('登录成功');
        setShowCaptchaModal(false);
        onLoginSuccess();
      } else {
        Message.error(response.message || '登录失败');
        // 登录失败，刷新验证码
        captchaRef.current?.refresh();
        setCaptchaInput('');
      }
    } catch (error) {
      Message.error('网络错误，请稍后重试');
      console.error('Login error:', error);
      captchaRef.current?.refresh();
      setCaptchaInput('');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaModalClose = () => {
    setShowCaptchaModal(false);
    setLoginData(null);
    setCaptchaInput('');
    setCaptchaError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#1890ff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '24px'
          }}>
            QQ
          </div>
          <Title heading={3} style={{ margin: '0 0 8px' }}>
            QQ Webhook Pro
          </Title>
          <Text type="secondary">
            请登录管理控制台
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onSubmit={handleSubmit} 
          autoComplete="off"
        >
          <FormItem
            label="用户名"
            field="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { minLength: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<IconUser />}
              placeholder="请输入用户名"
              size="large"
              allowClear
            />
          </FormItem>          <FormItem
            label="密码"
            field="password"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<IconLock />}
              placeholder="请输入密码"
              size="large"
              visibilityToggle
            />
          </FormItem>

          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              long
              size="large"
              style={{
                borderRadius: '8px',
                fontWeight: '500'
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </FormItem>
        </Form>

        <Divider style={{ margin: '24px 0' }} />        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="small">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              默认账号: admin / admin123
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              QQ Webhook Pro v2.0.0
            </Text>
          </Space>
        </div>
      </Card>      {/* 验证码模态框 */}
      <Modal
        title="安全验证"
        visible={showCaptchaModal}
        onCancel={handleCaptchaModalClose}
        footer={null}
        closable={false}
        maskClosable={false}
        style={{ maxWidth: '400px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Text type="secondary">
            为了您的账户安全，请输入验证码完成登录
          </Text>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <Text>验证码</Text>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Input
              placeholder="请输入验证码"
              size="large"
              maxLength={4}
              value={captchaInput}
              onChange={handleCaptchaInputChange}
              style={{ flex: 1, textAlign: 'center', fontSize: '16px', letterSpacing: '2px' }}
              autoFocus
              status={captchaError ? 'error' : undefined}
            />
            <Captcha 
              ref={captchaRef} 
              onGetCaptchaCode={setGeneratedCaptchaCode}
              width={100}
              height={36}
            />
          </div>
          {captchaError && (
            <div style={{ color: '#f53f3f', fontSize: '12px', marginTop: '4px' }}>
              {captchaError}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <Button onClick={handleCaptchaModalClose} size="large">
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleCaptchaConfirm}
            loading={loading}
            size="large"
            style={{ minWidth: '80px' }}
          >
            {loading ? '验证中...' : '确认登录'}
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            点击验证码图片可以刷新
          </Text>
        </div>
      </Modal>
    </div>
  );
}
