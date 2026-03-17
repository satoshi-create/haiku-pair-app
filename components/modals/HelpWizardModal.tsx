  "use client";

  import { createPortal } from "react-dom";
import { useCallback } from "react";
import { Printer, X } from "lucide-react";

import type { HelpVariant } from "@/lib/helpSteps";
import { getStepsForVariant } from "@/lib/helpSteps";

  interface HelpWizardModalProps {
    show: boolean;
    onClose: () => void;
    role?: "host" | "guest";
    /** どの画面のガイドか。省略時は "session" */
    variant?: HelpVariant;
    /** 俳句作成画面の activeStep と同期する場合に指定（1〜5）。指定時はヘルプの表示ステップがこれに追従する */
    syncStep?: number;
  }

  export default function HelpWizardModal({
    show,
    onClose,
    role = "host",
    variant = "session",
    syncStep,
  }: HelpWizardModalProps) {
  const steps = getStepsForVariant(variant, role);
  const totalSteps = steps.length;
  // 旧: タイトル文字列（例：ホームの操作ガイド）は使わず、現在の Step と見出しで表示する

  const syncedStep =
    syncStep != null && syncStep >= 1 && syncStep <= totalSteps ? syncStep : undefined;
  const displayStep = syncedStep ?? 1;
  const currentStep = steps[displayStep - 1];

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

    if (!show) return null;

    const showStepInHeader = variant === "session" && totalSteps > 1;

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
              <div className="min-w-0">
                {showStepInHeader && (
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Step {displayStep} / {totalSteps}
                  </p>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-stone-800 font-kaisei text-left truncate">
                  {currentStep.title}
                </h2>
              </div>
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
                <div className="bg-stone-50 rounded-xl border border-stone-200 aspect-4/3 lg:aspect-square flex items-center justify-center overflow-hidden">
                  <div className="text-center p-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 text-3xl">
                    {displayStep}
                    </div>
                    <p className="text-sm text-stone-500">
                    Step {displayStep}：{currentStep.title}
                    </p>
                    <p className="text-xs text-stone-400 mt-2">
                    （図解は public/assets/guide/step{displayStep}.png で差し替え可能）
                    </p>
                  </div>
                </div>

                {/* 右：説明文 */}
                <div className="flex flex-col gap-4">
                  <div>
                    <ol className="space-y-2 text-base text-stone-700 leading-relaxed">
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
            <div className="shrink-0 border-t border-stone-200 px-4 sm:px-6 py-4 flex items-center justify-end gap-3 no-print">
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
                  <ol className="space-y-2 text-base text-stone-900 mb-4">
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
