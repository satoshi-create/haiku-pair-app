import { useState, useEffect } from 'react';
import MoraCounter from '@/components/shared/MoraCounter';

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
  // 投票
  onSubmitVote: (vote: string) => void;
  onCheckPartnerVote: () => void;
  myVote: string | null;
  partnerVote: string | null;
  showVoteResult: boolean;
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
}: SessionScreenProps) {
  // タイマー機能（セッション画面ローカル）
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning || timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setTimerRunning(false);
          if (typeof Audio !== 'undefined') {
            try {
              const audio = new Audio(
                'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTO'
              );
              audio.play();
            } catch {
              // Audio not supported
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

  const startTimer = () => {
    setTimeRemaining(timerMinutes * 60);
    setTimerRunning(true);
  };
  const stopTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeRemaining(null);
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        {/* ヘッダー */}
        <div className="text-center mb-8 pb-6 border-b border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-stone-600">
              {role === 'host' ? '主' : '客'}: {userName}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onGoKigoDict}
                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
              >
                📖 季語辞典
              </button>
              <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                ID: {sessionId}
              </span>
            </div>
          </div>
          <div className="text-sm text-stone-600 mb-2">今日のお題</div>
          <div className="text-5xl font-bold text-stone-800 mb-2 float">{kigo}</div>
          <div className="text-stone-500">（{season}）</div>

          {/* タイマー表示 */}
          {timerEnabled && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-800">⏱️ 作句時間</span>
                <div
                  className={`text-3xl font-bold ${
                    timeRemaining !== null && timeRemaining <= 60
                      ? 'text-red-600 animate-pulse'
                      : 'text-blue-800'
                  }`}
                >
                  {formatTime(timeRemaining)}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    開始
                  </button>
                ) : (
                  <button
                    onClick={stopTimer}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                  >
                    停止
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className="px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm text-blue-700"
                >
                  リセット
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 作句エリア */}
        <div className="space-y-6">
          {/* タイマー設定 */}
          {!submitted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm font-bold text-blue-800">
                  <input
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  ⏱️ タイマーを使う
                </label>
              </div>

              {timerEnabled && (
                <div className="flex items-center gap-3">
                  <label className="text-sm text-blue-700">作句時間：</label>
                  <select
                    value={timerMinutes}
                    onChange={(e) => {
                      setTimerMinutes(Number(e.target.value));
                      resetTimer();
                    }}
                    className="px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    disabled={timerRunning}
                  >
                    <option value={3}>3分</option>
                    <option value={5}>5分</option>
                    <option value={10}>10分</option>
                    <option value={15}>15分</option>
                    <option value={20}>20分</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-sm text-stone-700 mb-3">あなたの句：</p>

            {/* AI提案ボタン */}
            {!submitted && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-bold text-amber-800 mb-3">💡 AIに提案を求める</p>
                <p className="text-xs text-amber-700 mb-3">
                  まずは句のアイデアや断片を入力してください。
                  <br />
                  例：「川の流れが速い」「家が二軒見える」
                </p>
                <input
                  type="text"
                  value={userIdea}
                  onChange={(e) => onUserIdeaChange(e.target.value)}
                  placeholder="句のアイデアや断片を入力..."
                  className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
                />
                <button
                  onClick={() => onGenerateAISuggestions(userIdea, kigo)}
                  disabled={!userIdea.trim()}
                  className="w-full bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  AIに提案を求める
                </button>
              </div>
            )}

            <textarea
              value={myHaiku}
              onChange={(e) => {
                onMyHaikuChange(e.target.value);
                onSetSubmitted(false);
              }}
              placeholder={'句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
              className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
              disabled={submitted}
            />

            {/* 音数カウンター */}
            {myHaiku && (
              <div className="mt-3">
                <MoraCounter text={myHaiku} />
              </div>
            )}

            {!submitted ? (
              <button
                onClick={onSubmitHaiku}
                disabled={!myHaiku.trim()}
                className="mt-3 w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                句を提出
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg text-center">
                  ✓ 句を提出しました
                </div>
                <button
                  onClick={() => onOpenShareCard(myHaiku, kigo, season, userName)}
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  📤 共有カードを作成
                </button>
                <button
                  onClick={() => onGenerateHaiga(myHaiku, kigo)}
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🎨 俳画を添える
                </button>
                <button
                  onClick={() => {
                    onSaveToHistory(myHaiku, kigo, season, userName);
                    onSetSubmitted(false);
                  }}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📚 履歴に保存
                </button>
                <button
                  onClick={() => onSetSubmitted(false)}
                  className="w-full text-sm text-stone-600 hover:text-stone-800"
                >
                  句を編集する
                </button>
              </div>
            )}
          </div>

          {/* 相手の句確認 */}
          <div className="pt-6 border-t border-stone-200">
            {!showPartner ? (
              <button
                onClick={onCheckPartner}
                className="w-full border-2 border-stone-300 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-50 transition-colors"
              >
                相手の句を見る
              </button>
            ) : (
              <div>
                <p className="text-sm text-stone-700 mb-3">相手の句：</p>
                <div className="bg-stone-50 p-6 rounded-lg min-h-32 flex items-center justify-center">
                  {partnerHaiku ? (
                    <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap">
                      {partnerHaiku}
                    </p>
                  ) : (
                    <p className="text-stone-400">まだ提出されていません</p>
                  )}
                </div>

                {/* 選句・投票セクション */}
                {partnerHaiku && myHaiku && submitted && (
                  <div className="mt-6 pt-6 border-t border-stone-200">
                    <h4 className="text-sm font-bold text-stone-700 mb-4 text-center">
                      🗳️ 選句タイム
                    </h4>
                    <p className="text-xs text-stone-600 mb-4 text-center">
                      二つの句のうち、より良いと思う方を選んでください
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        onClick={() => onSubmitVote('mine')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          myVote === 'mine'
                            ? 'border-green-500 bg-green-50'
                            : 'border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-xs text-stone-600 mb-2">あなたの句</div>
                        <div className="text-sm text-stone-800 line-clamp-3">{myHaiku}</div>
                      </button>

                      <button
                        onClick={() => onSubmitVote('partner')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          myVote === 'partner'
                            ? 'border-green-500 bg-green-50'
                            : 'border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className="text-xs text-stone-600 mb-2">相手の句</div>
                        <div className="text-sm text-stone-800 line-clamp-3">{partnerHaiku}</div>
                      </button>
                    </div>

                    {myVote && (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-center text-sm">
                          ✓ 選句しました
                        </div>

                        {!showVoteResult && (
                          <button
                            onClick={onCheckPartnerVote}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            結果を見る
                          </button>
                        )}

                        {showVoteResult && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg border-2 border-amber-200">
                            <h5 className="font-bold text-stone-800 mb-4 text-center">
                              📊 選句結果
                            </h5>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-stone-700">あなたの選句：</span>
                                <span className="text-sm font-bold text-stone-800">
                                  {myVote === 'mine' ? '自分の句' : '相手の句'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-sm text-stone-700">相手の選句：</span>
                                <span className="text-sm font-bold text-stone-800">
                                  {partnerVote
                                    ? partnerVote === 'mine'
                                      ? '自分の句'
                                      : '相手の句'
                                    : '未投票'}
                                </span>
                              </div>

                              {partnerVote && (
                                <div className="pt-4 mt-4 border-t border-amber-300 text-center">
                                  {(myVote === 'partner' && partnerVote === 'mine') ||
                                  (myVote === 'mine' && partnerVote === 'partner') ? (
                                    <div className="space-y-2">
                                      <p className="text-2xl">🤝</p>
                                      <p className="text-sm text-stone-700">
                                        お互いを選び合いました！
                                        <br />
                                        素晴らしい座でした。
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <p className="text-2xl">✨</p>
                                      <p className="text-sm text-stone-700">
                                        それぞれの感性で選句しました。
                                        <br />
                                        良い句会でした。
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={onClosePartner}
                  className="mt-3 w-full text-sm text-stone-600 hover:text-stone-800"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>

          {/* ホームに戻る */}
          <div className="pt-6 border-t border-stone-200">
            <button
              onClick={onGoHome}
              className="w-full text-sm text-stone-600 hover:text-stone-800"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
