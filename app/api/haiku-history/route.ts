import { NextResponse } from "next/server";
import type { HaikuHistoryEntry } from "@/lib/types";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

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

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientKey, userId } = body as {
    clientKey?: string | null;
    userId?: string | null;
  };

  const ck = clientKey?.trim() || "";
  const uid = userId?.trim() || "";
  if (!ck && !uid) return NextResponse.json({ entries: [] satisfies HaikuHistoryEntry[] });

  let admin: ReturnType<typeof createSupabaseAdmin> | null = null;
  try {
    admin = createSupabaseAdmin();
  } catch {
    // service role が無い環境では 501 にする（クライアント側フォールバックが効く）
    return NextResponse.json({ error: "Service role not configured" }, { status: 501 });
  }

  const sessionIdSet = new Set<string>();

  if (ck) {
    const { data: byClientKey } = await admin
      .from("participants")
      .select("session_id")
      .eq("client_key", ck);
    for (const p of byClientKey ?? []) {
      if (p?.session_id) sessionIdSet.add(p.session_id);
    }
  }

  if (uid) {
    const { data: byUserId } = await admin
      .from("participants")
      .select("session_id")
      .eq("user_id", uid);
    for (const p of byUserId ?? []) {
      if (p?.session_id) sessionIdSet.add(p.session_id);
    }
  }

  const sessionIds = Array.from(sessionIdSet);
  if (sessionIds.length === 0) return NextResponse.json({ entries: [] satisfies HaikuHistoryEntry[] });

  const { data, error } = await admin
    .from("haikus")
    .select(
      `
        id, content, image_url, tags, submitted_at,
        sessions(kigo, season),
        participants(name),
        profiles(display_name)
      `,
    )
    .in("session_id", sessionIds)
    .order("submitted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = ((data ?? []) as unknown as DbHaiku[]).map((row) => {
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
    } satisfies HaikuHistoryEntry;
  });

  return NextResponse.json({ entries });
}

