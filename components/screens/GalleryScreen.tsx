"use client";

import { useEffect, useState } from "react";
import type { HaikuHistoryEntry } from "@/lib/types";
import {
  fetchHaikuHistory,
  getSeasonBgClass,
} from "@/lib/haikuHistoryApi";

interface GalleryScreenProps {
  history: HaikuHistoryEntry[];
  onOpenShareCard: (haiku: string, kigo: string, season: string, author: string) => void;
  onGenerateHaiga: (haiku: string, kigo: string, season?: string) => void;
  onDeleteEntry: (id: number | string) => void;
  onGoHome: () => void;
}

/** 表示用にエントリを正規化（古い形式のフォールバック） */
function normalizeEntry(entry: HaikuHistoryEntry): HaikuHistoryEntry {
  return {
    id: entry.id ?? Date.now(),
    haiku:
      typeof entry.haiku === "string" && entry.haiku.length > 0
        ? entry.haiku
        : "（句がありません）",
    kigo: typeof entry.kigo === "string" ? entry.kigo : "—",
    season: typeof entry.season === "string" ? entry.season : "—",
    author: typeof entry.author === "string" ? entry.author : "—",
    date: typeof entry.date === "string" ? entry.date : new Date().toISOString(),
    image_url: entry.image_url ?? null,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
  };
}

/** 日付フォーマット */
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

export default function GalleryScreen({
  history,
  onOpenShareCard,
  onGenerateHaiga,
  onDeleteEntry,
  onGoHome,
}: GalleryScreenProps) {
  const [displayList, setDisplayList] = useState<HaikuHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<HaikuHistoryEntry | null>(null);

  useEffect(() => {
    const base = history.map(normalizeEntry);
    const clientKey =
      typeof window !== "undefined" ? localStorage.getItem("client_key") : null;
    if (!clientKey) {
      setDisplayList(base);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchHaikuHistory(clientKey)
      .then((fromApi) => {
        if (fromApi.length > 0) {
          setDisplayList(fromApi.map(normalizeEntry));
        } else {
          setDisplayList(base);
        }
      })
      .catch(() => setDisplayList(base))
      .finally(() => setLoading(false));
  }, [history]);

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-8 text-center">
          📚 句の履歴
        </h2>

        {loading ? (
          <p className="text-xl text-stone-600 py-12 text-center">読み込み中...</p>
        ) : displayList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 text-xl mb-2">まだ句がありません</p>
            <p className="text-stone-500 text-lg">句会で詠んだ句がここに残ります</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {displayList.map((entry) => {
              const seasonBg = getSeasonBgClass(entry.season);
              const tags = Array.isArray(entry.tags) ? entry.tags : [];
              return (
                <article
                  key={String(entry.id)}
                  className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden flex flex-col"
                >
                  {/* 上部: 画像（または季節色の背景） */}
                  <div
                    className={`aspect-4/3 w-full ${entry.image_url ? "bg-stone-200" : seasonBg} flex items-center justify-center`}
                  >
                    {entry.image_url ? (
                      <button
                        type="button"
                        onClick={() => setExpandedEntry(entry)}
                        className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-inset min-h-[120px]"
                        aria-label="画像を拡大"
                      >
                        <img
                          src={entry.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <span className="text-5xl text-stone-300">📝</span>
                    )}
                  </div>
                  {/* 中央: 俳句（明朝体・特大） */}
                  <div className="p-6 flex-1">
                    <p className="text-2xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap mb-4">
                      {entry.haiku.replace(/　/g, " ")}
                    </p>
                  </div>
                  {/* 下部: 日付・タグ・アクションボタン */}
                  <div className="px-6 pb-6 pt-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                      <p className="text-base text-stone-500">
                        {formatDate(entry.date)}　季語：{entry.kigo}（{entry.season}）
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
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenShareCard(entry.haiku, entry.kigo, entry.season, entry.author)
                        }
                        className="min-h-[44px] text-lg bg-stone-200 text-stone-800 px-5 py-2.5 rounded-xl hover:bg-stone-300 font-semibold transition-colors"
                      >
                        📤 共有
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onGenerateHaiga(entry.haiku, entry.kigo, entry.season)
                        }
                        className="min-h-[44px] text-lg bg-amber-100 text-amber-900 px-5 py-2.5 rounded-xl hover:bg-amber-200 font-semibold transition-colors"
                      >
                        🎨 俳画を作る
                      </button>
                      {typeof entry.id === "number" && (
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id as number)}
                          className="min-h-[44px] text-lg bg-red-100 text-red-800 px-5 py-2.5 rounded-xl hover:bg-red-200 font-semibold transition-colors"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-stone-200">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full min-h-[44px] text-xl text-stone-600 hover:text-stone-800 py-4 font-semibold"
          >
            ホームに戻る
          </button>
        </div>
      </div>

      {/* 画像拡大モーダル（俳句も表示） */}
      {expandedEntry && expandedEntry.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6"
          onClick={() => setExpandedEntry(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setExpandedEntry(null)}
          aria-label="閉じる"
        >
          <div
            className="max-w-full max-h-[90vh] flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={expandedEntry.image_url!}
              alt=""
              className="max-w-full max-h-[60vh] w-auto object-contain rounded-lg"
            />
            <p className="text-2xl text-white font-serif text-center leading-relaxed max-w-md">
              {expandedEntry.haiku.replace(/　/g, " ")}
            </p>
            <button
              type="button"
              onClick={() => setExpandedEntry(null)}
              className="min-h-[44px] min-w-[44px] px-8 py-4 text-xl font-bold bg-white text-stone-800 rounded-xl hover:bg-stone-100"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
