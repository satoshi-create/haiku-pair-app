"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Printer, X } from "lucide-react";

/** 各ステップの説明データ */
interface StepData {
  title: string;
  /** どこを見るか */
  lookAt: string[];
  /** 何をするか */
  actions: string[];
  /** 応援の一言 */
  nudge: string;
}

const STEPS_HOST: StepData[] = [
  {
    title: "お題を選ぶ",
    lookAt: [
      "画面上部：散歩の写真や、季節の言葉（季語）のリスト",
      "写真がない場合は「季語辞典から選ぶ」のリンク",
      "季語を選ぶと、そのすぐ上に「この季語をお題にする」ボタンが表示されます",
    ],
    actions: [
      "写真から提案された季語、または季語辞典の一覧を見る",
      "好きな言葉を指でタップして選ぶ",
      "表示された「この季語をお題にする」ボタンを押す",
    ],
    nudge: "この写真のどこが、お心に残りましたか？ その思いが、今日の一句になります。",
  },
  {
    title: "指で書く",
    lookAt: [
      "画面中央：三本の横線が引かれた白い画面（デジタル半紙）",
      "画面上部：今日のお題（季語）が表示されています",
      "下部：「書き直す（消去）」と「これで決める（完了）」のボタン",
    ],
    actions: [
      "「指で書く（デジタル半紙）」ボタンを押して、白い画面を開く",
      "線と線の間に、指で一文字ずつ「五・七・五」を横に書く",
      "書き終えたら「これで決める（完了）」を押す",
      "アプリが書いた字を読み取ります（少しお待ちください）",
    ],
    nudge: "ゆっくり書くと、きれいに読み取れます。指を動かすのも、立派な体操ですよ。",
  },
  {
    title: "言葉を整える",
    lookAt: [
      "画面上部：「いまの句（編集できます）」の枠に、読み取られた俳句が表示されています",
      "その下：「AIからの提案（参考）」を開くと、言い換えの案が表示されます",
      "「AIに相談する」ボタンで、新しい提案を得られます",
    ],
    actions: [
      "読み取られた句を確認し、必要なら枠内で直す",
      "「AIに相談する」を押すと、AIがより良い表現を提案してくれます",
      "気に入った案があれば、その案を指でタップして選ぶ",
      "問題なければ「AIに相談する前へ」または「提出する前へ」を押して次へ進む",
    ],
    nudge: "AIさんが、少し言い方を整えてくれました。お好みの方を、どうぞお選びください。",
  },
  {
    title: "作品を確認する",
    lookAt: [
      "画面中央：「この句でよろしければ、みんなに送信します」のメッセージ",
      "その下：今日詠んだ俳句が、訂正できる枠に表示されています",
      "印刷時には、自分の書いた字が「はんこ」のように写真の隅に載ります",
    ],
    actions: [
      "表示された俳句を、最後にもう一度確認する",
      "直したいところがあれば、枠内をタップして訂正する",
      "自分の名前（はんこ）の位置を心に留めておく（印刷プレビューで確認できます）",
      "良ければ「この句をみんなに送る」を押す",
    ],
    nudge: "お父様の字が、立派な「はんこ」になります。世界に一つだけの作品です。",
  },
  {
    title: "紙に印刷する",
    lookAt: [
      "披講（鑑賞）画面で、二人の句が並んで表示されます",
      "「句の履歴」に移動すると、過去の句の一覧が表示されます",
      "印刷したい句を選び「印刷プレビュー」を開くと、L判サイズの写真カードが表示されます",
    ],
    actions: [
      "Step 5 の披講画面で、二人の句を並べて鑑賞する",
      "ホームに戻り、「句の履歴」を開く",
      "印刷したい句のカードを選び、「印刷」または「印刷プレビュー」を押す",
      "自分の名前（はんこ）を載せる場合は、チェックを入れる",
      "ブラウザの「印刷」ボタンを押し、プリンターからカードが出てくるのを待つ",
    ],
    nudge: "ノートに貼って、日付やその日の出来事を書き添えれば、思い出の一冊になります。",
  },
];

const STEPS_GUEST: StepData[] = [
  {
    title: "お題を待つ",
    lookAt: [
      "画面上部：「ホストがお題を探しています…」のメッセージ",
      "ホストが季語を決めると、今日のお題が表示されます",
    ],
    actions: [
      "ホストが季語を選ぶまで、少しお待ちください",
      "お題が表示されたら「次へ」を押して、句を詠む画面へ進みます",
    ],
    nudge: "お題が決まるまで、のんびりしていてください。",
  },
  ...STEPS_HOST.slice(1),
];

/** ホーム画面用：ホスト・ゲスト共通の入口説明 */
const HOME_STEPS: StepData[] = [
  {
    title: "名前を入力する",
    lookAt: [
      "画面上部：「AI句会ワークショップ」のタイトルと説明文",
      "その下：入力欄「あなたの名前（芭蕉、蕪村など）」",
      "その下：ボタン「座を立てる」「座に参加」、および「📚 句の履歴・ギャラリー」",
    ],
    actions: [
      "俳号やニックネームを入力する（例：芭蕉、蕪村）",
      "名前を入力しないと「座を立てる」「座に参加」は押せません",
    ],
    nudge: "お好きな名前で、一句ずつ詠んでいきましょう。",
  },
  {
    title: "入口を選ぶ",
    lookAt: [
      "中央：「座を立てる」と「座に参加」の二つの大きなボタン",
      "下部：「📚 句の履歴・ギャラリー」ボタン（過去の句を見る・印刷する）",
    ],
    actions: [
      "【ホスト】座を用意する場合 →「座を立てる」をタップ → 次の画面でQRコード・6桁IDを相手に見せる",
      "【ゲスト】相手の座に参加する場合 →「座に参加」をタップ → 次の画面で6桁コードを入力するか、QRを読み取る",
      "過去の句を見る・印刷する →「句の履歴・ギャラリー」をタップ",
    ],
    nudge: "主（ホスト）が座を立て、客（ゲスト）が座に参加。どちらも同じホームから始まります。",
  },
  {
    title: "次の画面へ",
    lookAt: [
      "「座を立てる」を押すと：6桁のセッションIDとQRコードが表示される画面（HostScreen）へ",
      "「座に参加」を押すと：セッションID入力またはQR読み取りの画面（JoinScreen）へ",
    ],
    actions: [
      "ホストは、相手にQRコードを見せるか6桁IDを伝えてから「句会を始める」を押す",
      "ゲストは、6桁を入力するか別端末でQRを読み取り「参加する」を押す",
    ],
    nudge: "相手がそろったら、いよいよ句会の始まりです。",
  },
];

/** QRコード・待機画面用（ホストのみ） */
const HOST_WAIT_STEPS: StepData[] = [
  {
    title: "6桁IDとQRコードを相手に示す",
    lookAt: [
      "画面上部：「座を立てました」「お相手に以下のIDを伝えてください」",
      "中央：大きな6桁のセッションID（例：ABC123）",
      "その下：「または、QRコードを読み取ってもらう」とQRコード画像",
      "下部：「句会を始める」「キャンセル」ボタン",
    ],
    actions: [
      "相手に6桁のIDを声で伝えるか、この画面のQRコードを見せて読み取ってもらう",
      "相手は「座に参加」→ 6桁を入力するか、別の端末でこのQRを読み取り参加する",
    ],
    nudge: "QRコードを読み取ると、相手のアプリに自動で座のIDが入ります。",
  },
  {
    title: "相手が参加したら句会を始める",
    lookAt: [
      "「句会を始める」ボタン：相手が参加したら押すと、俳句作成画面（SessionScreen）へ進む",
      "「キャンセル」：座をやめてホームに戻る",
    ],
    actions: [
      "相手が参加するまで待つ（相手は JoinScreen で「参加する」を押すか、QRで自動参加）",
      "二人がそろったら「句会を始める」をタップする",
      "やめる場合は「キャンセル」でホームに戻る",
    ],
    nudge: "二人が揃ったら、句会の幕開けです。",
  },
];

/** 座に参加画面用（ゲストのみ） */
const JOIN_STEPS: StepData[] = [
  {
    title: "参加方法を選ぶ",
    lookAt: [
      "画面上部：「座に参加」",
      "中央：入力欄「セッションID（6桁）」",
      "下部：「参加する」「戻る」ボタン",
    ],
    actions: [
      "【方法A】ホストから聞いた6桁のコード（例：ABC123）を入力する",
      "【方法B】別の端末（スマホなど）でホストのQRコードを読み取り、このアプリが ?session=XXX 付きで開いたら自動で参加できる",
    ],
    nudge: "ホストの画面に表示されている6桁か、QRコードで参加できます。",
  },
  {
    title: "参加する",
    lookAt: [
      "6桁を正しく入力すると「参加する」ボタンが押せるようになる",
      "「戻る」でホーム画面に戻る",
    ],
    actions: [
      "6桁のセッションIDを入力したら「参加する」をタップする",
      "俳句作成画面（SessionScreen）に移り、お題が決まるまで待つ",
      "参加をやめる場合は「戻る」でホームへ",
    ],
    nudge: "参加できたら、ホストがお題を決めるまで少しお待ちください。",
  },
];

export type HelpVariant = "session" | "home" | "host-wait" | "join";

interface HelpWizardModalProps {
  show: boolean;
  onClose: () => void;
  role?: "host" | "guest";
  /** どの画面のガイドか。省略時は "session" */
  variant?: HelpVariant;
  /** モーダルタイトル。省略時は variant に応じた既定タイトル */
  title?: string;
  /** 俳句作成画面の activeStep と同期する場合に指定（1〜5）。指定時はヘルプの表示ステップがこれに追従する */
  syncStep?: number;
}

const VARIANT_TITLES: Record<HelpVariant, string> = {
  session: "操作ガイド",
  home: "ホームの操作ガイド",
  "host-wait": "QRコードの画面",
  join: "座に参加",
};

function getStepsForVariant(variant: HelpVariant, role: "host" | "guest"): StepData[] {
  switch (variant) {
    case "home":
      return HOME_STEPS;
    case "host-wait":
      return HOST_WAIT_STEPS;
    case "join":
      return JOIN_STEPS;
    default:
      return role === "guest" ? STEPS_GUEST : STEPS_HOST;
  }
}

export default function HelpWizardModal({
  show,
  onClose,
  role = "host",
  variant = "session",
  title,
  syncStep,
}: HelpWizardModalProps) {
  const [step, setStep] = useState(1);
  const steps = getStepsForVariant(variant, role);
  const currentStep = steps[step - 1];
  const totalSteps = steps.length;
  const modalTitle = title ?? VARIANT_TITLES[variant];

  /** 俳句作成画面の activeStep と同期 */
  useEffect(() => {
    if (syncStep != null && syncStep >= 1 && syncStep <= totalSteps) {
      setStep(syncStep);
    }
  }, [syncStep, totalSteps]);

  const handlePrint = useCallback(() => {
    document.body.classList.add("help-wizard-print-mode");
    const cleanup = () => {
      document.body.classList.remove("help-wizard-print-mode");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    // DOM 更新を待ってから印刷（プレビュー白紙対策）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, []);

  const goPrev = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => setStep((s) => Math.min(totalSteps, s + 1));

  if (!show) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-label="閉じる"
      >
        <div
          className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-4xl max-h-[90dvh] overflow-hidden flex flex-col no-print"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-stone-200">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-800 font-kaisei text-left">
              {modalTitle}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* メイン：左右分割（A4横比率を意識） */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 p-4 sm:p-6">
              {/* 左：図解エリア（プレースホルダー） */}
              <div className="bg-stone-50 rounded-xl border border-stone-200 aspect-[4/3] lg:aspect-square flex items-center justify-center overflow-hidden">
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 text-3xl">
                    {step}
                  </div>
                  <p className="text-sm text-stone-500">
                    Step {step}：{currentStep.title}
                  </p>
                  <p className="text-xs text-stone-400 mt-2">
                    （図解は public/assets/guide/step{step}.png で差し替え可能）
                  </p>
                </div>
              </div>

              {/* 右：説明文 */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                    Step {step} / {totalSteps}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-800 mb-4 font-kaisei">
                    {currentStep.title}
                  </h3>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-700 mb-2">どこを見るか</p>
                  <ul className="list-disc pl-5 space-y-1 text-base text-stone-600 leading-relaxed">
                    {currentStep.lookAt.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-700 mb-2">何をするか</p>
                  <ol className="list-decimal pl-5 space-y-1 text-base text-stone-600 leading-relaxed">
                    {currentStep.actions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </div>
                <blockquote className="border-l-4 border-amber-300 pl-4 py-2 bg-amber-50/80 rounded-r-lg">
                  <p className="text-base text-stone-700 font-kaisei italic">
                    「{currentStep.nudge}」
                  </p>
                </blockquote>
              </div>
            </div>
          </div>

          {/* フッター：進捗インジケーター + ナビ + 印刷 */}
          <div className="shrink-0 border-t border-stone-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={step <= 1}
                className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="前へ"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setStep(i + 1)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      i + 1 === step
                        ? "bg-stone-800"
                        : "bg-stone-200 hover:bg-stone-300"
                    }`}
                    aria-label={`Step ${i + 1}へ`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={step >= totalSteps}
                className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="次へ"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 text-white font-semibold hover:bg-stone-700 transition-colors touch-manipulation"
              >
                <Printer className="w-5 h-5" />
                PDFで保存 / 印刷
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 印刷用コンテンツ：body 直下に Portal し、印刷時のみ表示 */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            id="help-wizard-print-root"
            className="help-wizard-print-root hidden"
            aria-hidden="true"
          >
            {steps.map((s, i) => (
              <div key={i} className="help-wizard-print-page">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 font-kaisei">
                  【{s.title}】 Step {i + 1} / {totalSteps}
                </h2>
                <p className="text-sm font-semibold text-stone-700 mb-2">どこを見るか</p>
                <ul className="list-disc pl-5 space-y-1 text-base text-stone-800 mb-4">
                  {s.lookAt.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-stone-700 mb-2">何をするか</p>
                <ol className="list-decimal pl-5 space-y-1 text-base text-stone-800 mb-4">
                  {s.actions.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ol>
                <blockquote className="border-l-4 border-stone-800 pl-4 py-2 bg-stone-50">
                  <p className="text-base text-stone-900 font-kaisei">「{s.nudge}」</p>
                </blockquote>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
