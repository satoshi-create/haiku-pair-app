import type { SessionData, HaikuHistoryEntry } from './types';

const isBrowser = typeof window !== 'undefined';

/** オブジェクトが HaikuHistoryEntry として有効か（シミュレーション結果等の古い形式を除外） */
function isValidHistoryEntry(raw: unknown): raw is HaikuHistoryEntry {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return (
    (typeof o.id === 'number' || typeof o.id === 'string') &&
    typeof o.haiku === 'string' &&
    o.haiku.length > 0 &&
    typeof o.kigo === 'string' &&
    typeof o.season === 'string' &&
    typeof o.author === 'string' &&
    typeof o.date === 'string'
  );
}

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
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter(isValidHistoryEntry);
    return filtered;
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
