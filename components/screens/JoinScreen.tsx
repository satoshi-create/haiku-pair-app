"use client";

import { useState } from 'react';
import HelpWizardModal from '@/components/modals/HelpWizardModal';
import { HelpCircle } from 'lucide-react';

interface JoinScreenProps {
  onJoin: (sessionId: string) => void;
  onBack: () => void;
}

export default function JoinScreen({ onJoin, onBack }: JoinScreenProps) {
  const [inputId, setInputId] = useState('');
  const [showHelpWizard, setShowHelpWizard] = useState(false);

  return (
    <div className="relative space-y-6">
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

      <button
        type="button"
        onClick={() => setShowHelpWizard(true)}
        className="fixed bottom-6 right-6 z-30 p-3 rounded-full bg-stone-800/50 text-white/90 hover:bg-stone-700/60 hover:text-white transition-colors touch-manipulation shadow-lg"
        aria-label="座に参加の操作ガイドを開く"
      >
        <HelpCircle className="w-7 h-7" strokeWidth={2} />
      </button>

      <HelpWizardModal
        show={showHelpWizard}
        onClose={() => setShowHelpWizard(false)}
        variant="join"
        role="guest"
      />
    </div>
  );
}
