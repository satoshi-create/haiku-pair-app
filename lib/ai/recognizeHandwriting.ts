import { callAI } from './client';
import type { HandwritingResponse } from './types';

/**
 * data URL (data:image/png;base64,...) から base64 部分を抽出
 */
function dataUrlToBase64(dataUrl: string): { data: string; mediaType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return { mediaType: match[1] ?? 'image/png', data: match[2] ?? '' };
}

export async function recognizeHandwriting(dataUrl: string): Promise<string> {
  const { data, mediaType } = dataUrlToBase64(dataUrl);
  const res = await callAI<HandwritingResponse>({
    task: 'handwriting',
    payload: { image: { data, mediaType } },
  });
  return (res.text ?? '').trim();
}
