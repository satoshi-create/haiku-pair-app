/**
 * 季節限定 UI 用。`data-theme` などに渡す識別子。
 * 日付の解釈は {@link getSeasonTheme} の JSDoc を参照。
 */
export type SeasonThemeName = "sakura" | "spring" | "summer" | "autumn" | "winter";

function getTokyoYMD(d: Date): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { month, day };
}

/** 東京都の暦で 3/20〜4/10 を桜シーズンとする */
function isSakuraSeason(month: number, day: number): boolean {
  if (month === 3 && day >= 20) return true;
  if (month === 4 && day <= 10) return true;
  return false;
}

/**
 * 今日（既定）の季節テーマ名を返す。
 * 暦は **Asia/Tokyo**（句会アプリの想定利用地に合わせる）。
 *
 * - **sakura**: 3月20日〜4月10日
 * - **spring**: 3/1〜3/19、4/11〜5/31
 * - **summer**: 6〜8月
 * - **autumn**: 9〜11月
 * - **winter**: 12〜2月
 *
 * 見た目は `app/globals.css` の `html[data-theme=…]` と対応（各テーマとも背景は単色トーン）。
 */
export function getSeasonTheme(date: Date = new Date()): SeasonThemeName {
  const { month, day } = getTokyoYMD(date);
  if (isSakuraSeason(month, day)) return "sakura";

  if (month === 3 || (month === 4 && day > 10) || month === 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
