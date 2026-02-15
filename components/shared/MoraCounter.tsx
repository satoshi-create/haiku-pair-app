import { analyzeHaikuStructure } from '@/lib/mora';

interface MoraCounterProps {
  text: string;
}

export default function MoraCounter({ text }: MoraCounterProps) {
  const lines = analyzeHaikuStructure(text);

  return (
    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-stone-600">音数カウンター</span>
        <span className="text-xs text-stone-500">目安：5-7-5</span>
      </div>
      {lines.map((line, index) => (
        <div key={index} className="flex items-center gap-3 mb-2">
          <div className="flex-1 text-sm text-stone-700 truncate">
            {line.text || '（空行）'}
          </div>
          <div
            className={`text-sm font-bold px-3 py-1 rounded-full ${
              (index === 0 && line.mora === 5) ||
              (index === 1 && line.mora === 7) ||
              (index === 2 && line.mora === 5)
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {line.mora}音
          </div>
        </div>
      ))}
      <p className="text-xs text-stone-500 mt-3">
        ※音数は目安です。漢字の読みによって変わる場合があります
      </p>
    </div>
  );
}
