import { supabase } from "@/lib/supabase/client";

/** 1時間あたりのAIリクエスト上限 */
export const AI_RATE_LIMIT_HOURLY = 5;
/** 1日あたりのAIリクエスト上限 */
export const AI_RATE_LIMIT_DAILY = 15;

/**
 * AIリクエストが許可されているか判定する。
 * ai_request_logs テーブルを参照し、1時間5回・1日15回の制限内であれば true。
 *
 * ※ ai_request_logs テーブルが必要です:
 *   CREATE TABLE ai_request_logs (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id UUID NOT NULL,
 *     request_type TEXT NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT now()
 *   );
 */
export async function checkAiRateLimit(
  userId: string,
  requestType: string
): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: countHourly } = await supabase
      .from("ai_request_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("request_type", requestType)
      .gte("created_at", oneHourAgo);

    const { count: countDaily } = await supabase
      .from("ai_request_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("request_type", requestType)
      .gte("created_at", oneDayAgo);

    const hourly = countHourly ?? 0;
    const daily = countDaily ?? 0;

    return hourly < AI_RATE_LIMIT_HOURLY && daily < AI_RATE_LIMIT_DAILY;
  } catch (e) {
    console.error("[checkAiRateLimit]", e);
    return false;
  }
}

/**
 * 残り相談回数を返す。制限に達している場合は 0。
 */
export async function getAiRequestRemaining(
  userId: string,
  requestType: string
): Promise<number> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: countHourly } = await supabase
      .from("ai_request_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("request_type", requestType)
      .gte("created_at", oneHourAgo);

    const { count: countDaily } = await supabase
      .from("ai_request_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("request_type", requestType)
      .gte("created_at", oneDayAgo);

    const hourlyRemaining = Math.max(0, AI_RATE_LIMIT_HOURLY - (countHourly ?? 0));
    const dailyRemaining = Math.max(0, AI_RATE_LIMIT_DAILY - (countDaily ?? 0));

    return Math.min(hourlyRemaining, dailyRemaining);
  } catch (e) {
    console.error("[getAiRequestRemaining]", e);
    return 0;
  }
}

/**
 * AIリクエストを ai_request_logs に記録する。
 */
export async function logAiRequest(
  userId: string,
  requestType: string
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_request_logs").insert({
      user_id: userId,
      request_type: requestType,
    });

    if (error) {
      console.error("[logAiRequest]", error.message);
    }
  } catch (e) {
    console.error("[logAiRequest]", e);
  }
}
