interface ShareCardModalProps {
  show: boolean;
  haiku: string;
  kigo: string;
  season: string;
  author: string;
  onClose: () => void;
}

export default function ShareCardModal({
  show,
  haiku,
  kigo,
  season,
  author,
  onClose,
}: ShareCardModalProps) {
  if (!show) return null;

  const copyCardText = () => {
    const text = `${haiku}\n\n季語：${kigo}（${season}）${author ? `\n詠み人：${author}` : ''}\n\n#俳句 #AI句会 #${kigo}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => alert('テキストをクリップボードにコピーしました！'))
        .catch(() => alert('コピーに失敗しました'));
    } else {
      alert('この環境ではクリップボードを使用できません');
    }
  };

  const downloadCard = () => {
    alert(
      '実装時には、このカードをPNG/JPG画像として保存できます。\n\nhtml2canvas や dom-to-image などのライブラリを使用して実装します。'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-800">📤 共有カード</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* カードプレビュー */}
        <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-8 rounded-lg border-2 border-stone-300 mb-6">
          <div className="text-center space-y-4">
            <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap font-serif">
              {haiku}
            </p>
            <div className="text-sm text-stone-500">
              季語：{kigo}（{season}）
            </div>
            {author && (
              <div className="text-sm text-stone-600">詠み人：{author}</div>
            )}
            <div className="text-xs text-stone-400">AI句会ワークショップ</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={copyCardText}
            className="w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            📋 テキストをコピー
          </button>
          <button
            onClick={downloadCard}
            className="w-full border border-stone-300 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-50 transition-colors"
          >
            💾 画像として保存（準備中）
          </button>
        </div>
      </div>
    </div>
  );
}
