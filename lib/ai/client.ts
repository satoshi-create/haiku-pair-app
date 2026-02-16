import type { AITaskPayload } from './types';

export async function callAI<T>(taskPayload: AITaskPayload): Promise<T> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskPayload),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `AI request failed: ${response.status}`);
  }

  return response.json();
}
