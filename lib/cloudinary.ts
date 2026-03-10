/**
 * Cloudinary の動的変換（f_auto, q_auto）で画像を最適化。
 * Supabase / Data URL など Cloudinary 以外はそのまま返却。
 */

/** 一覧・サムネイル用のデフォルト幅 */
export const CLOUDINARY_THUMB_WIDTH = 400;
/** 拡大表示用のデフォルト幅 */
export const CLOUDINARY_ZOOM_WIDTH = 1200;

/**
 * Cloudinary の URL を最適化する。
 * - Cloudinary: /upload/ の直後に f_auto,q_auto,w_{width},c_limit を挿入
 * - それ以外（Supabase, Data URL 等）: そのまま返却
 *
 * @param url 画像URL（Cloudinary / Supabase / data: 等）
 * @param width 幅（px）。一覧用 400、拡大用 1200 など
 */
export function getCloudinaryUrl(url: string | null | undefined, width = CLOUDINARY_THUMB_WIDTH): string {
  if (!url || typeof url !== "string") return url ?? "";

  // Data URL（data:image/...）や Supabase 等は変換しない
  if (url.startsWith("data:") || !url.includes("res.cloudinary.com")) {
    return url;
  }

  // /upload/ の直後に変換パラメータを挿入
  const transform = `f_auto,q_auto,w_${width},c_limit`;
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/${transform}/`);
  }

  return url;
}
