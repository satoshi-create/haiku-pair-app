import type { HaikuHistoryEntry } from '@/lib/types';

interface GalleryScreenProps {
  history: HaikuHistoryEntry[];
  onOpenShareCard: (haiku: string, kigo: string, season: string, author: string) => void;
  onGenerateHaiga: (haiku: string, kigo: string) => void;
  onDeleteEntry: (id: number) => void;
  onGoHome: () => void;
}

export default function GalleryScreen({
  history,
  onOpenShareCard,
  onGenerateHaiga,
  onDeleteEntry,
  onGoHome,
}: GalleryScreenProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">📚 句の履歴</h2>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-400 text-lg mb-2">まだ句がありません</p>
            <p className="text-stone-400 text-sm">句会やシミュレーションで句を詠んでみましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-stone-50 p-5 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
              >
                <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap mb-3">
                  {entry.haiku}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-stone-500">
                    季語：{entry.kigo}（{entry.season}）
                    {entry.author && ` / ${entry.author}`} /{' '}
                    {new Date(entry.date).toLocaleDateString('ja-JP')}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenShareCard(entry.haiku, entry.kigo, entry.season, entry.author)}
                      className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      📤 共有
                    </button>
                    <button
                      onClick={() => onGenerateHaiga(entry.haiku, entry.kigo)}
                      className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                      🎨 俳画
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-stone-200">
          <button
            onClick={onGoHome}
            className="w-full text-sm text-stone-600 hover:text-stone-800"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
