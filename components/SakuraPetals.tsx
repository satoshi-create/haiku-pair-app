"use client";

import { useMemo, type CSSProperties } from "react";

const PETAL_COUNT = 7;

/** 決定的な 0〜1（SSR/CSR で同じ値・hydration ずれ防止） */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function PetalSvg({ sizePx }: { sizePx: number }) {
  return (
    <svg
      width={sizePx}
      height={sizePx * 1.15}
      viewBox="0 0 20 24"
      fill="currentColor"
      className="block"
      aria-hidden
    >
      <ellipse cx="10" cy="13" rx="5.5" ry="9.5" opacity={0.92} />
    </svg>
  );
}

/**
 * 桜テーマ時のみ表示。最背面・pointer-events なし。
 * アニメーションは globals.css の `sakura-petal-fall`（15〜25s）。
 */
export default function SakuraPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, i) => {
        const s = i + 1;
        const swayA = -22 + seededUnit(s * 1.91) * 44;
        const swayB = -26 + seededUnit(s * 2.73) * 52;
        return {
          id: i,
          leftPct: 2 + seededUnit(s * 1.13) * 96,
          durationSec: 15 + seededUnit(s * 2.17) * 10,
          delaySec: -seededUnit(s * 3.41) * 24,
          swayApx: `${swayA.toFixed(1)}px`,
          swayBpx: `${swayB.toFixed(1)}px`,
          rotStartDeg: seededUnit(s * 4.59) * 360,
          sizePx: Math.round(11 + seededUnit(s * 5.67) * 9),
        };
      }),
    [],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {petals.map((p) => (
        <span
          key={p.id}
          className="sakura-petal-item"
          style={
            {
              left: `${p.leftPct}%`,
              animationDuration: `${p.durationSec.toFixed(2)}s`,
              animationDelay: `${p.delaySec.toFixed(2)}s`,
              "--sakura-sway-a": p.swayApx,
              "--sakura-sway-b": p.swayBpx,
              "--sakura-rot-start": `${p.rotStartDeg.toFixed(1)}deg`,
            } as CSSProperties
          }
        >
          <PetalSvg sizePx={p.sizePx} />
        </span>
      ))}
    </div>
  );
}
