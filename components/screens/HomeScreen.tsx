interface HomeScreenProps {
  userName: string;
  onUserNameChange: (name: string) => void;
  onCreateSession: () => void;
  onJoin: () => void;
  onGallery: () => void;
}

export default function HomeScreen({
  userName,
  onUserNameChange,
  onCreateSession,
  onJoin,
  onGallery,
}: HomeScreenProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-stone-800">AI句会ワークショップ</h1>
        <p className="text-stone-600">朝の散歩の写真から俳句を詠む</p>
      </div>

      <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200 space-y-6">
        <p className="text-stone-700 leading-relaxed">
          二人で座を組み、同じ場面を味わいながら、<br />
          ゆっくり一句ずつ詠んでいきます。
        </p>

        <div className="space-y-4">
          <input
            type="text"
            value={userName}
            onChange={(e) => onUserNameChange(e.target.value)}
            placeholder="あなたの名前（芭蕉、蕪村など）"
            className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-xl"
          />

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onCreateSession}
              disabled={!userName.trim()}
              className="bg-stone-800 text-white px-6 py-4 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              座を立てる
            </button>

            <button
              onClick={onJoin}
              disabled={!userName.trim()}
              className="border-2 border-stone-800 text-stone-800 px-6 py-4 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl"
            >
              座に参加
            </button>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <button
              onClick={onGallery}
              className="w-full border-2 border-blue-600 text-blue-700 px-6 py-4 rounded-lg hover:bg-blue-50 transition-colors text-xl"
            >
              📚 句の履歴・ギャラリー
            </button>
            <p className="text-lg text-stone-500 text-center mt-2">
              これまでに詠んだ句を振り返る
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
