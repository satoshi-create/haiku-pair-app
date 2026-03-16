import { createPortal } from 'react-dom';
import FamilyGallery from '@/components/FamilyGallery';
import HandwritingCanvas from '@/components/HandwritingCanvas';
import {
  getCloudinaryUrl,
  CLOUDINARY_THUMB_WIDTH,
  CLOUDINARY_ZOOM_WIDTH,
} from '@/lib/cloudinary';
import HelpWizardModal from '@/components/modals/HelpWizardModal';
import { HelpCircle } from 'lucide-react';
import KigoDictScreen from '@/components/screens/KigoDictScreen';
import MoraCounter from '@/components/shared/MoraCounter';
import { useEffect, useState } from 'react';

/** ご家族の句（母_俳句.csv より）。Step 2 で背景のささやきとして表示 */
const SAMPLE_FAMILY_HAIKU = '苗床に　朝の陽集め　露の網';

interface SessionScreenProps {
  sessionId: string;
  role: string;
  userName: string;
  kigo: string;
  season: string;
  myHaiku: string;
  onMyHaikuChange: (haiku: string) => void;
  onSubmitHaiku: () => void;
  onCheckPartner: () => void;
  partnerHaiku: string;
  showPartner: boolean;
  onClosePartner: () => void;
  submitted: boolean;
  onSetSubmitted: (val: boolean) => void;
  onOpenShareCard: (haiku: string, kigo: string, season: string, author: string) => void;
  onGenerateHaiga: (haiku: string, kigo: string) => void;
  onSaveToHistory: (haiku: string, kigo: string, season: string, author: string) => void;
  onGoHome: () => void;
  onGoKigoDict: () => void;
  // AI提案
  userIdea: string;
  onUserIdeaChange: (idea: string) => void;
  onGenerateAISuggestions: (idea: string, kigo: string) => void;
  // 投票（現時点では UI には出さず props だけ受ける）
  onSubmitVote: (vote: string) => void;
  onCheckPartnerVote: () => void;
  myVote: string | null;
  partnerVote: string | null;
  showVoteResult: boolean;
  hasVoted: boolean;
  // 5ステップウィザード
  activeStep: 1 | 2 | 3 | 4 | 5;
  onStepChange: (step: 1 | 2 | 3 | 4 | 5) => void;
  // 画像解析
  imageAnalyzing: boolean;
  imageSuggestions: {
    season: string;
    kigo_suggestions: string[];
    scene_description: string;
    haiku_hints: string[];
  } | null;
  onImageFileSelect: (file: File) => void;
  onResetImageSuggestions: () => void;
  onConfirmKigoFromPhoto: (kigo: string, season: string) => void;
  onSelectKigoFromDict: (kigo: string, season: string) => void;
  hostViewingKigoDict?: boolean;
  onKigoDictOpenChange?: (open: boolean) => void;
  hasAiSuggestions?: boolean;
  /** AI句提案の生成中。この間は「AIからの提案（参考）」を非表示にする */
  isGeneratingSuggestions?: boolean;
  /** 共有された写真（data URL）。参照パネルで表示 */
  sharedImageDataUrl?: string | null;
  /** Step 3 でAI相談した提案一覧。参考として画面上に残す */
  aiSuggestions?: string[];
  /** 確定済みユーザーID。未確定時は投稿ボタンを無効化 */
  userId?: string | null;
  /** 俳句投稿中（画像アップロード・DB保存）。保存中...を表示 */
  isSubmittingHaiku?: boolean;
  /** 連投防止クールダウン中 */
  isCoolingDown?: boolean;
  /** クールダウン残り秒数（次の投稿まであと◯秒） */
  coolDownSecondsRemaining?: number;
  /** AI相談の残り回数（0で制限到達） */
  aiSuggestionRemaining?: number;
  /** 手書き完了時コールバック（画像 data URL → OCR 後に myHaiku 設定・Step 3 へ） */
  onHandwritingComplete?: (dataUrl: string) => Promise<void>;
  /** 手書き OCR 読み取り中（ローディング表示用） */
  isHandwritingOcrLoading?: boolean;
}

export default function SessionScreen({
  sessionId,
  role,
  userName,
  kigo,
  season,
  myHaiku,
  onMyHaikuChange,
  onSubmitHaiku,
  onCheckPartner,
  partnerHaiku,
  showPartner,
  onClosePartner,
  submitted,
  onSetSubmitted,
  onOpenShareCard,
  onGenerateHaiga,
  onSaveToHistory,
  onGoHome,
  onGoKigoDict,
  userIdea,
  onUserIdeaChange,
  onGenerateAISuggestions,
  onSubmitVote,
  onCheckPartnerVote,
  myVote,
  partnerVote,
  showVoteResult,
  hasVoted,
  activeStep,
  onStepChange,
  imageAnalyzing,
  imageSuggestions,
  onImageFileSelect,
  onResetImageSuggestions,
  onConfirmKigoFromPhoto,
  onSelectKigoFromDict,
  hostViewingKigoDict = false,
  onKigoDictOpenChange,
  hasAiSuggestions = false,
  isGeneratingSuggestions = false,
  sharedImageDataUrl = null,
  aiSuggestions = [],
  userId = null,
  isSubmittingHaiku = false,
  isCoolingDown = false,
  coolDownSecondsRemaining = 0,
  aiSuggestionRemaining,
  onHandwritingComplete,
  isHandwritingOcrLoading = false,
}: SessionScreenProps) {
  const [showKigoDict, setShowKigoDict] = useState(false);
  const [showFamilyGallery, setShowFamilyGallery] = useState(false);
  const [showEnlargedPhoto, setShowEnlargedPhoto] = useState(false);
  const [showHelpWizard, setShowHelpWizard] = useState(false);
  /** Step 2: デジタル半紙（手書きエリア）を表示するか */
  const [showHandwritingCanvas, setShowHandwritingCanvas] = useState(false);
  /** Step 3: AI提案アコーディオンの開閉（デフォルトは閉じた状態） */
  const [aiSuggestionsOpen, setAiSuggestionsOpen] = useState(false);

  /** 新しいAI提案が来たらアコーディオンを閉じる */
  useEffect(() => {
    if (hasAiSuggestions && aiSuggestions.length > 0) {
      setAiSuggestionsOpen(false);
    }
  }, [aiSuggestions, hasAiSuggestions]);

  const stepLabel = (step: 1 | 2 | 3 | 4 | 5) => {
    if (step === 1 && role === 'guest') return 'ホストのお題を待つ';
    switch (step) {
      case 1:
        return '写真からお題を決める';
      case 2:
        return '句を詠む';
      case 3:
        return 'AIに相談';
      case 4:
        return '提出する';
      case 5:
        return '披講（鑑賞）';
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        if (role === 'guest') {
          return (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/80 rounded-2xl p-4 sm:p-6 lg:p-8 border border-stone-200">
                {!kigo || !kigo.trim() ? (
                  <>
                    <p className="text-xl sm:text-2xl font-semibold text-stone-800 mb-2 text-center">ホストがお題を探しています…</p>
                    <p className="text-lg sm:text-xl text-stone-600 text-center">しばらくお待ちください。</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg sm:text-xl font-semibold text-stone-800 mb-2 text-center">今日のお題</p>
                    <p className="text-2xl sm:text-3xl font-bold text-stone-800 mb-1 text-center">{kigo}</p>
                    <p className="text-lg sm:text-xl text-stone-500 text-center">（{season}）</p>
                  </>
                )}
              </div>
              {kigo && kigo.trim() && (
                <button
                  type="button"
                  onClick={() => onStepChange(2)}
                  className="w-full bg-stone-800 text-white text-xl sm:text-2xl py-3 sm:py-4 rounded-2xl hover:bg-stone-700"
                >
                  次へ
                </button>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 rounded-2xl p-4 sm:p-6 border border-stone-200">
              {!imageSuggestions ? (
                <>
                  <label
                    htmlFor="haiku-image-input"
                    className={`block border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-colors ${
                      imageAnalyzing
                        ? 'border-stone-200 bg-stone-50'
                        : 'border-stone-400 hover:border-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <input
                      id="haiku-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onResetImageSuggestions();
                          onImageFileSelect(file);
                        }
                      }}
                    />
                    {imageAnalyzing ? (
                      <div>
                        <p className="text-3xl sm:text-4xl mb-2">🔍</p>
                        <p className="text-lg sm:text-xl text-stone-500">写真を分析しています…</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-4xl sm:text-5xl mb-2 sm:mb-3">📸</p>
                        <p className="text-xl sm:text-2xl font-semibold text-stone-800 mb-1">写真から季語を見つける</p>
                        <p className="text-base sm:text-lg text-stone-500">ここを押して写真を選んでください</p>
                      </div>
                    )}
                  </label>
                  <p className="text-center mt-5">
                    <button
                      type="button"
                      onClick={() => {
                        onKigoDictOpenChange?.(true);
                        setShowKigoDict(true);
                      }}
                      className="text-base sm:text-xl text-stone-500 hover:text-stone-700 underline underline-offset-2"
                    >
                      写真がない場合は 季語辞典から選ぶ
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg sm:text-xl text-stone-700 mb-3 sm:mb-4">写真からこんな季語が提案されました。</p>
                  <p className="text-base sm:text-lg text-stone-700 mb-3 sm:mb-4">{imageSuggestions.scene_description}</p>
                  <p className="text-lg sm:text-xl font-semibold text-stone-800 mb-2 sm:mb-3">
                    提案された季語（{imageSuggestions.season}）からお題を選ぶ：
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {imageSuggestions.kigo_suggestions.map((k, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          onConfirmKigoFromPhoto(k, imageSuggestions.season);
                          onStepChange(2);
                        }}
                        className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-amber-100 text-amber-800 text-base sm:text-xl font-semibold hover:bg-amber-200 border border-amber-200"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <ul className="list-disc pl-5 sm:pl-6 space-y-1 text-base sm:text-lg text-stone-700 mt-3 sm:mt-4">
                    {imageSuggestions.haiku_hints.map((h, idx) => (
                      <li key={idx}>{h}</li>
                    ))}
                  </ul>
                  <div className="mt-8 pt-6 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => {
                        onKigoDictOpenChange?.(true);
                        setShowKigoDict(true);
                      }}
                      className="w-full py-3 rounded-xl border border-stone-300 text-stone-600 text-base sm:text-xl hover:bg-stone-50 hover:text-stone-800"
                    >
                      気に入った季語がない場合は 季語辞典から探す
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <>
            {/* 手書きキャンバス（Portal で body に描画し、親の max-width 制約を完全回避） */}
            {showHandwritingCanvas &&
              typeof document !== 'undefined' &&
              createPortal(
                <HandwritingCanvas
                  kigo={kigo ?? ''}
                  onClose={() => setShowHandwritingCanvas(false)}
                  onComplete={async (dataUrl) => {
                    setShowHandwritingCanvas(false);
                    await onHandwritingComplete?.(dataUrl);
                  }}
                  nudgeHints={[
                    kigo?.trim()
                      ? `お父さん、『${kigo}』の俳句を書いてみようか`
                      : 'お父さん、今の季節の言葉を書いてみようか',
                    'ゆっくり、指でなぞってみてね',
                    '思いついた言葉を、そのまま書いてみましょう',
                  ]}
                  hintBanner={
                    imageSuggestions
                      ? {
                          sceneDescription: imageSuggestions.scene_description,
                          haikuHints: imageSuggestions.haiku_hints,
                        }
                      : null
                  }
                  aiSuggestions={aiSuggestions}
                  sharedImageDataUrl={sharedImageDataUrl}
                  onRequestEnlargedPhoto={() => setShowEnlargedPhoto(true)}
                />,
                document.body
              )}

            {/* OCR 読み取り中オーバーレイ */}
            {isHandwritingOcrLoading && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/90">
                <p className="text-xl sm:text-2xl text-stone-600 animate-pulse">
                  手書きを読み取っています…
                </p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div className="bg-white/80 rounded-2xl p-4 sm:p-5 lg:p-6 border border-stone-200">
                <p className="text-base sm:text-lg text-stone-800 font-semibold mb-2 sm:mb-3">あなたの句</p>
                <p className="text-sm text-stone-400 mb-2" aria-hidden>
                  （ご家族の句より：{SAMPLE_FAMILY_HAIKU.replace(/　/g, ' ')}）
                </p>
                <textarea
                  value={myHaiku ?? ''}
                  onChange={(e) => {
                    onMyHaikuChange(e.target.value);
                    onSetSubmitted(false);
                  }}
                  placeholder={'思いついた言葉から、気楽に書きはじめてみましょう。'}
                  className="w-full p-4 sm:p-5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[100px] text-lg sm:text-xl text-stone-900 placeholder:text-stone-500 scroll-mt-24"
                />
                {myHaiku && (
                  <div className="mt-3">
                    <MoraCounter text={myHaiku} />
                  </div>
                )}

                {/* 手書きモード切り替えボタン */}
                <div className="mt-4 pt-4 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setShowHandwritingCanvas(true)}
                    className="w-full py-3 rounded-xl border-2 border-stone-400 text-stone-700 text-lg font-semibold hover:bg-stone-50 hover:border-stone-600 transition-colors touch-manipulation"
                  >
                    ✍️ 指で書く（デジタル半紙）
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={!myHaiku.trim()}
                onClick={() => onStepChange(3)}
                className="w-full bg-stone-800 text-white text-lg sm:text-xl py-3 sm:py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                AIに相談する前へ
              </button>
            </div>
          </>
        );

      case 3:
        return (
          <div className="space-y-5 sm:space-y-6">
            <div className="bg-white/80 rounded-2xl p-5 sm:p-6 lg:p-8 border border-stone-200">
              <p className="text-base sm:text-lg font-semibold text-stone-800 mb-2 sm:mb-3">今の句を、もう一息よくしましょう。</p>
              <p className="text-sm sm:text-base text-stone-700 mb-4 sm:mb-5">
                言い換えの案や、ことばの並べ方をAIにたずねてみることができます。
              </p>

              <div className="mb-5 sm:mb-6">
                <p className="text-sm sm:text-base text-stone-700 mb-2 sm:mb-3">いまの句（編集できます）</p>
                <textarea
                  value={myHaiku ?? ''}
                  onChange={(e) => {
                    onMyHaikuChange(e.target.value);
                    onSetSubmitted(false);
                  }}
                  placeholder="句を入力してください"
                  readOnly={false}
                  autoComplete="off"
                  className="w-full p-4 sm:p-5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[80px] text-lg sm:text-xl text-stone-900 placeholder:text-stone-500 scroll-mt-24"
                />
              </div>

              {hasAiSuggestions && aiSuggestions.length > 0 && !isGeneratingSuggestions && (
                <div className="mb-5 sm:mb-6 rounded-xl border border-amber-200 overflow-hidden bg-amber-50/80">
                  <button
                    type="button"
                    onClick={() => setAiSuggestionsOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-3 p-3 sm:p-4 text-left hover:bg-amber-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset"
                    aria-expanded={aiSuggestionsOpen}
                  >
                    <span className="text-sm sm:text-base font-semibold text-stone-800">
                      AIからの提案（参考）　{aiSuggestionsOpen ? 'クリックで閉じる' : 'クリックで開く'}
                    </span>
                    <span className="shrink-0 text-lg text-amber-700" aria-hidden>
                      {aiSuggestionsOpen ? '△' : '▽'}
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${aiSuggestionsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="max-h-[40dvh] overflow-y-auto p-3 sm:p-4 pt-0 border-t border-amber-200/80">
                        <ul className="space-y-2 sm:space-y-3">
                          {aiSuggestions.map((s, idx) => (
                            <li key={idx} className="text-base sm:text-lg text-stone-700 pl-3 border-l-2 border-amber-300">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {typeof aiSuggestionRemaining === 'number' && (
                  <p className="text-sm text-stone-600">
                    残り相談回数：{aiSuggestionRemaining}回
                  </p>
                )}
                <button
                  type="button"
                  disabled={!myHaiku.trim() || (typeof aiSuggestionRemaining === 'number' && aiSuggestionRemaining <= 0)}
                  onClick={() => onGenerateAISuggestions(myHaiku, kigo)}
                  className="w-full bg-amber-600 text-white text-lg sm:text-xl py-3.5 sm:py-4 rounded-2xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasAiSuggestions ? '別の提案をみる' : 'AIに相談する'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => onStepChange(4)}
                className="mt-5 w-full text-base sm:text-lg text-stone-600 hover:text-stone-800 py-3 sm:py-3.5"
              >
                {hasAiSuggestions ? 'このヒントをもとに直す' : '今の提案を参考にして次へ進む'}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-5">
            <div className="bg-white/80 rounded-2xl p-4 sm:p-5 lg:p-6 border border-stone-200">
              <p className="text-base sm:text-lg text-stone-700 mb-2 sm:mb-3">この句でよろしければ、みんなに送信します。必要なら訂正できます。</p>
              <textarea
                value={myHaiku ?? ''}
                onChange={(e) => {
                  onMyHaikuChange(e.target.value);
                  onSetSubmitted(false);
                }}
                placeholder="句を入力してください"
                className="w-full p-4 sm:p-5 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[100px] text-lg sm:text-xl text-stone-900 placeholder:text-stone-500"
              />

            </div>

            <button
              type="button"
              disabled={!myHaiku.trim() || !userId || isSubmittingHaiku || isCoolingDown}
              onClick={() => {
                onSubmitHaiku();
                onStepChange(5);
              }}
              className="w-full bg-stone-800 text-white text-lg sm:text-xl py-3 sm:py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingHaiku
                ? "保存中..."
                : isCoolingDown
                  ? coolDownSecondsRemaining > 0
                    ? `次の投稿まであと${coolDownSecondsRemaining}秒`
                    : "少し待ってね..."
                  : "この句をみんなに送る"}
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 rounded-2xl p-4 sm:p-6 border border-stone-200">
              <p className="text-lg sm:text-xl text-stone-700 mb-3 sm:mb-4">二人の句を、ならべて味わいましょう。</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-stone-50 rounded-xl p-4 sm:p-5 border border-stone-200">
                  <p className="text-sm sm:text-base text-stone-500 mb-2">あなたの句</p>
                  <p className="text-xl sm:text-2xl text-stone-800 whitespace-pre-wrap">{myHaiku}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 sm:p-5 border border-stone-200">
                  <p className="text-sm sm:text-base text-stone-500 mb-2">相手の句</p>
                  <p className="text-xl sm:text-2xl text-stone-800 whitespace-pre-wrap">
                    {showPartner || partnerHaiku ? partnerHaiku || 'まだ届いていません。' : '「相手の句を読み込む」を押してください。'}
                  </p>
                </div>
              </div>
            </div>

            {myHaiku.trim() && (
              <button
                type="button"
                onClick={() => onGenerateHaiga(myHaiku, kigo)}
                className="w-full bg-amber-500 text-white text-xl sm:text-2xl py-3 sm:py-4 rounded-2xl hover:bg-amber-600 font-semibold"
              >
                🎨 この句で俳画（絵）を作る
              </button>
            )}

            <button
              type="button"
              onClick={onCheckPartner}
              className="w-full bg-stone-800 text-white text-xl sm:text-2xl py-3 sm:py-4 rounded-2xl hover:bg-stone-700"
            >
              相手の句を読み込む
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="w-full text-lg sm:text-xl text-stone-600 hover:text-stone-800 py-2"
            >
              座を終えてホームに戻る
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-stone-200 overflow-hidden flex flex-col">
        {/* ヘッダー：お題 と 季語辞典（sticky） */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-stone-200/80 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 [touch-action:pan-y]">
          <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm sm:text-base text-stone-600 mb-1">
              {role === 'host' ? '主' : '客'}：{userName}
            </p>
            {activeStep !== 1 && kigo && kigo.trim() ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-stone-800 mb-1">{kigo}</p>
                <p className="text-sm sm:text-base text-stone-500">（{season}）</p>
              </>
            ) : activeStep !== 1 ? (
              <p className="text-lg sm:text-xl text-stone-600">お題が決まるまでお待ちください</p>
            ) : null}
            <p className="mt-2 text-xs sm:text-sm text-stone-500">セッションID：{sessionId}</p>
          </div>
          {activeStep !== 1 && kigo && (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFamilyGallery(true)}
                className="flex items-center gap-2 text-base sm:text-lg lg:text-xl bg-amber-50 text-amber-900 border border-amber-200 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl hover:bg-amber-100 font-semibold"
              >
                <span aria-hidden>📒</span>
                <span>家族の句</span>
              </button>
              <button
                type="button"
                onClick={() => setShowKigoDict(true)}
                className="flex items-center gap-2 text-base sm:text-lg lg:text-xl bg-green-100 text-green-800 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl hover:bg-green-200 font-semibold"
              >
                <span aria-hidden>📖</span>
                <span>季語辞典</span>
              </button>
            </div>
          )}
          </div>

          {/* 共有バナー（Step 2,3,4 かつ 写真 or ヒントあり） */}
          {(activeStep === 2 || activeStep === 3 || activeStep === 4) &&
            (sharedImageDataUrl || imageSuggestions) && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowEnlargedPhoto(true)}
                  className="w-full flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/90 p-2.5 sm:p-3 text-left hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  aria-label="散歩の写真とヒントを拡大表示"
                >
                  {sharedImageDataUrl && (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-lg overflow-hidden border border-stone-200 bg-stone-100">
                      <img
                        src={getCloudinaryUrl(sharedImageDataUrl, CLOUDINARY_THUMB_WIDTH)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-stone-800 mb-0.5">
                      📸 散歩の写真を見る（タップで拡大）
                    </p>
                    {imageSuggestions && (
                      <p className="text-xs sm:text-sm text-stone-700 line-clamp-2 leading-snug">
                        {imageSuggestions.scene_description}
                      </p>
                    )}
                  </div>
                </button>
              </div>
            )}

          {/* ステップインジケータ */}
          <div className="mb-0">
            <div className="inline-flex items-center gap-2 mb-2">
              <p className="text-base sm:text-lg lg:text-xl font-semibold text-stone-800">
                Step {activeStep} / 5 ：{stepLabel(activeStep)}
              </p>
              <button
                type="button"
                onClick={() => setShowHelpWizard(true)}
                className="inline-flex items-center justify-center rounded-full border border-stone-300/80 bg-white/70 text-stone-500 hover:bg-stone-700 hover:text-white transition-colors touch-manipulation shadow-sm px-2 py-1"
                aria-label="操作ガイドを開く"
              >
                <HelpCircle className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= activeStep ? 'bg-stone-800' : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ステップごとの内容（スクロール域） */}
        <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10 pt-5 sm:pt-6 flex-1">
          {renderStepContent()}
        </div>
      </div>

      {/* 拡大表示モーダル：写真＋ヒント全文 */}
      {showEnlargedPhoto && (sharedImageDataUrl || imageSuggestions) && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-40"
          onClick={() => setShowEnlargedPhoto(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setShowEnlargedPhoto(false)}
          aria-label="閉じる"
        >
          <div
            className="w-[95vw] max-w-[1200px] max-h-[90dvh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sharedImageDataUrl && (
              <div className="p-3 border-b border-stone-200">
                <img
                  src={getCloudinaryUrl(sharedImageDataUrl, CLOUDINARY_ZOOM_WIDTH)}
                  alt="お題の写真"
                  loading="lazy"
                  className="w-full max-h-[50vh] object-contain rounded-lg"
                />
              </div>
            )}
            {imageSuggestions && (
              <div className="p-4 text-stone-800">
                <p className="text-lg font-semibold mb-2">作句のヒント</p>
                <p className="text-base text-stone-700 mb-3">{imageSuggestions.scene_description}</p>
                {imageSuggestions.haiku_hints.length > 0 && (
                  <>
                    <p className="text-sm font-semibold text-stone-700 mb-1">AIからの視点</p>
                    <ul className="list-disc pl-5 space-y-1 text-base text-stone-700">
                      {imageSuggestions.haiku_hints.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            <div className="p-4 pt-0">
              <button
                type="button"
                onClick={() => setShowEnlargedPhoto(false)}
                className="w-full py-4 text-xl font-bold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 季語辞典オーバーレイ */}
      {showKigoDict && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40"
          onClick={() => {
            onKigoDictOpenChange?.(false);
            setShowKigoDict(false);
          }}
        >
          <div
            className="w-[95vw] max-w-[1200px] max-h-[90dvh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <KigoDictScreen
              onClose={() => {
                onKigoDictOpenChange?.(false);
                setShowKigoDict(false);
              }}
              onSelectKigo={(kigoVal, seasonVal) => {
                onKigoDictOpenChange?.(false);
                onSelectKigoFromDict(kigoVal, seasonVal);
                setShowKigoDict(false);
                onStepChange(2);
              }}
            />
          </div>
        </div>
      )}

      {/* 家族の句ギャラリーオーバーレイ */}
      {showFamilyGallery && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-40"
          onClick={() => setShowFamilyGallery(false)}
        >
          <div
            className="w-[95vw] max-w-[1200px] max-h-[90dvh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <FamilyGallery onClose={() => setShowFamilyGallery(false)} />
          </div>
        </div>
      )}

      {/* 操作ガイドモーダル */}
      <HelpWizardModal
        show={showHelpWizard}
        onClose={() => setShowHelpWizard(false)}
        role={role === 'host' ? 'host' : 'guest'}
        variant="session"
        syncStep={activeStep}
      />
    </div>
  );
}
