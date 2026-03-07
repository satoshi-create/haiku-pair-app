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

// --- User ID (my_user_uuid) ---
// 永続的なユーザー識別子。未設定の場合は生成して保存する。

const MY_USER_UUID_KEY = "my_user_uuid";

export function getMyUserUuid(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(MY_USER_UUID_KEY);
  } catch {
    return null;
  }
}

export function setMyUserUuid(uuid: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(MY_USER_UUID_KEY, uuid);
  } catch {
    console.log("Failed to save my_user_uuid");
  }
}

/**
 * ストレージから取得し、なければ生成して保存して返す。
 * 既存の UUID がある場合は絶対に上書きしない。
 */
export function ensureMyUserUuid(): string | null {
  if (!isBrowser) return null;
  try {
    const existing = localStorage.getItem(MY_USER_UUID_KEY);
    // null・空文字・空白のみの場合は新規発行。それ以外は既存を返す。
    if (!existing || existing.trim() === "") {
      const uuid = crypto.randomUUID();
      localStorage.setItem(MY_USER_UUID_KEY, uuid);
      return uuid;
    }
    return existing;
  } catch {
    return null;
  }
}

// --- Display Name (profiles 用) ---
const USER_DISPLAY_NAME_KEY = "user_display_name";

export function getDisplayName(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(USER_DISPLAY_NAME_KEY);
  } catch {
    return null;
  }
}

export function setDisplayName(name: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(USER_DISPLAY_NAME_KEY, name);
  } catch {
    console.log("Failed to save user_display_name");
  }
}
