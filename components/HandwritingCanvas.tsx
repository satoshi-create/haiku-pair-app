"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface HandwritingCanvasProps {
  onClear?: () => void;
  onComplete?: (dataUrl: string) => void;
  /** キャンバスを閉じてキーボード入力に戻る */
  onClose?: () => void;
  /** 補助者向けナッジ表示テキスト（複数、順にローテーション可） */
  nudgeHints?: string[];
}

/**
 * デジタル半紙（手書きエリア）。
 * 指書き・リハビリ支援向けに最適化したキャンバス。
 */
export default function HandwritingCanvas({
  onClear,
  onComplete,
  onClose,
  nudgeHints = [
    "お父さん、今の季節の言葉を書いてみようか",
    "ゆっくり、指でなぞってみてね",
    "思いついた言葉を、そのまま書いてみましょう",
  ],
}: HandwritingCanvasProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.round(width), height: Math.round(height) });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onClear?.();
    setHintIndex((i) => (i + 1) % nudgeHints.length);
  }, [nudgeHints.length, onClear]);

  const handleComplete = useCallback(() => {
    const pad = sigRef.current;
    if (pad && !pad.isEmpty()) {
      const dataUrl = pad.toDataURL("image/png");
      onComplete?.(dataUrl);
    }
  }, [onComplete]);

  const currentHint = nudgeHints[hintIndex] ?? nudgeHints[0];

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col bg-white"
      style={{ touchAction: "none" }}
    >
      {/* 補助者向けナッジ（左上）＆ 戻る（右上） */}
      <div className="absolute top-2 left-2 z-20 max-w-[70%] sm:max-w-md rounded-lg bg-stone-100/95 px-3 py-2 text-xs sm:text-sm text-stone-600 shadow-sm">
        💡 {currentHint}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 z-20 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-300 touch-manipulation"
          aria-label="キーボード入力に戻る"
        >
          戻る
        </button>
      )}

      {/* キャンバス領域（画面いっぱい） */}
      <div className="flex-1 min-h-0 relative">
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            className: "w-full h-full touch-none",
            style: { touchAction: "none" },
          }}
          minWidth={4}
          maxWidth={9}
          penColor="black"
          velocityFilterWeight={0.7}
          throttle={16}
          backgroundColor="rgb(255, 255, 255)"
        />
      </div>

      {/* 操作ボタン（下部） */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6 bg-white border-t border-stone-200 shrink-0 safe-area-pb">
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
