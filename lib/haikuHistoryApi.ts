import { supabase } from "@/lib/supabase/client";
import type { HaikuHistoryEntry } from "@/lib/types";

type DbHaiku = {
  id: string;
  content: string;
  image_url?: string | null;
  tags?: string[] | unknown;
  submitted_at: string;
  sessions: { kigo: string; season: string } | null;
  participants: { name: string } | null;
  profiles: { display_name: string | null } | null;
};

export type HaikuHistoryIdentity = {
  clientKey?: string | null;
  userId?: string | null;
};

/** 季節に応じたプレースホルダー背景色クラス */
function getSeasonBgClass(season: string): string {
  const s = season?.toLowerCase() ?? "";
  if (s.includes("春")) return "bg-pink-100";
  if (s.includes("夏")) return "bg-green-100";
  if (s.includes("秋")) return "bg-amber-100";
  if (s.includes("冬")) return "bg-sky-100";
  return "bg-stone-100";
}

export { getSeasonBgClass };

/** tags を正規化 */
function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === "string");
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === "string") : [];
    } catch {
      return tags ? [tags] : [];
    }
  }
  return [];
}

/**
 * 参加した座の俳句履歴を Supabase から取得（自分＋相手の句を含む）。
 * client_key / user_id のどちらかで自分の participants を特定し、その session_id に紐づく全俳句を返す。
 *
 * 優先: サーバーAPI（service role があれば RLS を回避）→ フォールバック: クライアント（anon key）。
 */
export async function fetchHaikuHistory(
  identity: HaikuHistoryIdentity,
): Promise<HaikuHistoryEntry[]> {
  const clientKey = identity.clientKey?.trim() || "";
  const userId = identity.userId?.trim() || "";
  if (!clientKey && !userId) return [];

  try {
    // まずはサーバーAPIを試す（存在しない/失敗したらクライアント直叩きへフォールバック）
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/haiku-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientKey: clientKey || null, userId: userId || null }),
        });
        if (res.ok) {
          const payload = (await res.json()) as { entries?: HaikuHistoryEntry[] };
          if (Array.isArray(payload.entries)) return payload.entries;
        }
      }
    } catch {
      // ignore
    }

    const sessionIdSet = new Set<string>();

    if (clientKey) {
      const { data: byClientKey } = await supabase
        .from("participants")
        .select("session_id")
        .eq("client_key", clientKey);
      for (const p of byClientKey ?? []) {
        if (p?.session_id) sessionIdSet.add(p.session_id);
      }
    }

    if (userId) {
      const { data: byUserId } = await supabase
        .from("participants")
        .select("session_id")
        .eq("user_id", userId);
      for (const p of byUserId ?? []) {
        if (p?.session_id) sessionIdSet.add(p.session_id);
      }
    }

    const sessionIds = Array.from(sessionIdSet);
    if (sessionIds.length === 0) return [];

    const { data, error } = await supabase
      .from("haikus")
      .select(`
        id, content, image_url, tags, submitted_at,
        sessions(kigo, season),
        participants(name),
        profiles(display_name)
      `)
      .in("session_id", sessionIds)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("[Supabase] fetchHaikuHistory failed:", error.message);
      return [];
    }

    return ((data ?? []) as unknown as DbHaiku[]).map((row) => {
      const displayName = row.profiles?.display_name?.trim();
      const participantName = row.participants?.name?.trim();
      const author = displayName || participantName || "私";
      return {
        id: row.id,
        haiku: row.content ?? "",
        kigo: row.sessions?.kigo ?? "—",
        season: row.sessions?.season ?? "—",
        author,
        date: row.submitted_at ?? new Date().toISOString(),
        image_url: row.image_url ?? null,
        tags: normalizeTags(row.tags),
      };
    });
  } catch (e) {
    console.error("[fetchHaikuHistory]", e);
    return [];
  }
}
