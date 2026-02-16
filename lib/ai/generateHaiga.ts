import { callAI } from './client';
import type { HaigaResponse } from './types';

export async function generateHaiga(
  haiku: string,
  kigo: string,
): Promise<string> {
  const result = await callAI<HaigaResponse>({
    task: 'haiga',
    payload: { haiku, kigo },
  });
  return result.description;
}
