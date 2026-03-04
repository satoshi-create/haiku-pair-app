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
 * 自分の俳句履歴を Supabase haikus テーブルから取得。
 * image_url, tags を含む。client_key で自分の participant を特定。
 */
export async function fetchHaikuHistory(clientKey: string): Promise<HaikuHistoryEntry[]> {
  if (!clientKey) return [];

  try {
    const { data: participants } = await supabase
      .from("participants")
      .select("id")
      .eq("client_key", clientKey);

    const ids = participants?.map((p) => p.id) ?? [];
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("haikus")
      .select(`
        id, content, image_url, tags, submitted_at,
        sessions(kigo, season),
        participants(name)
      `)
      .in("participant_id", ids)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("[Supabase] fetchHaikuHistory failed:", error.message);
      return [];
    }

    return ((data ?? []) as unknown as DbHaiku[]).map((row) => ({
      id: row.id,
      haiku: row.content ?? "",
      kigo: row.sessions?.kigo ?? "—",
      season: row.sessions?.season ?? "—",
      author: row.participants?.name ?? "私",
      date: row.submitted_at ?? new Date().toISOString(),
      image_url: row.image_url ?? null,
      tags: normalizeTags(row.tags),
    }));
  } catch (e) {
    console.error("[fetchHaikuHistory]", e);
    return [];
  }
}
