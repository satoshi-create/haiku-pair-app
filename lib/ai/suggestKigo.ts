import { callAI } from './client';
import type { KigoResponse } from './types';

export async function suggestKigo(
  theme: string,
  season?: string,
): Promise<KigoResponse> {
  return callAI<KigoResponse>({
    task: 'kigo',
    payload: { theme, season },
  });
}
