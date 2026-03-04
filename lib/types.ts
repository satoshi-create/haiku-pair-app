export type ScreenMode = 'home' | 'join' | 'host' | 'session' | 'gallery';

export interface SessionData {
  id: string;
  kigo: string;
  season: string;
  host: string;
  hostHaiku: string;
  guestHaiku: string;
  hostVote?: string;
  guestVote?: string;
  created: string;
  /** 共有写真（Base64 data URL）。ホストが写真から季語を選んだときに保存され、ゲストと共有される */
  shared_image?: string | null;
  /** AIが生成した情景・ヒント（JSON文字列）。ImageSuggestions を JSON.stringify したもの */
  shared_hints?: string | null;
}

export interface HaikuHistoryEntry {
  id: number | string;
  haiku: string;
  kigo: string;
  season: string;
  author: string;
  date: string;
  /** 画像URL（Cloudinary等）。未設定時は季節に応じた背景で表示 */
  image_url?: string | null;
  /** AI生成タグ。未設定時は表示しない */
  tags?: string[] | null;
}

export interface KigoEntry {
  season: string;
  description: string;
  examples: string[];
}

export interface ImageSuggestions {
  season: string;
  kigo_suggestions: string[];
  scene_description: string;
  haiku_hints: string[];
}

export interface HaikuLine {
  text: string;
  mora: number;
}
