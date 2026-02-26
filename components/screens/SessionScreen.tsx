import { useState } from 'react';
import MoraCounter from '@/components/shared/MoraCounter';
import KigoDictScreen from '@/components/screens/KigoDictScreen';

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
}: SessionScreenProps) {
  const [showKigoDict, setShowKigoDict] = useState(false);

  const stepLabel = (step: 1 | 2 | 3 | 4 | 5) => {
    if (step === 1 && role === 'guest') return 'ホストのお題を待つ';
    switch (step) {
      case 1:
        return '写真を撮る';
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
    // 共通のヒントカード（Step1/2/3 で利用）
    const hintsBlock = imageSuggestions && (
      <div className="mb-6 bg-stone-50 border border-stone-200 rounded-xl p-5">
        <p className="text-xl font-semibold text-stone-800 mb-2">作句のヒント</p>
        <p className="text-base text-stone-700 mb-3">{imageSuggestions.scene_description}</p>
        <div className="mb-3">
          <p className="text-base font-semibold text-stone-700 mb-1">
            提案された季語（{imageSuggestions.season}）：
          </p>
          <div className="flex flex-wrap gap-2">
            {imageSuggestions.kigo_suggestions.map((k, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-base"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-base font-semibold text-stone-700 mb-1">AIからの視点：</p>
          <ul className="list-disc pl-6 space-y-1">
            {imageSuggestions.haiku_hints.map((h, idx) => (
              <li key={idx} className="text-base text-stone-700">
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

    switch (activeStep) {
      case 1:
        if (role === 'guest') {
          return (
            <div className="space-y-6">
              <div className="bg-white/80 rounded-2xl p-8 border border-stone-200">
                {!kigo || !kigo.trim() ? (
                  <>
                    <p className="text-2xl font-semibold text-stone-800 mb-3 text-center">
                      お題が決まるまでお待ちください
                    </p>
                    <p className="text-xl text-stone-600 text-center mb-2">ホストがお題を探しています…</p>
                    <p className="text-lg text-stone-500 text-center">しばらくお待ちください。</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold text-stone-800 mb-2 text-center">今日のお題</p>
                    <p className="text-3xl font-bold text-stone-800 mb-1 text-center">{kigo}</p>
                    <p className="text-xl text-stone-500 text-center">（{season}）</p>
                  </>
                )}
              </div>
              {kigo && kigo.trim() && (
                <button
                  type="button"
                  onClick={() => onStepChange(2)}
                  className="w-full bg-stone-800 text-white text-2xl py-4 rounded-2xl hover:bg-stone-700"
                >
                  次へ
                </button>
              )}
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="bg-white/80 rounded-2xl p-6 border border-stone-200">
              {!imageSuggestions ? (
                <>
                  <label
                    htmlFor="haiku-image-input"
                    className={`block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
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
                        <p className="text-4xl mb-2">🔍</p>
                        <p className="text-xl text-stone-500">写真を分析しています…</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-5xl mb-3">📸</p>
                        <p className="text-2xl font-semibold text-stone-800 mb-1">写真から季語を見つける</p>
                        <p className="text-lg text-stone-500">ここを押して写真を選んでください</p>
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
                      className="text-xl text-stone-500 hover:text-stone-700 underline underline-offset-2"
                    >
                      写真がない場合は 季語辞典から選ぶ
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl text-stone-700 mb-4">写真からこんな季語が提案されました。</p>
                  <p className="text-lg text-stone-700 mb-4">{imageSuggestions.scene_description}</p>
                  <p className="text-xl font-semibold text-stone-800 mb-3">
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
                        className="px-5 py-3 rounded-xl bg-amber-100 text-amber-800 text-xl font-semibold hover:bg-amber-200 border border-amber-200"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <ul className="list-disc pl-6 space-y-1 text-lg text-stone-700 mt-4">
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
                      className="w-full py-3 rounded-xl border border-stone-300 text-stone-600 text-xl hover:bg-stone-50 hover:text-stone-800"
                    >
                      気に入った季語がない場合は 季語辞典から探す
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={!kigo || imageAnalyzing}
              onClick={() => onStepChange(2)}
              className="w-full bg-stone-800 text-white text-2xl py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              句を詠むへ進む
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {hintsBlock}

            <div className="bg-white/80 rounded-2xl p-6 border border-stone-200">
              <p className="text-xl text-stone-700 mb-3">あなたの句</p>
              <textarea
                value={myHaiku}
                onChange={(e) => {
                  onMyHaikuChange(e.target.value);
                  onSetSubmitted(false);
                }}
                placeholder={'思いついた言葉から、気楽に書きはじめてみましょう。'}
                className="w-full p-4 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-[120px] text-xl text-stone-800"
              />
              {myHaiku && (
                <div className="mt-4">
                  <MoraCounter text={myHaiku} />
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!myHaiku.trim()}
              onClick={() => onStepChange(3)}
              className="w-full bg-stone-800 text-white text-2xl py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              AIに相談する前へ
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-white/80 rounded-2xl p-6 border border-stone-200">
              <p className="text-xl font-semibold text-stone-800 mb-3">今の句を、もう一息よくしましょう。</p>
              <p className="text-base text-stone-700 mb-4">
                言い換えの案や、ことばの並べ方をAIに一度たずねてみることができます。
              </p>

              <div className="mb-4 bg-stone-50 border border-stone-200 rounded-xl p-4">
                <p className="text-base text-stone-600 mb-2">いまの句</p>
                <p className="text-xl text-stone-800 whitespace-pre-wrap">{myHaiku || 'まだ句が書かれていません。'}</p>
              </div>

              <button
                type="button"
                disabled={!myHaiku.trim()}
                onClick={() => onGenerateAISuggestions(myHaiku, kigo)}
                className="w-full bg-amber-600 text-white text-2xl py-4 rounded-2xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                AIに相談する
              </button>

              <button
                type="button"
                onClick={() => onStepChange(4)}
                className="mt-4 w-full text-base text-stone-600 hover:text-stone-800"
              >
                AIは使わず、そのまま進む
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-white/80 rounded-2xl p-6 border border-stone-200">
              <p className="text-xl text-stone-700 mb-3">この句でよろしければ、みんなに送信します。</p>
              <div className="bg-stone-50 rounded-xl p-6 border border-stone-200">
                <p className="text-2xl text-stone-800 leading-relaxed whitespace-pre-wrap">
                  {myHaiku || 'まだ句が書かれていません。'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!myHaiku.trim()}
              onClick={() => {
                onSubmitHaiku();
                onStepChange(5);
              }}
              className="w-full bg-stone-800 text-white text-2xl py-4 rounded-2xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              この句をみんなに送る
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-white/80 rounded-2xl p-6 border border-stone-200">
              <p className="text-xl text-stone-700 mb-4">二人の句を、ならべて味わいましょう。</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                  <p className="text-base text-stone-500 mb-2">あなたの句</p>
                  <p className="text-2xl text-stone-800 whitespace-pre-wrap">{myHaiku}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                  <p className="text-base text-stone-500 mb-2">相手の句</p>
                  <p className="text-2xl text-stone-800 whitespace-pre-wrap">
                    {showPartner || partnerHaiku ? partnerHaiku || 'まだ届いていません。' : '「相手の句を読み込む」を押してください。'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onCheckPartner}
              className="w-full bg-stone-800 text-white text-2xl py-4 rounded-2xl hover:bg-stone-700"
            >
              相手の句を読み込む
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="w-full text-xl text-stone-600 hover:text-stone-800"
            >
              座を終えてホームに戻る
            </button>
          </div>
        );
    }
  };

  return (
    <div className="relative space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-lg border border-stone-200">
        {/* ヘッダー：Step 1 ではお題を表示しない。Step 2 以降で kigo が決まっているときだけ表示 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-base text-stone-600 mb-1">
              {role === 'host' ? '主' : '客'}：{userName}
            </p>
            {activeStep !== 1 && kigo && kigo.trim() ? (
              <>
                <p className="text-3xl font-bold text-stone-800 mb-1">{kigo}</p>
                <p className="text-base text-stone-500">（{season}）</p>
              </>
            ) : (
              <p className="text-xl text-stone-600">
                {activeStep === 1
                  ? role === 'guest'
                    ? 'お題が決まるまでお待ちください'
                    : 'お題を決めましょう'
                  : 'お題が決まるまでお待ちください'}
              </p>
            )}
            <p className="mt-2 text-base text-stone-500">セッションID：{sessionId}</p>
          </div>
          {activeStep !== 1 && kigo && (
            <button
              type="button"
              onClick={() => setShowKigoDict(true)}
              className="flex items-center gap-2 text-xl bg-green-100 text-green-800 px-5 py-3 rounded-xl hover:bg-green-200 font-semibold"
            >
              <span aria-hidden>📖</span>
              <span>季語辞典</span>
            </button>
          )}
        </div>

        {/* ステップインジケータ */}
        <div className="mb-6">
          <p className="text-xl font-semibold text-stone-800 mb-2">
            Step {activeStep} / 5 ：{stepLabel(activeStep)}
          </p>
          <div className="flex gap-2">
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

        {/* ステップごとの内容 */}
        {renderStepContent()}
      </div>

      {/* 季語辞典オーバーレイ */}
      {showKigoDict && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-40">
          <div className="max-w-2xl w-full">
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
    </div>
  );
}
