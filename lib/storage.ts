import type { SessionData, HaikuHistoryEntry } from './types';

// --- Session ---

export function saveSession(id: string, data: SessionData): void {
  try {
    window.localStorage.setItem(`session_${id}`, JSON.stringify(data));
  } catch {
    console.log('Storage not available, using in-memory only');
  }
}

export function loadSession(id: string): SessionData | null {
  try {
    const stored = window.localStorage.getItem(`session_${id}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// --- History ---

export function loadHistory(): HaikuHistoryEntry[] {
  try {
    const stored = window.localStorage.getItem('haiku_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.log('Failed to load history');
    return [];
  }
}

export function saveHistory(history: HaikuHistoryEntry[]): void {
  try {
    window.localStorage.setItem('haiku_history', JSON.stringify(history));
  } catch {
    console.log('Failed to save history');
  }
}
