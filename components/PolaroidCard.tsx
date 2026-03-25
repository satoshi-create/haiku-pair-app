"use client";

import { getCloudinaryUrl, CLOUDINARY_ZOOM_WIDTH } from "@/lib/cloudinary";

export interface PolaroidCardProps {
  /** 俳句で使用した写真（Cloudinary URL 等） */
  imageUrl: string | null;
  /** お父様の指書き画像（data URL）。ある場合は写真の上にオーバーレイ表示 */
  handwritingImageUrl?: string | null;
  /** AIがテキスト化した俳句 */
  haiku: string;
  /** 作成日（ISO 8601 または表示用文字列） */
  date: string;
  /** 詠み手（profiles / participants 由来の表示名） */
  authorLabel?: string | null;
  /** 縦書きで表示するか（デフォルト: true） */
  verticalText?: boolean;
  /** 印刷用クラス（L判用スタイル適用） */
  forPrint?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * ポラロイド風カード。Epson EP（L判 89×127mm）向け印刷用。
 * 上部：写真（正方形）+ 指書きオーバーレイ／下部：俳句 + 作成日
 */
export default function PolaroidCard({
  imageUrl,
  handwritingImageUrl = null,
  haiku,
  date,
  authorLabel = null,
  verticalText = true,
  forPrint = false,
}: PolaroidCardProps) {
  const containerClass = forPrint
    ? "polaroid-card polaroid-card--print"
    : "polaroid-card";

  return (
    <div
      className={containerClass}
      style={
        {
          colorAdjust: forPrint ? "exact" : undefined,
          printColorAdjust: forPrint ? "exact" : undefined,
        } as React.CSSProperties
      }
    >
      {/* 上部：写真（正方形） */}
      <div className="polaroid-card__photo-area">
        <div className="polaroid-card__photo-inner">
          {imageUrl ? (
            <img
              src={getCloudinaryUrl(imageUrl, CLOUDINARY_ZOOM_WIDTH)}
              alt=""
              className="polaroid-card__photo"
            />
          ) : (
            <div className="polaroid-card__photo-placeholder">
              <span className="polaroid-card__photo-placeholder-icon" aria-hidden>📷</span>
            </div>
          )}
        </div>
      </div>

      {/* 下部：俳句 + 作成日 + 落款（指書き） */}
      <div className="polaroid-card__caption">
        <p
          className={`polaroid-card__haiku font-kaisei ${
            verticalText ? "polaroid-card__haiku--vertical" : ""
          }`}
        >
          {haiku.replace(/　/g, "\n")}
        </p>
        <p className="polaroid-card__date">{formatDate(date)}</p>
        {authorLabel && authorLabel.trim() !== "" && authorLabel !== "—" && (
          <p className="polaroid-card__author font-kaisei">{authorLabel}</p>
        )}
        {handwritingImageUrl && (
          <img
            src={handwritingImageUrl}
            alt=""
            className="polaroid-card__handwriting"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
