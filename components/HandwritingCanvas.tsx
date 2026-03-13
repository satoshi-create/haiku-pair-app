"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface HandwritingCanvasProps {
  /** 現在選択中の季語（カンペ・ナッジに表示） */
  kigo?: string;
  onClear?: () => void;
  onComplete?: (dataUrl: string) => void;
  /** キャンバスを閉じてキーボード入力に戻る */
  onClose?: () => void;
  /** 補助者向けナッジ表示テキスト（複数、順にローテーション可）。季語を含む場合は {kigo} で埋め込み */
  nudgeHints?: string[];
  /** 575 ガイドライン（横2本で3行）を表示するか */
  showGuideLines?: boolean;
}

/**
 * デジタル半紙（手書きエリア）。
 * 指書き・リハビリ支援向けに最適化。横書き3行（5・7・5）レイアウト。
 */
export default function HandwritingCanvas({
  kigo = "",
  onClear,
  onComplete,
  onClose,
  nudgeHints,
  showGuideLines = true,
}: HandwritingCanvasProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const { width, height } = el.getBoundingClientRect();
      const w = Math.round(width);
      const h = Math.round(height);
      if (w > 0 && h > 0) {
        setCanvasSize({ width: w, height: h });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resolvedHints = useMemo(() => {
    if (nudgeHints && nudgeHints.length > 0) return nudgeHints;
    const k = kigo.trim();
    return [
      k ? `お父さん、『${k}』の俳句を書いてみようか` : "お父さん、今の季節の言葉を書いてみようか",
      "ゆっくり、指でなぞってみてね",
      "思いついた言葉を、そのまま書いてみましょう",
    ];
  }, [kigo, nudgeHints]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onClear?.();
    setHintIndex((i) => (i + 1) % resolvedHints.length);
  }, [resolvedHints.length, onClear]);

  const handleComplete = useCallback(() => {
    const pad = sigRef.current;
    if (pad && !pad.isEmpty()) {
      const dataUrl = pad.toDataURL("image/png");
      onComplete?.(dataUrl);
    }
  }, [onComplete]);

  const currentHint = resolvedHints[hintIndex] ?? resolvedHints[0];

  return (
    <div
      className="fixed inset-0 z-30 h-dvh flex flex-col overflow-hidden bg-white"
      style={{ touchAction: "none" }}
    >
      {/* 1. ヘッダー（季語・ナッジ）h-auto */}
      <header className="shrink-0 h-auto px-4 py-2 sm:py-3 bg-amber-50/95 border-b border-amber-200/80 relative">
        <p className="text-3xl sm:text-4xl font-bold text-stone-800 text-center">
          {kigo?.trim() ? (
            <>
              季語：<span className="text-amber-800">{kigo}</span>
            </>
          ) : (
            "季語を決めてから書いてね"
          )}
        </p>
        <div className="absolute top-2 left-2 max-w-[55%] sm:max-w-[60%] rounded-lg bg-stone-100/95 px-2 py-1.5 text-xs text-stone-600 shadow-sm">
          💡 {currentHint}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 min-h-[40px] min-w-[40px] px-2 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-300 touch-manipulation"
            aria-label="キーボード入力に戻る"
          >
            戻る
          </button>
        )}
      </header>

      {/* 2. 中央（キャンバス）flex-1 */}
      <div ref={containerRef} className="flex-1 min-h-0 min-w-0 relative bg-white overflow-hidden">
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <>
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                width: canvasSize.width,
                height: canvasSize.height,
                className: "absolute inset-0 block touch-none",
                style: { touchAction: "none", display: "block" },
              }}
              minWidth={4}
              maxWidth={9}
              penColor="black"
              velocityFilterWeight={0.7}
              throttle={16}
              backgroundColor="rgb(255, 255, 255)"
              clearOnResize={false}
            />
            {/* 575 ガイドライン（横2本 → 3行・横書き用） */}
            {showGuideLines && (
              <div
                className="absolute inset-0 pointer-events-none flex flex-col"
                aria-hidden
              >
                <div className="flex-1 min-h-0" />
                <div className="h-px shrink-0 bg-stone-300/50" />
                <div className="flex-1 min-h-0" />
                <div className="h-px shrink-0 bg-stone-300/50" />
                <div className="flex-1 min-h-0" />
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. フッター（ボタンエリア）h-24 固定 */}
      <footer className="shrink-0 h-24 flex items-center justify-between gap-4 px-4 sm:px-6 bg-white border-t border-stone-200 safe-area-pb">
        <button
          type="button"
          onClick={handleClear}
          className="h-14 min-h-[56px] min-w-[120px] sm:min-w-[140px] px-4 rounded-2xl bg-red-100 text-red-800 font-bold text-base sm:text-lg hover:bg-red-200 active:bg-red-300 transition-colors touch-manipulation"
        >
          書き直す（消去）
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="h-14 min-h-[56px] min-w-[120px] sm:min-w-[140px] px-4 rounded-2xl bg-green-600 text-white font-bold text-base sm:text-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
        >
          これで決める（完了）
        </button>
      </footer>
    </div>
  );
}
