import type { SessionData, HaikuHistoryEntry } from './types';

const isBrowser = typeof window !== 'undefined';

// --- Session ---

export function saveSession(id: string, data: SessionData): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(`session_${id}`, JSON.stringify(data));
  } catch {
    console.log('Storage not available, using in-memory only');
  }
}

export function loadSession(id: string): SessionData | null {
  if (!isBrowser) return null;
  try {
    const stored = localStorage.getItem(`session_${id}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// --- History ---

export function loadHistory(): HaikuHistoryEntry[] {
  if (!isBrowser) return [];
  try {
    const stored = localStorage.getItem('haiku_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.log('Failed to load history');
    return [];
  }
}

export function saveHistory(history: HaikuHistoryEntry[]): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem('haiku_history', JSON.stringify(history));
  } catch {
    console.log('Failed to save history');
  }
}
