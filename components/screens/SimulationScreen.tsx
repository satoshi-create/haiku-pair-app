import { useState } from 'react';
import MoraCounter from '@/components/shared/MoraCounter';

interface SimulationScreenProps {
  kigo: string;
  season: string;
  onSaveToHistory: (haiku: string, kigo: string, season: string, author: string) => void;
  onOpenShareCard: (haiku: string, kigo: string, season: string, author: string) => void;
  onRestartSimulation: () => void;
  onGoHome: () => void;
}

export default function SimulationScreen({
  kigo,
  season,
  onSaveToHistory,
  onOpenShareCard,
  onRestartSimulation,
  onGoHome,
}: SimulationScreenProps) {
  const [simStep, setSimStep] = useState(1);
  const [bashoHaiku, setBashoHaiku] = useState('');
  const [busonHaiku, setBusonHaiku] = useState('');
  const [bashoSubmitted, setBashoSubmitted] = useState(false);
  const [busonSubmitted, setBusonSubmitted] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <div className="text-center mb-8 pb-6 border-b border-stone-200">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">🎭 シミュレーション</h2>
          <div className="text-sm text-stone-600 mb-2">今日のお題</div>
          <div className="text-5xl font-bold text-stone-800 mb-2 float">{kigo}</div>
          <div className="text-stone-500">（{season}）</div>
        </div>

        {/* 芭蕉のターン */}
        {simStep === 1 && (
          <div className="space-y-4 slide-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold">
                芭
              </div>
              <div>
                <div className="font-bold text-stone-800">松尾芭蕉</div>
                <div className="text-xs text-stone-500">まずは芭蕉として一句</div>
              </div>
            </div>

            <textarea
              value={bashoHaiku}
              onChange={(e) => setBashoHaiku(e.target.value)}
              placeholder={'芭蕉として句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
              className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
              disabled={bashoSubmitted}
            />

            {bashoHaiku && <MoraCounter text={bashoHaiku} />}

            {!bashoSubmitted ? (
              <button
                onClick={() => {
                  if (bashoHaiku.trim()) {
                    setBashoSubmitted(true);
                    setSimStep(2);
                  }
                }}
                disabled={!bashoHaiku.trim()}
                className="w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                芭蕉の句を提出 → 蕪村のターンへ
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg text-center">
                ✓ 芭蕉の句を提出しました
              </div>
            )}
          </div>
        )}

        {/* 蕪村のターン */}
        {simStep === 2 && (
          <div className="space-y-4 slide-in">
            <div className="bg-stone-50 p-4 rounded-lg mb-4 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">芭蕉の句（まだ見えません）</div>
              <div className="text-stone-400 text-sm">***提出済み***</div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold">
                蕪
              </div>
              <div>
                <div className="font-bold text-stone-800">与謝蕪村</div>
                <div className="text-xs text-stone-500">次は蕪村として一句</div>
              </div>
            </div>

            <textarea
              value={busonHaiku}
              onChange={(e) => setBusonHaiku(e.target.value)}
              placeholder={'蕪村として句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
              className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
              disabled={busonSubmitted}
            />

            {busonHaiku && <MoraCounter text={busonHaiku} />}

            {!busonSubmitted ? (
              <button
                onClick={() => {
                  if (busonHaiku.trim()) {
                    setBusonSubmitted(true);
                  }
                }}
                disabled={!busonHaiku.trim()}
                className="w-full bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                蕪村の句を提出 → 披露へ
              </button>
            ) : (
              <div className="space-y-6 slide-in">
                <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg text-center">
                  ✓ 両者の句が出揃いました！
                </div>

                <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-6 rounded-lg border-2 border-stone-300">
                  <h3 className="text-lg font-bold text-stone-800 mb-6 text-center">
                    📜 句の披露
                  </h3>

                  <div className="space-y-6">
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-sm">
                          芭
                        </div>
                        <span className="font-bold text-stone-700">松尾芭蕉</span>
                      </div>
                      <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap pl-10">
                        {bashoHaiku}
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm">
                          蕪
                        </div>
                        <span className="font-bold text-stone-700">与謝蕪村</span>
                      </div>
                      <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap pl-10">
                        {busonHaiku}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => {
                        onSaveToHistory(bashoHaiku, kigo, season, '芭蕉');
                        onSaveToHistory(busonHaiku, kigo, season, '蕪村');
                        alert('両方の句を履歴に保存しました');
                      }}
                      className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📚 両方の句を履歴に保存
                    </button>
                    <button
                      onClick={() => onOpenShareCard(bashoHaiku, kigo, season, '芭蕉')}
                      className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📤 芭蕉の共有カード
                    </button>
                    <button
                      onClick={() => onOpenShareCard(busonHaiku, kigo, season, '蕪村')}
                      className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      📤 蕪村の共有カード
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={onRestartSimulation}
                    className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    🎭 もう一度シミュレーション
                  </button>
                  <button
                    onClick={onGoHome}
                    className="w-full text-sm text-stone-600 hover:text-stone-800"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* シミュレーション中のホームボタン */}
        {!(simStep === 2 && busonSubmitted) && (
          <div className="mt-6 pt-4 border-t border-stone-200">
            <button
              onClick={onGoHome}
              className="w-full text-sm text-stone-600 hover:text-stone-800"
            >
              ホームに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
