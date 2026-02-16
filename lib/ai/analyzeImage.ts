import { callAI } from './client';
import type { AnalysisResponse } from './types';

export async function analyzeImage(
  imageData: string,
  mediaType: string,
): Promise<AnalysisResponse> {
  return callAI<AnalysisResponse>({
    task: 'analysis',
    payload: { image: { data: imageData, mediaType } },
  });
}
