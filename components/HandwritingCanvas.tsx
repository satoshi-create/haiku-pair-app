"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

/** URL に ?handwritingDebug=1 があるとデバッグ表示を有効にする */
const DEBUG_PARAM = "handwritingDebug";

interface HandwritingCanvasProps {
  /** 現在選択中の季語（カンペ・ナッジに表示） */
  kigo?: string;
  onClear?: () => void;
  onComplete?: (dataUrl: string) => void;
  /** キャンバスを閉じてキーボード入力に戻る */
  onClose?: () => void;
  /** 補助者向けナッジ表示テキスト（複数、順にローテーション可）。季語を含む場合は {kigo} で埋め込み */
  nudgeHints?: string[];
}

/**
 * デジタル半紙（手書きエリア）。
 * 指書き・リハビリ支援向けに最適化。縦長タブレット向けの縦長ビューポート。
 */
export default function HandwritingCanvas({
  kigo = "",
  onClear,
  onComplete,
  onClose,
  nudgeHints,
}: HandwritingCanvasProps) {
  const searchParams = useSearchParams();
  const debug = searchParams.get(DEBUG_PARAM) === "1";
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [debugInfo, setDebugInfo] = useState<{
    viewport: { w: number; h: number };
    container: { w: number; h: number };
    aspectRatio: number;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      requestAnimationFrame(() => {
        const { width, height } = el.getBoundingClientRect();
        const w = Math.round(width);
        const h = Math.round(height);
        if (w > 0 && h > 0) {
          setCanvasSize({ width: w, height: h });
          if (debug && typeof window !== "undefined") {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const aspect = h > 0 ? w / h : 0;
            const info = {
              viewport: { w: vw, h: vh },
              container: { w, h },
              aspectRatio: Math.round(aspect * 100) / 100,
            };
            setDebugInfo(info);
            console.debug("[HandwritingCanvas]", {
              viewport: `${vw}×${vh}`,
              container: `${w}×${h}`,
              aspectRatio: aspect,
              isPortrait: h > w,
              expectedAspect: "0.75 (3:4)",
            });
          } else if (!debug) {
            setDebugInfo(null);
          }
        }
      });
    };

    const timeoutId = setTimeout(updateSize, 50);
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => {
      clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, [debug]);

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
      className="fixed inset-0 z-30 flex flex-col overflow-hidden bg-white"
      style={{
        touchAction: "none",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        maxHeight: "100svh",
        paddingBottom: "max(5.5rem, calc(88px + env(safe-area-inset-bottom)))",
      }}
    >
      {/* 1. ヘッダー（お題ボード）1.戻る 2.季語 3.ナッジ */}
      <header className="shrink-0 flex flex-col w-full bg-amber-50/95 border-b border-amber-200/80">
        {/* 最上部：戻るボタンのみ右寄せ */}
        {onClose && (
          <div className="flex justify-end px-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] min-w-[40px] px-2 py-1.5 rounded-lg bg-stone-200 text-stone-700 text-sm font-semibold hover:bg-stone-300 touch-manipulation"
              aria-label="キーボード入力に戻る"
            >
              戻る
            </button>
          </div>
        )}
        {/* 中央：季語 */}
        <p className="text-2xl sm:text-3xl font-bold text-stone-800 text-center px-4 py-2">
          {kigo?.trim() ? (
            <>
              季語：<span className="text-amber-800">{kigo}</span>
            </>
          ) : (
            "季語を決めてから書いてね"
          )}
        </p>
        {/* 季語の下：ナッジ（アニメーション付き） */}
        <div className="px-4 pb-3 pt-0">
          <p className="nudge-appear nudge-breathe text-sm text-stone-600 text-center">
            💡 {currentHint}
          </p>
        </div>
      </header>

      {/* 2. キャンバス（残り高さをすべて使用、横幅いっぱい） */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full overflow-hidden bg-white relative">
        {canvasSize.width > 0 && canvasSize.height > 0 ? (
          <>
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                width: canvasSize.width,
                height: canvasSize.height,
                className: "absolute inset-0 block touch-none",
                style: {
                  touchAction: "none",
                  display: "block",
                  border: "none",
                  outline: "none",
                },
              }}
              minWidth={4}
              maxWidth={9}
              penColor="black"
              velocityFilterWeight={0.7}
              throttle={16}
              backgroundColor="rgb(255, 255, 255)"
              clearOnResize={false}
            />
            <div
              className="absolute inset-0 pointer-events-none flex flex-col"
              aria-hidden
            >
              <div className="flex-1 min-h-0" />
              <div className="h-px shrink-0 bg-stone-300/60" />
              <div className="flex-1 min-h-0" />
              <div className="h-px shrink-0 bg-stone-300/60" />
              <div className="flex-1 min-h-0" />
            </div>
          </>
        ) : null}
      </div>

      {/* 3. フッター（ボタン）ビューポート下部に固定、タブレットでも常に表示 */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-2 w-full px-2 py-4 bg-white border-t border-stone-200 min-h-[88px]"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
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

      {/* デバッグオーバーレイ（?handwritingDebug=1 で表示） */}
      {debug && debugInfo && (
        <div
          className="fixed left-2 bottom-20 z-50 rounded-lg bg-black/80 px-3 py-2 font-mono text-xs text-green-400 shadow-lg"
          aria-live="polite"
        >
          <div>viewport: {debugInfo.viewport.w}×{debugInfo.viewport.h}</div>
          <div>container: {debugInfo.container.w}×{debugInfo.container.h}</div>
          <div>aspect: {debugInfo.aspectRatio} {debugInfo.container.h > debugInfo.container.w ? "(縦長✓)" : "(横長)"}</div>
          <div className="mt-1 text-amber-300 text-[10px]">?handwritingDebug=1</div>
        </div>
      )}
    </div>
  );
}
