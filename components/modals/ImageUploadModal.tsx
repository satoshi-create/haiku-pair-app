import type { ImageSuggestions } from '@/lib/types';

interface ImageUploadModalProps {
  show: boolean;
  isAnalyzing: boolean;
  suggestions: ImageSuggestions | null;
  onFileSelect: (file: File) => void;
  onSelectKigo: (kigo: string, season: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function ImageUploadModal({
  show,
  isAnalyzing,
  suggestions,
  onFileSelect,
  onSelectKigo,
  onReset,
  onClose,
}: ImageUploadModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-800">📷 写真から季語を探す</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl"
          >
            ✕
          </button>
        </div>

        {!suggestions ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
              <p className="text-stone-500 mb-4">写真をアップロードしてください</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onFileSelect(file);
                  }
                }}
                className="w-full"
              />
            </div>

            {isAnalyzing && (
              <div className="text-center py-4">
                <div className="text-stone-400 animate-pulse">写真を分析しています...</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 slide-in">
            <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
              <p className="text-sm font-bold text-stone-600 mb-2">情景：</p>
              <p className="text-stone-700 text-sm">{suggestions.scene_description}</p>
            </div>

            <div>
              <p className="text-sm font-bold text-stone-600 mb-2">
                提案された季語（{suggestions.season}）：
              </p>
              <div className="grid grid-cols-3 gap-2">
                {suggestions.kigo_suggestions.map((k, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectKigo(k, suggestions.season)}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors text-sm font-bold"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-stone-600 mb-2">俳句のヒント：</p>
              <ul className="space-y-1">
                {suggestions.haiku_hints.map((hint, i) => (
                  <li key={i} className="text-stone-700 text-sm pl-4 border-l-2 border-stone-300">
                    {hint}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={onReset}
              className="w-full text-sm text-stone-600 hover:text-stone-800"
            >
              別の写真を試す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
