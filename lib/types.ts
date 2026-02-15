export type ScreenMode = 'home' | 'join' | 'host' | 'session' | 'simulation' | 'gallery' | 'kigo_dict';

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
}

export interface HaikuHistoryEntry {
  id: number;
  haiku: string;
  kigo: string;
  season: string;
  author: string;
  date: string;
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
