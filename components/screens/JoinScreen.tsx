import { useState } from 'react';

interface JoinScreenProps {
  onJoin: (sessionId: string) => void;
  onBack: () => void;
}

export default function JoinScreen({ onJoin, onBack }: JoinScreenProps) {
  const [inputId, setInputId] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">座に参加</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="セッションID（6桁）"
            maxLength={6}
            value={inputId}
            onChange={(e) => setInputId(e.target.value.toUpperCase())}
            className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-center text-2xl tracking-wider uppercase"
          />

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onJoin(inputId)}
              disabled={inputId.length !== 6}
              className="bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
            >
              参加する
            </button>

            <button
              onClick={onBack}
              className="border border-stone-300 px-6 py-3 rounded-lg hover:bg-stone-100 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
