interface HaigaModalProps {
  show: boolean;
  isGenerating: boolean;
  haiku: string;
  description: string;
  onClose: () => void;
}

export default function HaigaModal({
  show,
  isGenerating,
  haiku,
  description,
  onClose,
}: HaigaModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-800">🎨 俳画</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="bg-stone-50 p-4 rounded-lg mb-4 border border-stone-200">
          <p className="text-stone-800 whitespace-pre-wrap text-center">{haiku}</p>
        </div>

        {isGenerating ? (
          <div className="text-center py-8">
            <div className="text-stone-400 animate-pulse">俳画の情景を生成中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-stone-100 to-amber-50 p-6 rounded-lg border border-stone-200">
              <p className="text-sm font-bold text-stone-600 mb-2">情景描写：</p>
              <p className="text-stone-700 leading-relaxed">{description}</p>
            </div>
            <p className="text-xs text-stone-500 text-center">
              この情景をもとに、墨絵やイラストで俳画を描いてみてください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
