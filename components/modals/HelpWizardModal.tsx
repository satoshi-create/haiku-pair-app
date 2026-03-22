  "use client";

  import { Printer, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { HelpVariant, StepData } from "@/lib/helpSteps";
import { getAllStepsForPrint, getStepsForVariant } from "@/lib/helpSteps";

function HelpGuideFigure({
  step,
  layout,
}: {
  step: StepData;
  layout: "modal" | "print";
}) {
  if (!step.imageSrc) {
    const label = (
      <span className="text-stone-500 text-sm text-center px-4">図解は準備中です</span>
    );
    if (layout === "modal") {
      return (
        <div className="w-full h-full flex items-center justify-center rounded-lg bg-stone-200/70">
          {label}
        </div>
      );
    }
    return (
      <div className="help-wizard-print-placeholder flex items-center justify-center bg-stone-100 rounded-lg border border-dashed border-stone-300">
        {label}
      </div>
    );
  }
  return (
    <img
      src={step.imageSrc}
      alt={`${step.title}の操作ガイド`}
      className={
        layout === "modal"
          ? "w-full h-full object-contain bg-stone-200/70 rounded-lg"
          : "help-wizard-print-img"
      }
      loading="eager"
    />
  );
}

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
  const [printMode, setPrintMode] = useState<"current" | "all">("current");
  const steps = getStepsForVariant(variant, role);
  const totalSteps = steps.length;
  // 旧: タイトル文字列（例：ホームの操作ガイド）は使わず、現在の Step と見出しで表示する

  const syncedStep =
    syncStep != null && syncStep >= 1 && syncStep <= totalSteps ? syncStep : undefined;
  const displayStep = syncedStep ?? 1;
  const currentStep = steps[displayStep - 1];

  const printSteps = useMemo(() => {
    if (printMode === "all") return getAllStepsForPrint(role);
    // 「今の説明を印刷する」＝ 今表示している1ページのみ
    return [currentStep];
  }, [currentStep, printMode, role]);

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
                {/* 左：図解エリア */}
                <div className="bg-stone-200/70 rounded-xl border border-stone-200 aspect-4/3 lg:aspect-square overflow-hidden p-3">
                  <HelpGuideFigure step={currentStep} layout="modal" />
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

            {/* フッター：印刷 */}
            <div className="shrink-0 border-t border-stone-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => {
                  setPrintMode("current");
                  handlePrint();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 font-semibold hover:bg-stone-50 transition-colors touch-manipulation"
              >
                <Printer className="w-5 h-5" />
                今の説明を印刷する
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintMode("all");
                  handlePrint();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 text-white font-semibold hover:bg-stone-700 transition-colors touch-manipulation"
              >
                <Printer className="w-5 h-5" />
                全部まとめて印刷する
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
              {printSteps.map((s, i) => {
                const stepLine =
                  printMode === "all"
                    ? i >= 2
                      ? `Step ${i - 1} / 5`
                      : ""
                    : variant === "session" && totalSteps > 1
                      ? `Step ${displayStep} / ${totalSteps}`
                      : "";

                return (
                <div key={i} className="help-wizard-print-page">
                  <div style={{ breakInside: "avoid" }}>
                    {stepLine && (
                      <p className="text-sm font-semibold text-stone-700 mb-1">
                        {stepLine}
                      </p>
                    )}
                    <h2 className="text-2xl font-bold text-stone-900 mb-4 font-kaisei">
                      {s.title}
                    </h2>
                    <div
                      className="help-wizard-print-grid grid grid-cols-2 gap-6 items-stretch"
                      style={{ breakInside: "avoid" }}
                    >
                      {/* 左：テキスト */}
                      <div className="help-wizard-print-text min-w-0">
                        <ol className="space-y-2 text-base text-stone-900 mb-4">
                          {s.actions.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ol>
                        <blockquote className="border-l-4 border-stone-800 pl-4 py-2 bg-stone-50">
                          <p className="text-base text-stone-900 font-kaisei">「{s.nudge}」</p>
                        </blockquote>
                      </div>

                      {/* 右：画像（印刷時は @media print で高さ・アスペクトを制御） */}
                      <div className="help-wizard-print-figure min-w-0 flex items-center justify-center bg-white">
                        <HelpGuideFigure step={s} layout="print" />
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>,
            document.body
          )}
      </>
    );
  }
