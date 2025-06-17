import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// Helper function to generate a random code
const generateRandomCode = (length: number = 4): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Helper function to draw the captcha on canvas
const drawGeneratedCaptcha = (canvas: HTMLCanvasElement | null, code: string, width: number, height: number) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f2f5'); // Light grey
    gradient.addColorStop(1, '#e6f7ff'); // Light blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Interference lines
    for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.stroke();
    }

    // Text
    // Adjust font size based on height, ensuring it's not too small
    const fontSize = Math.max(16, Math.floor(height * 0.45));
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textBaseline = 'middle';
    
    const textPadding = Math.max(5, width * 0.1); // Padding from edges for text
    const availableWidthForText = width - 2 * textPadding;
    const charSpacing = 2; // Spacing between characters
    const totalCharWidth = code.length * (ctx.measureText('W').width) + (code.length -1) * charSpacing; // Approximate width
    let startX = textPadding;
    if (totalCharWidth < availableWidthForText) {
        startX = (width - totalCharWidth) / 2; // Center text if it's smaller than available width
    }


    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const charMeasure = ctx.measureText(char);
        const x = startX + (i * (charMeasure.width + charSpacing));
        const y = height / 2;
        
        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
        ctx.save();
        // Translate to center of char for rotation, then draw relative to that
        ctx.translate(x + charMeasure.width / 2, y);
        ctx.rotate((Math.random() - 0.5) * 0.4); // Max ~11 degrees rotation
        ctx.fillText(char, -charMeasure.width / 2, 0);
        ctx.restore();
    }

    // Interference points (scaled with captcha size)
    const numPoints = Math.floor((width * height) / 200);
    for (let i = 0; i < numPoints; i++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 60%)`;
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
};

export interface CaptchaHandles {
  refresh: () => string; // Returns the new code
}

interface CaptchaProps {
  onGetCaptchaCode: (code: string) => void; // This prop might become optional or be removed if not used by parent
  width?: number;
  height?: number;
}

const Captcha = forwardRef<CaptchaHandles, CaptchaProps>(({ onGetCaptchaCode, width = 120, height = 40 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalRefreshCaptcha = (): string => {
    const newCode = generateRandomCode(4); // Generate 4-character code
    drawGeneratedCaptcha(canvasRef.current, newCode, width, height);
    
    if (onGetCaptchaCode) {
      onGetCaptchaCode(newCode);
    }
    return newCode;
  };

  useImperativeHandle(ref, () => ({
    refresh: internalRefreshCaptcha,
  }));

  useEffect(() => {
    internalRefreshCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [width, height]); // Refresh if dimensions change. 
  // onGetCaptchaCode is removed from dependency array as it might cause unnecessary re-renders if parent passes a new function instance each time.
  // Ensure onGetCaptchaCode is stable if it were to be included (e.g., wrapped in useCallback by parent).

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={internalRefreshCaptcha}
      style={{ cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: '4px', verticalAlign: 'middle' }}
      title="点击刷新验证码"
    />
  );
});

export default Captcha;
