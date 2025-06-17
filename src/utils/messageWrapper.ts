// Message 包装器，使用自定义 Toast 系统避免 React 18/19 兼容性问题
import { Toast } from '../components/ui/Toast';

export const Message = {
  success: (content: string) => {
    Toast.success(content);
  },
  
  error: (content: string) => {
    Toast.error(content);
  },
  
  warning: (content: string) => {
    Toast.warning(content);
  },
  
  info: (content: string) => {
    Toast.info(content);
  }
};
