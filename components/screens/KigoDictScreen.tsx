import { useState } from 'react';
import { kigoDatabase, searchKigo } from '@/lib/kigo';

interface KigoDictScreenProps {
  onClose: () => void;
  onSelectKigo?: (kigo: string, season: string) => void;
}

export default function KigoDictScreen({ onClose, onSelectKigo }: KigoDictScreenProps) {
  const [selectedKigo, setSelectedKigo] = useState<string | null>(null);
  const [kigoSearchQuery, setKigoSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">📖 季語辞典</h2>

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

        {/* 季語詳細表示 */}
        {selectedKigo && kigoDatabase[selectedKigo] && (
          <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg border-2 border-amber-200 slide-in">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-2xl font-bold text-stone-800">{selectedKigo}</h3>
              <button
                onClick={() => setSelectedKigo(null)}
                className="text-stone-400 hover:text-stone-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="text-xl text-amber-700 mb-2">
              {kigoDatabase[selectedKigo].season}の季語
            </div>
            <p className="text-stone-700 text-xl mb-4">{kigoDatabase[selectedKigo].description}</p>
            <div>
              <div className="text-xl font-bold text-stone-600 mb-2">例句：</div>
              {kigoDatabase[selectedKigo].examples.map((ex, i) => (
                <p key={i} className="text-stone-700 text-xl mb-1 pl-4 border-l-2 border-amber-300">
                  {ex}
                </p>
              ))}
            </div>
            {onSelectKigo && (
              <button
                type="button"
                onClick={() => {
                  onSelectKigo(selectedKigo, kigoDatabase[selectedKigo].season);
                  onClose();
                }}
                className="mt-6 w-full bg-stone-800 text-white text-xl py-4 rounded-xl hover:bg-stone-700"
              >
                この季語をお題にする
              </button>
            )}
          </div>
        )}

        {/* 季語一覧 */}
        <div className="grid grid-cols-3 gap-2">
          {searchKigo(kigoSearchQuery).map((k) => (
            <button
              key={k}
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
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="w-full text-xl text-stone-600 hover:text-stone-800 py-3"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
