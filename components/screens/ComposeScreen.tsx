import type { ImageSuggestions } from '@/lib/types';
import MoraCounter from '@/components/shared/MoraCounter';

interface ComposeScreenProps {
  kigo: string;
  season: string;
  /** URL.createObjectURL で生成した写真プレビュー URL。未撮影時は null */
  imagePreviewUrl: string | null;
  /** 写真AI分析中フラグ */
  isAnalyzing: boolean;
  /** 写真をファイル選択したときのコールバック */
  onFileSelect: (file: File) => void;
  /** 写真AI分析結果。写真なし or 未分析時は null */
  imageSuggestions: ImageSuggestions | null;
  myHaiku: string;
  onMyHaikuChange: (haiku: string) => void;
  onSubmitHaiku: () => void;
  submitted: boolean;
  userIdea: string;
  onUserIdeaChange: (idea: string) => void;
  onGenerateAISuggestions: (idea: string, kigo: string) => void;
  aiSuggestions: string[];
  isGeneratingSuggestions: boolean;
  onGoHome: () => void;
}

export default function ComposeScreen({
  kigo,
  season,
  imagePreviewUrl,
  isAnalyzing,
  onFileSelect,
  imageSuggestions,
  myHaiku,
  onMyHaikuChange,
  onSubmitHaiku,
  submitted,
  userIdea,
  onUserIdeaChange,
  onGenerateAISuggestions,
  aiSuggestions,
  isGeneratingSuggestions,
  onGoHome,
}: ComposeScreenProps) {
  return (
    <div className="bg-white/80 backdrop-blur shadow-lg border border-stone-200 rounded-lg p-6 space-y-6">

      {/* 季語ヘッダー */}
      <div className="text-center pb-4 border-b border-stone-200">
        <div className="text-xs text-stone-500 mb-1">今日のお題</div>
        <div className="text-4xl font-bold text-stone-800 mb-1 float">{kigo}</div>
        <div className="text-stone-500 text-sm">（{season}）</div>
      </div>

      {/* ① 写真表示エリア（常時表示） */}
      <div className="pb-6 border-b border-stone-200">
        {imagePreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreviewUrl}
            alt="俳句の題材"
            className="w-full object-cover max-h-64 rounded-lg"
          />
        ) : (
          <div className="bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg p-6 text-center space-y-3">
            {isAnalyzing ? (
              <p className="text-stone-400 animate-pulse text-sm">写真を分析しています...</p>
            ) : (
              <>
                <p className="text-stone-500 text-sm">写真をアップロードすると季語のヒントが表示されます</p>
                <label className="inline-block cursor-pointer bg-white border border-stone-300 text-stone-700 px-5 py-2 rounded-lg hover:bg-stone-50 transition-colors text-sm">
                  📷 写真を選ぶ
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onFileSelect(file);
                    }}
                  />
                </label>
              </>
            )}
          </div>
        )}
      </div>

      {/* ② AIヒントエリア（常時表示） */}
      <div className="pb-6 border-b border-stone-200 space-y-3">
        <p className="text-sm font-bold text-stone-600">AIのヒント</p>
        {isAnalyzing && (
          <p className="text-stone-400 animate-pulse text-sm">分析中...</p>
        )}
        {!isAnalyzing && imageSuggestions && (
          <>
            <p className="text-stone-700 text-sm leading-relaxed">
              {imageSuggestions.scene_description}
            </p>
            <ul className="space-y-1">
              {imageSuggestions.haiku_hints.map((hint, i) => (
                <li
                  key={i}
                  className="text-stone-600 text-sm pl-4 border-l-2 border-amber-300"
                >
                  {hint}
                </li>
              ))}
            </ul>
          </>
        )}
        {!isAnalyzing && !imageSuggestions && (
          <p className="text-stone-400 text-sm">
            写真をアップロードするとここにヒントが表示されます
          </p>
        )}
      </div>

        {/* ③ 俳句入力欄 */}
        <div className="space-y-3">
          <textarea
            value={myHaiku}
            onChange={(e) => onMyHaikuChange(e.target.value)}
            placeholder={'句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
            className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
            disabled={submitted}
          />
          {myHaiku && <MoraCounter text={myHaiku} />}
        </div>

        {/* ④ AIに提案を求める（インライン、モーダルなし） */}
        {!submitted && (
          <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-bold text-amber-800">💡 AIに提案を求める</p>
            <p className="text-xs text-amber-700">
              句のアイデアや断片を入力してください。
              <br />
              例：「川の流れが速い」「家が二軒見える」
            </p>
            <input
              type="text"
              value={userIdea}
              onChange={(e) => onUserIdeaChange(e.target.value)}
              placeholder="句のアイデアや断片を入力..."
              className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              onClick={() => onGenerateAISuggestions(userIdea, kigo)}
              disabled={!userIdea.trim() || isGeneratingSuggestions}
              className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              AIに提案を求める
            </button>

            {isGeneratingSuggestions && (
              <div className="text-center py-3 text-stone-400 animate-pulse text-sm">
                句を考えています...
              </div>
            )}

            {!isGeneratingSuggestions && aiSuggestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-amber-200">
                <p className="text-xs text-amber-700">
                  提案をタップすると入力欄に反映されます
                </p>
                {aiSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => onMyHaikuChange(suggestion)}
                    className="w-full p-3 bg-white border border-amber-200 rounded-lg text-left hover:bg-amber-50 transition-colors text-stone-800 text-sm whitespace-pre-wrap"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ⑤ この一句で送る（最下部） */}
        {!submitted ? (
          <button
            onClick={onSubmitHaiku}
            disabled={!myHaiku.trim()}
            className="w-full bg-stone-800 text-white px-6 py-4 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
          >
            この一句で送る
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg text-center font-bold">
              ✓ 句を送りました
            </div>
            <button
              onClick={onGoHome}
              className="w-full text-sm text-stone-600 hover:text-stone-800 py-2"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
  );
}
