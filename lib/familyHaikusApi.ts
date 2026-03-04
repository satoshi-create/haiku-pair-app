import { supabase } from "@/lib/supabase/client";

export interface FamilyHaikuRow {
  id: string;
  haiku_text: string;
  image_url: string | null;
  tags: string[] | null;
  origin_date: string | null;
}

/**
 * family_haikus テーブルから全件を取得（origin_date 降順）。
 * カラム: id, haiku_text, image_url, tags, origin_date
 */
export async function fetchFamilyHaikus(): Promise<FamilyHaikuRow[]> {
  const { data, error } = await supabase
    .from("family_haikus")
    .select("id, haiku_text, image_url, tags, origin_date")
    .order("origin_date", { ascending: false });

  if (error) {
    console.error("[Supabase] fetchFamilyHaikus failed:", error.message);
    return [];
  }

  return (data ?? []) as FamilyHaikuRow[];
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
