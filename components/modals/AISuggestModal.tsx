interface AISuggestModalProps {
  show: boolean;
  isGenerating: boolean;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

export default function AISuggestModal({
  show,
  isGenerating,
  suggestions,
  onSelect,
  onClose,
}: AISuggestModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-800">💡 AI句提案</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl"
          >
            ✕
          </button>
        </div>

        {isGenerating ? (
          <div className="text-center py-8">
            <div className="text-stone-400 animate-pulse">句を考えています...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSelect(suggestion)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-lg text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
              >
                <p className="text-stone-800 whitespace-pre-wrap">{suggestion}</p>
              </button>
            ))}
            <p className="text-xs text-stone-500 text-center mt-4">
              提案をタップすると作句エリアに反映されます。
              <br />
              自由に編集してお使いください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
