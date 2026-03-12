import type { ImageSuggestions } from '@/lib/types';

// --- Task names ---
export type AITaskName = 'haiku' | 'kigo' | 'haiga' | 'analysis' | 'handwriting';

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

/** 手書き文字認識（デジタル半紙の画像 → 俳句テキスト） */
export interface HandwritingPayload {
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
  | { task: 'handwriting'; payload: HandwritingPayload }
  | { task: 'kigo'; payload: KigoPayload };

// --- Per-task response types ---
export interface HaikuResponse {
  suggestions: string[];
}

export interface HaigaResponse {
  description: string;
}

export type AnalysisResponse = ImageSuggestions;

/** 手書き認識結果（俳句テキスト） */
export interface HandwritingResponse {
  text: string;
}

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
