"use client";

import {
    fetchHaikuHistory,
    getSeasonBgClass,
} from "@/lib/haikuHistoryApi";
import type { HaikuHistoryEntry } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type ViewMode = "card" | "list";

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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = history.map(normalizeEntry);
    const clientKey =
      typeof window !== "undefined" ? localStorage.getItem("client_key") : null;
    const promise = clientKey
      ? fetchHaikuHistory(clientKey)
      : Promise.resolve([]);
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
    promise
      .then((fromApi) => {
        if (cancelled) return;
        if (fromApi.length > 0) {
          setDisplayList(fromApi.map(normalizeEntry));
        } else {
          setDisplayList(base);
        }
      })
      .catch(() => {
        if (!cancelled) setDisplayList(base);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [history]);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(displayList.map((e) => e.author).filter(Boolean));
    return Array.from(authors).sort((a, b) => a.localeCompare(b, "ja"));
  }, [displayList]);

  const filteredList = useMemo(() => {
    if (!selectedAuthor) return displayList;
    return displayList.filter((e) => e.author === selectedAuthor);
  }, [displayList, selectedAuthor]);

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">
          📚 句の履歴
        </h2>

        {!loading && displayList.length > 0 && (
          <>
            {/* 表示形式切り替え & フィルターチップ */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={`p-2.5 rounded-xl transition-colors ${
                      viewMode === "card"
                        ? "bg-stone-800 text-white"
                        : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                    }`}
                    aria-label="カード表示"
                    title="カード表示"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-xl transition-colors ${
                      viewMode === "list"
                        ? "bg-stone-800 text-white"
                        : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                    }`}
                    aria-label="リスト表示"
                    title="リスト表示"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAuthor(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedAuthor === null
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  すべて
                </button>
                {uniqueAuthors.map((author) => (
                  <button
                    key={author}
                    type="button"
                    onClick={() => setSelectedAuthor(author)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedAuthor === author
                        ? "bg-stone-800 text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {author}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {loading ? (
          <p className="text-xl text-stone-600 py-12 text-center">読み込み中...</p>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-600 text-xl mb-2">
              {displayList.length === 0 ? "まだ句がありません" : "該当する句がありません"}
            </p>
            <p className="text-stone-500 text-lg">
              {displayList.length === 0 ? "句会で詠んだ句がここに残ります" : "別のフィルターを試してください"}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {filteredList.map((entry) => {
              const tags = Array.isArray(entry.tags) ? entry.tags : [];
              return (
                <article
                  key={String(entry.id)}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 py-4 sm:py-5 px-4 sm:px-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {entry.image_url ? (
                      <button
                        type="button"
                        onClick={() => setExpandedEntry(entry)}
                        className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400"
                        aria-label="画像を拡大"
                      >
                        <img src={entry.image_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg ${getSeasonBgClass(entry.season)} flex items-center justify-center`}>
                        <span className="text-xl sm:text-2xl text-stone-400">📝</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-lg sm:text-2xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap">
                        {entry.haiku.replace(/　/g, " ")}
                      </p>
                      <p className="text-sm text-stone-500 mt-1 sm:mt-2">
                        {formatDate(entry.date)}　{entry.kigo}（{entry.season}）
                        {tags.length > 0 && `　${tags.map((t) => `#${t}`).join(" ")}`}
                      </p>
                      <p className="text-xs text-stone-400 mt-1 sm:hidden">詠み手：{entry.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap border-t border-stone-100 pt-4 sm:pt-0 sm:border-0 shrink-0">
                    <p className="text-xs text-stone-400 hidden sm:block">詠み手：{entry.author}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenShareCard(entry.haiku, entry.kigo, entry.season, entry.author)}
                        className="text-sm bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-300 min-h-[36px]"
                      >
                        📤
                      </button>
                      <button
                        type="button"
                        onClick={() => onGenerateHaiga(entry.haiku, entry.kigo, entry.season)}
                        className="text-sm bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200 min-h-[36px]"
                      >
                        🎨
                      </button>
                      {typeof entry.id === "number" && (
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id as number)}
                          className="text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 min-h-[36px]"
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
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredList.map((entry) => {
              const seasonBg = getSeasonBgClass(entry.season);
              const tags = Array.isArray(entry.tags) ? entry.tags : [];
              return (
                <article
                  key={String(entry.id)}
                  className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden flex flex-col"
                >
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
                  <div className="p-6 flex-1">
                    <p className="text-2xl text-stone-800 leading-relaxed font-serif whitespace-pre-wrap mb-4">
                      {entry.haiku.replace(/　/g, " ")}
                    </p>
                  </div>
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
                    <div className="flex items-end justify-between gap-3 flex-wrap">
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
                      <p className="text-sm text-stone-400">詠み手：{entry.author}</p>
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
