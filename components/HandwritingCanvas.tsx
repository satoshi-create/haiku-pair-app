"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
  /** 575 ガイドライン（縦2本で3ゾーン）を表示するか */
  showGuideLines?: boolean;
}

/**
 * デジタル半紙（手書きエリア）。
 * 指書き・リハビリ支援向けに最適化したキャンバス。
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
  const [hintIndex, setHintIndex] = useState(0);

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
      className="fixed inset-0 z-30 flex flex-col bg-white"
      style={{ touchAction: "none" }}
    >
      {/* 季語カンペ（最上部・常に見える） */}
      <div className="shrink-0 w-full px-4 py-3 sm:py-4 bg-amber-50/95 border-b border-amber-200/80">
        <p className="text-3xl sm:text-4xl font-bold text-stone-800 text-center">
          {kigo?.trim() ? (
            <>
              季語：<span className="text-amber-800">{kigo}</span>
            </>
          ) : (
            "季語を決めてから書いてね"
          )}
        </p>
      </div>

      {/* 補助者向けナッジ（左上）＆ 戻る（右上） */}
      <div className="absolute top-16 sm:top-20 left-2 z-20 max-w-[70%] sm:max-w-md rounded-lg bg-stone-100/95 px-3 py-2 text-xs sm:text-sm text-stone-600 shadow-sm">
        💡 {currentHint}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-16 sm:top-20 right-2 z-20 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-300 touch-manipulation"
          aria-label="キーボード入力に戻る"
        >
          戻る
        </button>
      )}

      {/* 筆記エリア（横幅100%・高さ60〜70dvh・575が収まる縦長） */}
      <div className="w-full flex-1 min-h-[60dvh] min-w-0 relative bg-white border-b border-stone-200">
        <div className="absolute inset-0">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: "w-full h-full touch-none block",
              style: { touchAction: "none" },
            }}
            minWidth={4}
            maxWidth={9}
            penColor="black"
            velocityFilterWeight={0.7}
            throttle={16}
            backgroundColor="rgb(255, 255, 255)"
          />
          {/* 575 ガイドライン（うっすら縦2本 → 3ゾーン） */}
          {showGuideLines && (
            <div
              className="absolute inset-0 pointer-events-none flex"
              aria-hidden
            >
              <div className="flex-1" />
              <div className="w-px bg-stone-300/50 shrink-0" />
              <div className="flex-1" />
              <div className="w-px bg-stone-300/50 shrink-0" />
              <div className="flex-1" />
            </div>
          )}
        </div>
      </div>

      {/* 操作ボタン（下部・押しやすい位置） */}
      <div className="shrink-0 flex items-center justify-between gap-4 p-4 sm:p-6 bg-white border-t border-stone-200 safe-area-pb">
        <button
          type="button"
          onClick={handleClear}
          className="h-16 min-h-[64px] min-w-[140px] sm:min-w-[160px] px-6 rounded-2xl bg-red-100 text-red-800 font-bold text-lg sm:text-xl hover:bg-red-200 active:bg-red-300 transition-colors touch-manipulation"
        >
          書き直す（消去）
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="h-16 min-h-[64px] min-w-[140px] sm:min-w-[160px] px-6 rounded-2xl bg-green-600 text-white font-bold text-lg sm:text-xl hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
        >
          これで決める（完了）
        </button>
      </div>
    </div>
  );
}
