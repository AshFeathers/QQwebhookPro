import {
  Card,
  Form,
  Switch,
  Button,
  Space,
  Divider,
  Typography,
  ColorPicker,
  Radio,
  Alert
} from '@arco-design/web-react';
import {
  IconSettings,
  IconMoon,
  IconSun,
  IconDesktop,
  IconPalette
} from '@arco-design/web-react/icon';
import { useTheme } from '../hooks/useTheme';
import { Message } from '../utils/messageWrapper';
import { presetThemes } from '../theme/colors';

const { Title, Text } = Typography;

interface ThemeSettingsProps {
  onThemeChange?: () => void;
}

export default function ThemeSettings({ onThemeChange }: ThemeSettingsProps) {
  const { themeConfig, isDark, effectiveTheme, updateThemeConfig, toggleTheme } = useTheme();
  const [form] = Form.useForm();
  // 预设颜色方案 - 使用统一的主题配置
  const presetColors = presetThemes;

  const handleSaveTheme = async (values: any) => {
    try {
      updateThemeConfig(values);
      Message.success('主题设置已保存');
      onThemeChange?.();
    } catch (error) {
      Message.error('保存主题设置失败');
    }
  };

  const handleColorPreset = (color: string) => {
    form.setFieldValue('primaryColor', color);
    updateThemeConfig({ primaryColor: color });
  };

  const themeOptions = [
    {
      label: (
        <Space>
          <IconSun />
          <span>浅色模式</span>
        </Space>
      ),
      value: 'light'
    },
    {
      label: (
        <Space>
          <IconMoon />
          <span>深色模式</span>
        </Space>
      ),
      value: 'dark'
    },
    {
      label: (
        <Space>
          <IconDesktop />
          <span>跟随系统</span>
        </Space>
      ),
      value: 'auto'
    }
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconSettings />
          <Title heading={5} style={{ margin: 0 }}>主题设置</Title>
        </div>
      }
      bordered={false}
    >
      <Alert
        style={{ marginBottom: '16px' }}
        type="info"
        content="主题设置会自动保存到本地存储，下次访问时会自动应用"
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={themeConfig}
        onSubmit={handleSaveTheme}
        onChange={(values) => {
          updateThemeConfig(values);
        }}
      >
        {/* 主题模式选择 */}
        <Form.Item label="主题模式" field="theme">
          <Radio.Group options={themeOptions} type="button" />
        </Form.Item>

        {/* 当前生效主题显示 */}
        <div style={{ 
          padding: '12px', 
          background: isDark ? '#232324' : '#f7f8fa', 
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <Space>
            {effectiveTheme === 'dark' ? <IconMoon /> : <IconSun />}
            <Text>
              当前生效主题: <Text bold>{effectiveTheme === 'dark' ? '深色模式' : '浅色模式'}</Text>
            </Text>
          </Space>
        </div>

        <Divider />

        {/* 主色调设置 */}
        <Form.Item label="主色调" field="primaryColor">
          <div>            <ColorPicker
              value={themeConfig.primaryColor}
              onChange={(color) => {
                const colorValue = typeof color === 'string' ? color : color[0]?.color || '#165DFF';
                form.setFieldValue('primaryColor', colorValue);
                updateThemeConfig({ primaryColor: colorValue });
              }}
              style={{ marginBottom: '12px' }}
            />
            
            {/* 预设颜色 */}
            <div style={{ marginTop: '12px' }}>
              <Text style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                预设颜色:
              </Text>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                marginTop: '8px' 
              }}>
                {presetColors.map((preset) => (
                  <div
                    key={preset.value}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: preset.value,
                      cursor: 'pointer',
                      border: themeConfig.primaryColor === preset.value 
                        ? '2px solid var(--color-border-3)' 
                        : '1px solid var(--color-border-1)',
                      transition: 'all 0.2s'
                    }}
                    title={preset.name}
                    onClick={() => handleColorPreset(preset.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Form.Item>

        <Divider />        {/* 界面设置 */}
        <Form.Item 
          label="紧凑模式" 
          field="compactMode"
          tooltip="启用后界面元素间距会更紧凑，适合小屏幕设备"
        >
          <Switch 
            checkedText="启用" 
            uncheckedText="禁用"
            className="theme-switch"
          />
        </Form.Item>

        {/* 快速切换按钮 */}
        <div style={{ marginTop: '24px' }}>
          <Space>
            <Button 
              type="outline" 
              icon={isDark ? <IconSun /> : <IconMoon />}
              onClick={toggleTheme}
            >
              切换到{isDark ? '浅色' : '深色'}模式
            </Button>
            
            <Button 
              type="primary" 
              icon={<IconPalette />}
              onClick={() => form.submit()}
            >
              应用设置
            </Button>
          </Space>
        </div>
      </Form>

      {/* 主题预览 */}
      <div style={{ marginTop: '24px' }}>
        <Divider />
        <Text style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
          主题预览
        </Text>
        <div style={{
          marginTop: '12px',
          padding: '16px',
          borderRadius: '8px',
          background: isDark ? '#232324' : '#ffffff',
          border: `1px solid ${isDark ? '#3c3c3c' : '#e5e6eb'}`
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ 
              color: 'var(--color-text-1)',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              这是主标题文本
            </div>
            <div style={{ 
              color: 'var(--color-text-2)',
              fontSize: '12px'
            }}>
              这是副标题文本
            </div>
            <Button type="primary" size="small">
              主色调按钮
            </Button>
          </Space>
        </div>
      </div>
    </Card>
  );
}
