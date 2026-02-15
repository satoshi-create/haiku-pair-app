import type { } from './types';

// QRコード生成ライブラリをCDNから読み込む
export const loadQRCodeScript = (): Promise<typeof window.QRCode> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.QRCode) {
      resolve(window.QRCode);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => resolve(window.QRCode);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// API呼び出しヘルパー
export const callAnthropicAPI = async (
  messages: { role: string; content: string | Array<{ type: string; [key: string]: unknown }> }[],
  maxTokens = 1000
) => {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages,
    }),
  });
  return response.json();
};
