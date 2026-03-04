"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchFamilyHaikus,
  formatOriginDate,
  type FamilyHaikuRow,
} from "@/lib/familyHaikusApi";

interface FamilyGalleryProps {
  onClose: () => void;
}

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

export default function FamilyGallery({ onClose }: FamilyGalleryProps) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<FamilyHaikuRow[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFamilyHaikus()
      .then((data) => {
        if (!cancelled) setList(data);
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

  if (loading) {
    return (
      <div className="space-y-6 max-h-[90vh] overflow-y-auto">
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
    <div className="space-y-6 max-h-[90vh] overflow-y-auto">
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

        {/* 表示切り替えトグル（タイトルとタグフィルターの間） */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`min-h-[44px] px-5 rounded-xl text-lg font-semibold transition-colors ${
              viewMode === "list"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            リスト
          </button>
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`min-h-[44px] px-5 rounded-xl text-lg font-semibold transition-colors ${
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
                onClick={() => setSelectedTag(null)}
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
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
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
                return (
                  <li
                    key={row.id}
                    className="flex gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50/80"
                  >
                    <div className="shrink-0 w-24 h-24 min-w-[96px] min-h-[96px] rounded-lg overflow-hidden bg-stone-200">
                      {row.image_url ? (
                        <button
                          type="button"
                          onClick={() => setExpandedImageUrl(row.image_url)}
                          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-stone-400 rounded-lg"
                          aria-label="画像を拡大"
                        >
                          <img
                            src={row.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-2xl">
                          📝
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
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredList.length === 0 ? (
              <div className="col-span-full text-xl text-stone-500 py-12 text-center">
                {selectedTag ? "このタグの句はありません" : "まだ句がありません"}
              </div>
            ) : (
              filteredList.map((row) => {
                const tags = normalizeTags(row.tags);
                return (
                  <article
                    key={row.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden flex flex-col"
                  >
                    {/* 上部: 写真（正方形・object-cover） */}
                    <div className="aspect-square w-full bg-stone-200">
                      {row.image_url ? (
                        <button
                          type="button"
                          onClick={() => setExpandedImageUrl(row.image_url)}
                          className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-inset"
                          aria-label="画像を拡大"
                        >
                          <img
                            src={row.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-5xl">
                          📝
                        </div>
                      )}
                    </div>
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

      {/* 画像拡大モーダル（モーダル内モーダル） */}
      {expandedImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImageUrl(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setExpandedImageUrl(null)}
          aria-label="閉じる"
        >
          <div
            className="relative max-w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedImageUrl}
              alt="拡大表示"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setExpandedImageUrl(null)}
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
