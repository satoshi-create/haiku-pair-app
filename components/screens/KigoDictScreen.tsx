import React, { useState } from 'react';
import { kigoDatabase, searchKigo } from '@/lib/kigo';

interface KigoDictScreenProps {
  onClose: () => void;
  onSelectKigo?: (kigo: string, season: string) => void;
}

export default function KigoDictScreen({ onClose, onSelectKigo }: KigoDictScreenProps) {
  const [selectedKigo, setSelectedKigo] = useState<string | null>(null);
  const [kigoSearchQuery, setKigoSearchQuery] = useState('');

  return (
    <div className="space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-stone-800">📖 季語辞典</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-700 text-2xl transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          value={kigoSearchQuery}
          onChange={(e) => setKigoSearchQuery(e.target.value)}
          placeholder="季語を検索..."
          className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 mb-6 text-xl"
        />

        {/* 季節別タブ */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(['春', '夏', '秋', '冬'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setKigoSearchQuery(kigoSearchQuery === s ? '' : s)}
              className={`px-4 py-3 rounded-lg text-xl font-bold transition-colors ${
                kigoSearchQuery === s
                  ? s === '春'
                    ? 'bg-pink-500 text-white'
                    : s === '夏'
                      ? 'bg-green-500 text-white'
                      : s === '秋'
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 季語一覧：選択季語の直上に「解説・例句・この季語をお題にする」を動的表示 */}
        <div className="grid grid-cols-3 gap-2">
          {searchKigo(kigoSearchQuery).map((k) => (
            <React.Fragment key={k}>
              {selectedKigo === k && kigoDatabase[k] && (
                <div className="col-span-3 mb-2 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-lg border-2 border-amber-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xl font-bold text-stone-800">{k}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedKigo(null)}
                      className="text-stone-400 hover:text-stone-600 text-lg"
                      aria-label="選択を解除"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-stone-600 mb-1">{kigoDatabase[k].season}の季語</p>
                  <p className="text-stone-700 text-base mb-3">{kigoDatabase[k].description}</p>
                  <div className="mb-3">
                    <span className="text-base font-bold text-stone-600">例句：</span>
                    <ul className="mt-1 space-y-0.5">
                      {kigoDatabase[k].examples.map((ex, i) => (
                        <li key={i} className="text-stone-700 text-base pl-4 border-l-2 border-amber-300">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {onSelectKigo && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectKigo(k, kigoDatabase[k].season);
                        onClose();
                      }}
                      className="w-full bg-stone-800 text-white text-lg py-3 rounded-xl hover:bg-stone-700 font-semibold"
                    >
                      この季語をお題にする
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedKigo(k === selectedKigo ? null : k)}
                className={`p-4 rounded-lg text-xl text-left transition-all ${
                  selectedKigo === k
                    ? 'bg-amber-100 border-2 border-amber-400 text-amber-800 font-bold'
                    : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="font-bold">{k}</div>
                <div className="text-base text-stone-500">{kigoDatabase[k].season}</div>
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-xl text-stone-700 hover:text-stone-900 hover:bg-stone-100 py-4 rounded-xl font-semibold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
