"use client";

import { QRCodeSVG } from "qrcode.react";

/** 印刷表紙・共有用の公式URL */
export const PRINT_COVER_QR_URL = "https://haiku-pair-app.vercel.app/";

export type PrintCoverAudience = "host" | "guest";

export type PrintCoverPageProps = {
  /** 大見出し（既定: AI句会ワークショップ 句会録） */
  documentTitle?: string;
  audience: PrintCoverAudience;
};

const defaultTitle = "AI句会ワークショップ 句会録";

const audienceCopy: Record<
  PrintCoverAudience,
  { line: string; sub: string }
> = {
  host: {
    line: "ホスト（座を立てる）向け",
    sub: "合言葉や QR でお相手をお迎えし、句会の場をひらくためのガイドです。",
  },
  guest: {
    line: "ゲスト（座に参加）向け",
    sub: "お誘いの番号や QR から座に入り、句会に参加するためのガイドです。",
  },
};

/**
 * 「座を立てる」「座に参加」画面のヘルプ「全部まとめて印刷」の 1 ページ目。
 * 親で `help-wizard-print-cover` を付与し、印刷は本編と同じ A4 横・@media print で改ページする。
 */
export function PrintCoverPage({
  documentTitle = defaultTitle,
  audience,
}: PrintCoverPageProps) {
  const { line, sub } = audienceCopy[audience];

  return (
    <div className="help-wizard-print-cover-inner">
      <div className="help-wizard-print-cover-frame flex flex-col min-h-[70vh] sm:min-h-[72vh] md:flex-row md:items-center md:justify-between md:gap-10 md:min-h-[50vh]">
        <div className="help-wizard-print-cover-main min-w-0 flex-1">
          <p className="help-wizard-print-cover-kicker text-center md:text-left text-sm font-medium tracking-widest text-amber-800/90 uppercase">
            Workshop Record
          </p>
          <h1 className="help-wizard-print-cover-title text-center md:text-left font-kaisei text-2xl sm:text-3xl font-bold text-stone-900 leading-snug mt-3 mb-6">
            {documentTitle}
          </h1>

          <p className="help-wizard-print-cover-role text-center md:text-left font-kaisei text-xl sm:text-2xl text-stone-800 leading-relaxed px-2 md:px-0">
            {line}
          </p>
          <p className="help-wizard-print-cover-sub mt-4 mx-auto md:mx-0 max-w-md md:max-w-none text-center md:text-left text-sm sm:text-base text-stone-600 leading-relaxed px-2 md:px-0">
            {sub}
          </p>
        </div>

        <div className="help-wizard-print-cover-qr mt-auto md:mt-0 pt-12 md:pt-0 flex flex-col items-center shrink-0">
          <div className="help-wizard-print-cover-qr-box bg-white p-3 rounded-lg border border-stone-200 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <QRCodeSVG
              value={PRINT_COVER_QR_URL}
              size={112}
              level="M"
              includeMargin={false}
              className="help-wizard-print-cover-qr-svg"
            />
          </div>
          <p className="mt-4 text-center text-sm text-stone-600 leading-relaxed max-w-xs font-kaisei">
            スマホをかざして、あなたも一句詠んでみませんか？
          </p>
        </div>
      </div>
    </div>
  );
}
