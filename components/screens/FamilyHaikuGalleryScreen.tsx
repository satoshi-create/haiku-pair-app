import { FAMILY_HAIKU_LIST, formatFamilyHaikuDate } from '@/lib/familyHaiku';

interface FamilyHaikuGalleryScreenProps {
  onClose: () => void;
}

/** 家族の句ギャラリー（閲覧専用・入力は上書きしない） */
export default function FamilyHaikuGalleryScreen({ onClose }: FamilyHaikuGalleryScreenProps) {
  return (
    <div className="space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-stone-200">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-stone-800">家族の句</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-700 text-2xl transition-colors"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <p className="text-base text-stone-600 mb-6">ご家族の過去の作品です。参考にご覧ください。</p>

        <ul className="space-y-5">
          {FAMILY_HAIKU_LIST.map((entry, idx) => (
            <li
              key={`${entry.date}-${idx}`}
              className="py-4 border-b border-stone-200 last:border-b-0"
            >
              <p className="text-xl text-stone-800 leading-relaxed whitespace-pre-wrap mb-1">
                {entry.haiku.replace(/　/g, ' ')}
              </p>
              <p className="text-base text-stone-500">
                {formatFamilyHaikuDate(entry.date)}
              </p>
            </li>
          ))}
        </ul>

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
