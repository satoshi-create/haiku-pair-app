interface HaigaModalProps {
  show: boolean;
  isGenerating: boolean;
  haiku: string;
  description: string;
  kigo?: string;
  season?: string;
  author?: string;
  onClose: () => void;
  onSaveToHistory?: (haiku: string, kigo: string, season: string, author: string) => void;
  onOpenShareCard?: (haiku: string, kigo: string, season: string, author: string) => void;
}

export default function HaigaModal({
  show,
  isGenerating,
  haiku,
  description,
  kigo = "",
  season = "",
  author = "私",
  onClose,
  onSaveToHistory,
  onOpenShareCard,
}: HaigaModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto border border-stone-200 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-stone-800">🎨 俳画</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="bg-stone-50 p-5 rounded-xl mb-4 border border-stone-200">
          <p className="text-xl text-stone-800 whitespace-pre-wrap text-center leading-relaxed">{haiku}</p>
        </div>

        {isGenerating ? (
          <div className="text-center py-10">
            <p className="text-xl text-stone-700 font-semibold mb-3">AIが絵を描いています</p>
            <p className="text-stone-600 mb-4">しばらくお待ちください…</p>
            <div className="inline-block w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" aria-hidden />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-stone-100 to-amber-50 p-5 rounded-xl border border-stone-200">
              <p className="text-base font-bold text-stone-700 mb-2">情景描写</p>
              <p className="text-stone-700 leading-relaxed text-lg">{description}</p>
            </div>
            <p className="text-base text-stone-500 text-center">
              この情景をもとに、墨絵やイラストで俳画を描いてみてください。
            </p>
            <div className="flex flex-col gap-3 pt-2">
              {onSaveToHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveToHistory(haiku, kigo, season, author);
                    onClose();
                  }}
                  className="w-full py-4 text-xl font-semibold bg-stone-800 text-white rounded-xl hover:bg-stone-700"
                >
                  履歴に保存
                </button>
              )}
              {onOpenShareCard && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenShareCard(haiku, kigo, season, author);
                    onClose();
                  }}
                  className="w-full py-4 text-xl font-semibold bg-stone-200 text-stone-800 rounded-xl hover:bg-stone-300"
                >
                  📤 共有
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
