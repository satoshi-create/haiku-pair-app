import { supabase } from "@/lib/supabase/client";

export interface FamilyHaikuRow {
  id: string;
  haiku_text: string;
  image_url: string | null;
  haiga_url?: string | null;
  tags: string[] | null;
  origin_date: string | null;
}

/**
 * family_haikus テーブルから全件を取得（origin_date 降順）。
 * カラム: id, haiku_text, image_url, haiga_url, tags, origin_date
 */
export async function fetchFamilyHaikus(): Promise<FamilyHaikuRow[]> {
  // 先に haiga_url ありで取得。列未追加環境ではフォールバックする。
  const primary = await supabase
    .from("family_haikus")
    .select("id, haiku_text, image_url, haiga_url, tags, origin_date")
    .order("origin_date", { ascending: false });

  if (!primary.error) {
    return (primary.data ?? []) as FamilyHaikuRow[];
  }

  const missingHaigaColumn =
    primary.error.message.includes("haiga_url") ||
    primary.error.message.includes("column") ||
    primary.error.code === "42703";

  if (!missingHaigaColumn) {
    console.error("[Supabase] fetchFamilyHaikus failed:", primary.error.message);
    return [];
  }

  const fallback = await supabase
    .from("family_haikus")
    .select("id, haiku_text, image_url, tags, origin_date")
    .order("origin_date", { ascending: false });

  if (fallback.error) {
    console.error("[Supabase] fetchFamilyHaikus fallback failed:", fallback.error.message);
    return [];
  }

  return ((fallback.data ?? []) as FamilyHaikuRow[]).map((row) => ({
    ...row,
    haiga_url: null,
  }));
}

/** origin_date から表示用の日付文字列（例: 2010年5月）を生成 */
export function formatOriginDate(originDate: string | null): string {
  if (!originDate) return "—";
  try {
    const d = new Date(originDate);
    if (Number.isNaN(d.getTime())) return originDate;
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  } catch {
    return originDate;
  }
}
