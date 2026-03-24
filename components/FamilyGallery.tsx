  "use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCloudinaryUrl,
  CLOUDINARY_ZOOM_WIDTH,
} from "@/lib/cloudinary";
import {
  fetchFamilyHaikus,
  formatOriginDate,
  type FamilyHaikuRow,
} from "@/lib/familyHaikusApi";

interface FamilyGalleryProps {
  onClose: () => void;
}

type ImageViewMode = "photo" | "haiga";

/** tags を正規化（DBが文字列で返す場合に対応） */
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

function hasImageUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function getInitialImageViewMode(row: FamilyHaikuRow): ImageViewMode {
  return hasImageUrl(row.haiga_url) ? "haiga" : "photo";
}

function resolveImageViewMode(
  row: FamilyHaikuRow,
  desired: ImageViewMode | undefined,
): ImageViewMode {
  const hasPhoto = hasImageUrl(row.image_url);
  const hasHaiga = hasImageUrl(row.haiga_url);
  if (desired === "haiga" && hasHaiga) return "haiga";
  if (desired === "photo" && hasPhoto) return "photo";
  return hasHaiga ? "haiga" : "photo";
}

function getDisplayImageUrl(row: FamilyHaikuRow, mode: ImageViewMode): string | null {
  if (mode === "haiga" && hasImageUrl(row.haiga_url)) return row.haiga_url!;
  if (mode === "photo" && hasImageUrl(row.image_url)) return row.image_url!;
  if (hasImageUrl(row.haiga_url)) return row.haiga_url!;
  if (hasImageUrl(row.image_url)) return row.image_url!;
  return null;
}

const INITIAL_BATCH = 4;
const BATCH_SIZE = 4;
const BATCH_DELAY_MS = 200;

export default function FamilyGallery({ onClose }: FamilyGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<FamilyHaikuRow[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<FamilyHaikuRow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  /** ゴーストクリック対策：切り替え直後のクールダウン（ms） */
  const [switchCooldown, setSwitchCooldown] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const lastBatchLoadedRef = useRef(false);
  const [imageViewByRowId, setImageViewByRowId] = useState<
    Record<string, ImageViewMode>
  >({});

  const handleViewModeChange = useCallback(
    (mode: "list" | "card") => {
      if (mode === viewMode) return;
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      setSwitchCooldown(true);
      setViewMode(mode);
      setVisibleCount(INITIAL_BATCH);
      lastBatchLoadedRef.current = false;
      cooldownTimerRef.current = setTimeout(() => {
        setSwitchCooldown(false);
        cooldownTimerRef.current = null;
      }, 400);
    },
    [viewMode],
  );

  const handleSelectedTagChange = useCallback((tag: string | null) => {
    setSelectedTag(tag);
    setVisibleCount(INITIAL_BATCH);
    lastBatchLoadedRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchFamilyHaikus()
      .then((data) => {
        if (!cancelled) {
          setList(data);
          const initialModes: Record<string, ImageViewMode> = {};
          for (const row of data) {
            initialModes[row.id] = getInitialImageViewMode(row);
          }
          setImageViewByRowId(initialModes);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    list.forEach((row) => {
      const tags = normalizeTags(row.tags);
      tags.forEach((t) => set.add(t.trim()));
    });
    return Array.from(set).sort();
  }, [list]);

  const filteredList = useMemo(() => {
    if (!selectedTag) return list;
    return list.filter((row) => {
      const tags = normalizeTags(row.tags);
      return tags.some((t) => t.trim() === selectedTag);
    });
  }, [list, selectedTag]);

  const scheduleNextBatch = useCallback(() => {
    if (
      viewMode !== "card" ||
      filteredList.length <= visibleCount ||
      expandedRow != null ||
      lastBatchLoadedRef.current
    )
      return;
    lastBatchLoadedRef.current = true;
    window.setTimeout(() => {
      setVisibleCount((prev) => {
        const next = Math.min(prev + BATCH_SIZE, filteredList.length);
        lastBatchLoadedRef.current = next >= filteredList.length;
        return next;
      });
    }, BATCH_DELAY_MS);
  }, [viewMode, filteredList.length, visibleCount, expandedRow]);

  const handleLastCardImageLoad = useCallback(() => {
    scheduleNextBatch();
  }, [scheduleNextBatch]);

  const visibleList = viewMode === "card" ? filteredList.slice(0, visibleCount) : filteredList;

  // 最後のカードに画像がない場合のフォールバック：BATCH_DELAY_MS 後に次を追加
  useEffect(() => {
    if (
      viewMode !== "card" ||
      visibleCount >= filteredList.length ||
      expandedRow != null
    )
      return;
    const lastRow = visibleList[visibleList.length - 1];
    if (lastRow && getDisplayImageUrl(lastRow, resolveImageViewMode(lastRow, imageViewByRowId[lastRow.id]))) return;
    const id = window.setTimeout(() => {
      setVisibleCount((prev) => {
        const next = Math.min(prev + BATCH_SIZE, filteredList.length);
        lastBatchLoadedRef.current = next >= filteredList.length;
        return next;
      });
    }, BATCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [viewMode, visibleCount, filteredList.length, visibleList, expandedRow, imageViewByRowId]);

  if (loading) {
    return (
      <div className="space-y-6 max-h-[90dvh] overflow-y-auto">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-stone-200">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-stone-800">家族の思い出</h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-12 h-12 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-700 text-2xl transition-colors"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
          <p className="text-xl text-stone-600 py-12 text-center">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 max-h-[90dvh] overflow-y-auto ${expandedRow ? "overflow-hidden" : ""}`}
    >
      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-stone-200">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-stone-800">家族の思い出</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-12 h-12 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-700 text-2xl transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* 表示切り替えトグル（sticky でレイアウトシフト時の誤タップを防ぐ、touch-action でゴーストクリック軽減） */}
        <div className="sticky top-0 z-10 flex gap-2 mb-6 py-2 -mx-2 px-2 bg-white/95 backdrop-blur-sm -mt-2 touch-manipulation">
          <button
            type="button"
            disabled={switchCooldown}
            onClick={() => handleViewModeChange("list")}
            className={`min-h-[44px] px-5 rounded-xl text-lg font-semibold transition-colors touch-manipulation ${
              viewMode === "list"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            リスト
          </button>
          <button
            type="button"
            disabled={switchCooldown}
            onClick={() => handleViewModeChange("card")}
            className={`min-h-[44px] px-5 rounded-xl text-lg font-semibold transition-colors touch-manipulation ${
              viewMode === "card"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            カード
          </button>
        </div>

        {/* タグフィルター（横スクロールチップ） */}
        {uniqueTags.length > 0 && (
          <div className="mb-6">
            <p className="text-base text-stone-600 mb-2">タグで絞る</p>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => handleSelectedTagChange(null)}
                className={`shrink-0 min-h-[44px] px-4 rounded-xl text-lg font-semibold transition-colors ${
                  selectedTag === null
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                すべて
              </button>
              {uniqueTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectedTagChange(selectedTag === tag ? null : tag)}
                  className={`shrink-0 min-h-[44px] px-4 rounded-xl text-lg font-semibold transition-colors ${
                    selectedTag === tag
                      ? "bg-amber-500 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* コンテンツ: リスト表示 or カード表示 */}
        {viewMode === "list" ? (
          <ul className="space-y-5">
            {filteredList.length === 0 ? (
              <li className="text-xl text-stone-500 py-8 text-center">
                {selectedTag ? "このタグの句はありません" : "まだ句がありません"}
              </li>
            ) : (
              filteredList.map((row) => {
                const tags = normalizeTags(row.tags);
                const mode = resolveImageViewMode(row, imageViewByRowId[row.id]);
                const displayImageUrl = getDisplayImageUrl(row, mode);
                const hasPhoto = hasImageUrl(row.image_url);
                const hasHaiga = hasImageUrl(row.haiga_url);
                const showImageSwitcher = hasPhoto && hasHaiga;
                return (
                  <li
                    key={row.id}
                    className="flex gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50/80"
                  >
                    <div className="shrink-0 w-24 h-24 min-w-[96px] min-h-[96px] rounded-lg overflow-hidden bg-stone-200 relative">
                      {displayImageUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(row);
                          }}
                          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-stone-400 rounded-lg relative"
                          aria-label="画像を拡大"
                        >
                          {(() => {
                            const imgSrc = getCloudinaryUrl(displayImageUrl, 400, "gallery");
                            if (imgSrc.startsWith("data:")) {
                              return (
                                // eslint-disable-next-line @next/next/no-img-element -- data: URL は next/image 非対応
                                <img
                                  src={imgSrc}
                                  alt=""
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                            return (
                              <Image
                                src={imgSrc}
                                alt=""
                                fill
                                sizes="96px"
                                className="object-cover"
                              />
                            );
                          })()}
                        </button>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 text-sm px-1 text-center leading-tight">
                          {hasHaiga ? "写真がありません" : "画像がありません"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap mb-1">
                        {(row.haiku_text ?? "").replace(/　/g, " ")}
                      </p>
                      <p className="text-base text-stone-500 mb-2">
                        {formatOriginDate(row.origin_date)}
                      </p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="text-sm text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      {showImageSwitcher && (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setImageViewByRowId((prev) => ({ ...prev, [row.id]: "photo" }))
                            }
                            className={`min-h-[44px] px-3 rounded-lg text-sm font-semibold border transition-colors ${
                              mode === "photo"
                                ? "bg-stone-800 text-white border-stone-800"
                                : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                            }`}
                          >
                            📷 写真
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageViewByRowId((prev) => ({ ...prev, [row.id]: "haiga" }))
                            }
                            className={`min-h-[44px] px-3 rounded-lg text-sm font-semibold border transition-colors ${
                              mode === "haiga"
                                ? "bg-stone-800 text-white border-stone-800"
                                : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                            }`}
                          >
                            🖌️ 俳画
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 sm:px-4 w-full max-w-full [content-visibility:auto]">
            {filteredList.length === 0 ? (
              <div className="col-span-full text-xl text-stone-500 py-12 text-center">
                {selectedTag ? "このタグの句はありません" : "まだ句がありません"}
              </div>
            ) : (
              visibleList.map((row, idx) => {
                const tags = normalizeTags(row.tags);
                const isLastCard = idx === visibleList.length - 1;
                const shouldTriggerOnLoad = isLastCard && visibleCount < filteredList.length;
                const mode = resolveImageViewMode(row, imageViewByRowId[row.id]);
                const displayImageUrl = getDisplayImageUrl(row, mode);
                const hasPhoto = hasImageUrl(row.image_url);
                const hasHaiga = hasImageUrl(row.haiga_url);
                const showImageSwitcher = hasPhoto && hasHaiga;
                return (
                  <article
                    key={row.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden flex flex-col min-w-0 [content-visibility:auto]"
                  >
                    {/* 上部: 写真（正方形・object-cover） */}
                    <div className="aspect-square w-full bg-stone-200 relative">
                      {displayImageUrl ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(row);
                          }}
                          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-inset relative"
                          aria-label="画像を拡大"
                        >
                          {(() => {
                            const imgSrc = getCloudinaryUrl(displayImageUrl, 400, "gallery");
                            if (imgSrc.startsWith("data:")) {
                              return (
                                // eslint-disable-next-line @next/next/no-img-element -- data: URL は next/image 非対応
                                <img
                                  src={imgSrc}
                                  alt=""
                                  loading="lazy"
                                  onLoad={shouldTriggerOnLoad ? handleLastCardImageLoad : undefined}
                                  className="w-full h-full object-cover transition-opacity duration-300"
                                />
                              );
                            }
                            return (
                              <Image
                                src={imgSrc}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 100vw, 50vw"
                                onLoad={shouldTriggerOnLoad ? handleLastCardImageLoad : undefined}
                                className="object-cover transition-opacity duration-300"
                              />
                            );
                          })()}
                        </button>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-500 px-4 text-center">
                          <p className="text-2xl mb-1">🖼️</p>
                          <p className="text-lg font-semibold">
                            {hasHaiga ? "写真がありません" : "画像がありません"}
                          </p>
                          {!hasHaiga && <p className="text-base">俳画作成中</p>}
                        </div>
                      )}
                    </div>
                    {showImageSwitcher && (
                      <div className="px-4 sm:px-5 pt-4 pb-1">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setImageViewByRowId((prev) => ({ ...prev, [row.id]: "photo" }))
                            }
                            className={`min-h-[48px] rounded-xl text-lg font-semibold border-2 transition-colors ${
                              mode === "photo"
                                ? "bg-amber-100 text-amber-900 border-amber-500"
                                : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
                            }`}
                          >
                            📷 写真
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageViewByRowId((prev) => ({ ...prev, [row.id]: "haiga" }))
                            }
                            className={`min-h-[48px] rounded-xl text-lg font-semibold border-2 transition-colors ${
                              mode === "haiga"
                                ? "bg-amber-100 text-amber-900 border-amber-500"
                                : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
                            }`}
                          >
                            🖌️ 俳画
                          </button>
                        </div>
                      </div>
                    )}
                    {/* 中央: 俳句 */}
                    <div className="p-6 flex-1">
                      <p className="text-2xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap mb-4">
                        {(row.haiku_text ?? "").replace(/　/g, " ")}
                      </p>
                    </div>
                    {/* 下部: 日付（左）とタグチップ（右） */}
                    <div className="px-6 pb-6 pt-0 flex items-center justify-between gap-4 flex-wrap">
                      <p className="text-base text-stone-500">
                        {formatOriginDate(row.origin_date)}
                      </p>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="text-sm text-stone-600 bg-stone-200 px-2.5 py-1 rounded-lg"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
            {viewMode === "card" && visibleCount < filteredList.length && (
              <div className="col-span-full py-4 text-center text-stone-500 text-sm">
                読み込み中…（{visibleCount} / {filteredList.length} 件）
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] text-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 py-4 rounded-xl font-semibold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>

      {/* 画像拡大モーダル：表示中の画像＋俳句を表示 */}
      {expandedRow &&
        getDisplayImageUrl(
          expandedRow,
          resolveImageViewMode(expandedRow, imageViewByRowId[expandedRow.id]),
        ) && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedRow(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setExpandedRow(null)}
          aria-label="閉じる"
        >
          <div
            className="relative w-[95vw] max-w-[1200px] max-h-[90dvh] flex flex-col items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const mode = resolveImageViewMode(
                expandedRow,
                imageViewByRowId[expandedRow.id],
              );
              const hasPhoto = hasImageUrl(expandedRow.image_url);
              const hasHaiga = hasImageUrl(expandedRow.haiga_url);
              if (!(hasPhoto && hasHaiga)) return null;
              return (
                <div className="w-full max-w-[1200px] flex justify-center">
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    <button
                      type="button"
                      onClick={() =>
                        setImageViewByRowId((prev) => ({
                          ...prev,
                          [expandedRow.id]: "photo",
                        }))
                      }
                      className={`min-h-[52px] rounded-xl text-lg font-semibold border-2 transition-colors ${
                        mode === "photo"
                          ? "bg-amber-100 text-amber-900 border-amber-500"
                          : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                      }`}
                    >
                      📷 写真
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImageViewByRowId((prev) => ({
                          ...prev,
                          [expandedRow.id]: "haiga",
                        }))
                      }
                      className={`min-h-[52px] rounded-xl text-lg font-semibold border-2 transition-colors ${
                        mode === "haiga"
                          ? "bg-amber-100 text-amber-900 border-amber-500"
                          : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                      }`}
                    >
                      🖌️ 俳画
                    </button>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const displayImageUrl = getDisplayImageUrl(
                expandedRow,
                resolveImageViewMode(expandedRow, imageViewByRowId[expandedRow.id]),
              );
              if (!displayImageUrl) return null;
              const imgSrc = getCloudinaryUrl(displayImageUrl, CLOUDINARY_ZOOM_WIDTH);
              if (imgSrc.startsWith("data:")) {
                return (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- data: URL は next/image 非対応 */}
                    <img
                      src={imgSrc}
                      alt="拡大表示"
                      loading="lazy"
                      className="max-w-full max-h-[70dvh] w-auto h-auto object-contain rounded-lg"
                    />
                    <div className="w-full max-w-[1200px] bg-white/95 rounded-xl p-6 text-center">
                      <p className="text-xl sm:text-2xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap">
                        {(expandedRow.haiku_text ?? "").replace(/　/g, " ")}
                      </p>
                      <p className="text-base text-stone-500 mt-2">
                        {formatOriginDate(expandedRow.origin_date)}
                      </p>
                    </div>
                  </>
                );
              }
              return (
                <>
                  <div className="relative w-full max-w-[1200px] h-[60dvh] min-h-[200px] max-h-[70dvh]">
                    <Image
                      src={imgSrc}
                      alt="拡大表示"
                      fill
                      sizes="95vw"
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <div className="w-full max-w-[1200px] bg-white/95 rounded-xl p-6 text-center">
                    <p className="text-xl sm:text-2xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap">
                      {(expandedRow.haiku_text ?? "").replace(/　/g, " ")}
                    </p>
                    <p className="text-base text-stone-500 mt-2">
                      {formatOriginDate(expandedRow.origin_date)}
                    </p>
                  </div>
                </>
              );
            })()}
            <button
              type="button"
              onClick={() => setExpandedRow(null)}
              className="absolute -top-2 -right-2 w-12 h-12 min-h-[44px] min-w-[44px] rounded-full bg-white text-stone-700 text-xl flex items-center justify-center hover:bg-stone-100 shadow-lg"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
