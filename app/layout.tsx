import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Kaisei_Opti } from "next/font/google";
import { getSeasonTheme } from "@/lib/themeUtils";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kaiseiOpti = Kaisei_Opti({
  variable: "--font-kaisei",
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "AI句会ワークショップ - ペアモード",
  description: "二人で座を組み、同じ季語で句を詠む。AIを活用した俳句ワークショップアプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seasonTheme = getSeasonTheme();
  return (
    <html lang="en" data-theme={seasonTheme}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kaiseiOpti.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
