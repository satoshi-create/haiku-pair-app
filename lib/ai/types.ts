import type { ImageSuggestions } from '@/lib/types';

// --- Task names ---
export type AITaskName = 'haiku' | 'kigo' | 'haiga' | 'analysis';

// --- Per-task payload types ---
export interface HaikuPayload {
  idea: string;
  kigo: string;
}

export interface HaigaPayload {
  haiku: string;
  kigo: string;
}

export interface AnalysisPayload {
  image: { data: string; mediaType: string };
}

export interface KigoPayload {
  theme: string;
  season?: string;
}

export type AITaskPayload =
  | { task: 'haiku'; payload: HaikuPayload }
  | { task: 'haiga'; payload: HaigaPayload }
  | { task: 'analysis'; payload: AnalysisPayload }
  | { task: 'kigo'; payload: KigoPayload };

// --- Per-task response types ---
export interface HaikuResponse {
  suggestions: string[];
}

export interface HaigaResponse {
  description: string;
}

export type AnalysisResponse = ImageSuggestions;

export interface KigoResponse {
  season: string;
  kigo_suggestions: string[];
  explanations: string[];
}

// --- Route handler internals ---
export interface TaskConfig {
  systemPrompt: string;
  userContent:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  maxTokens: number;
  temperature: number;
  responseMode: 'json' | 'text';
}
