import { callAI } from './client';
import type { HaikuResponse } from './types';

export async function generateHaikuSuggestions(
  idea: string,
  kigo: string,
): Promise<string[]> {
  const result = await callAI<HaikuResponse>({
    task: 'haiku',
    payload: { idea, kigo },
  });
  return result.suggestions;
}
