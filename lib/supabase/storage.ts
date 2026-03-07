import { supabase } from "@/lib/supabase/client";

const BUCKET_NAME = "haiku-images";

/**
 * Data URL を Blob に変換する
 */
function dataURLtoBlob(dataUrl: string): { blob: Blob; extension: string } {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? "image/png";
  const bstr = atob(arr[1] ?? "");
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  const extension = mime === "image/jpeg" || mime === "image/jpg" ? "jpg" : "png";
  return { blob: new Blob([u8arr], { type: mime }), extension };
}

/**
 * Data URL を Supabase Storage の haiku-images バケットにアップロードし、
 * 公開URLを返す。
 * @param dataUrl - Base64 Data URL（例: data:image/png;base64,...）
 * @param userId - ユーザーID（パスに使用）
 * @returns 公開URL。アップロード失敗時は null
 */
export async function uploadHaikuImage(
  dataUrl: string,
  userId: string
): Promise<string | null> {
  if (!dataUrl?.startsWith("data:")) {
    console.warn("[uploadHaikuImage] Invalid dataUrl format");
    return null;
  }

  try {
    const { blob, extension } = dataURLtoBlob(dataUrl);
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}.${extension}`;

    const { data: uploadData, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false,
      });

    console.log("[Storage] upload result - data:", uploadData, "error:", error);

    if (error) {
      console.error(
        "[Storage Error] Upload failed:",
        error.message,
        "| status:",
        (error as { statusCode?: number }).statusCode,
        "| full:",
        error,
      );
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    const isValidHttps = typeof publicUrl === "string" && publicUrl.startsWith("https://");
    console.log("[Storage] getPublicUrl result:", publicUrl, "| isValidHttps:", isValidHttps);

    if (!isValidHttps) {
      console.error("[Storage Error] getPublicUrl did not return https URL:", publicUrl);
      return null;
    }

    return publicUrl;
  } catch (e) {
    console.error("[Storage Error]", e);
    return null;
  }
}
