# AI句会ワークショップ デザインシステム・ガイドライン

本ドキュメントは、アプリのデザイン一貫性を保ち、Figma Make やデザインツールへのインプットとして活用するための設計仕様書です。

---

## 1. デザインコンセプト

### 1.1 全体のテーマ

- **モダン・わびさび**: 和の佇まいを保ちながら、クリーンで現代的な UI を目指す。
- **温かみ**: 俳句や季語という日本文化に寄り添い、柔らかい色調と丸みを帯びた形状で親しみやすさを表現する。
- **信頼感**: シニア世代が安心して使える、落ち着いた配色と明確な操作性を重視する。

### 1.2 ターゲットユーザーへの配慮（アクセシビリティ方針）

- **シニア層を主な対象**とするため、以下を徹底する。
  - 文字サイズ: 本文 16px 以上、見出し 20px 以上を推奨。
  - タッチターゲット: 最低 44×44px、推奨 48×48px。
  - コントラスト: 文字と背景のコントラスト比を十分に確保（WCAG AA 以上）。
  - タップ時の青い枠を非表示（`-webkit-tap-highlight-color: transparent`）し、視覚ノイズを軽減。
  - `touch-manipulation` によるスクロールとタップの競合を防止。

---

## 2. カラーパレット（Color Palette）

### 2.1 ベースカラー

| 用途 | 名称 | Hex | Tailwind | 説明 |
|------|------|-----|----------|------|
| 背景（ライト） | Background | `#ffffff` | white | メイン背景 |
| 背景（グラデーション） | Page Gradient | `#f5f5f4` → `#fef3c7` | stone-100 → amber-50 | アプリ全体の背景 |
| 前景（テキスト） | Foreground | `#171717` | stone-950 | デフォルト文字色 |
| カード背景 | Card Background | `#fafaf9` | stone-50 | 白に近いクリーム系 |
| ボーダー | Border | `#e7e5e4` | stone-200 | カード・入力枠の境界 |

### 2.2 セマンティックカラー

| 用途 | 名称 | Hex | Tailwind | 使用例 |
|------|------|-----|----------|--------|
| Primary | メインアクション | `#292524` | stone-800 | メインボタン、「座を立てる」「みんなに送る」 |
| Primary Hover | メインアクション・ホバー | `#44403c` | stone-700 | ホバー時 |
| Secondary | サブアクション | `#292524` (枠) | border-stone-800 | アウトラインボタン |
| Accent（温かみ） | アクセント | `#fef3c7` / `#fde68a` | amber-100 / amber-200 | 季語選択、ヒントバナー、ナッジ |
| Accent（強調） | ハイライト | `#d97706` / `#b45309` | amber-600 / amber-700 | 俳画ボタン、季節タブ（秋） |
| Success | 成功・完了 | `#16a34a` / `#15803d` | green-600 / green-700 | 「これで決める」ボタン |
| Destructive | 破棄・消去 | `#fee2e2` / `#dc2626` | red-100 / red-800 | 「書き直す（消去）」ボタン |
| Tertiary | 第三の選択肢 | `#2563eb` / `#1d4ed8` | blue-600 / blue-700 | 「句の履歴・ギャラリー」リンク |

### 2.3 テキスト階層

| 用途 | Hex | Tailwind | 使用例 |
|------|-----|----------|--------|
| 見出し・強調 | `#292524` | stone-800 | タイトル、ラベル |
| 本文 | `#44403c` | stone-700 | 説明文 |
| 補助テキスト | `#57534e` | stone-600 | サブラベル |
| 弱いテキスト | `#78716c` | stone-500 | 日付、プレースホルダー |
| 入力テキスト | `#1c1917` | stone-900 | input / textarea の値 |
| プレースホルダー | `#78716c` | stone-500 | placeholder |

### 2.4 季節タブ（季語辞典）

| 季節 | Hex | Tailwind |
|------|-----|----------|
| 春 | `#ec4899` | pink-500 |
| 夏 | `#22c55e` | green-500 |
| 秋 | `#f97316` | orange-500 |
| 冬 | `#3b82f6` | blue-500 |

---

## 3. タイポグラフィ（Typography）

### 3.1 フォント設定

| フォント | 用途 | ウェイト | フォールバック |
|----------|------|----------|----------------|
| **Kaisei Opti** | 俳句本文、ポラロイド、キャプション | 400, 500, 700 | Yu Mincho, Hiragino Mincho ProN, serif |
| **Geist Sans** | UI 全般（変数として登録） | variable | — |
| **Geist Mono** | コード・デバッグ表示 | variable | — |
| **Arial, Helvetica** | body のデフォルト（globals.css） | — | sans-serif |

### 3.2 フォントサイズ・行間ルール（シニア向け）

| 要素 | サイズ | 行間 | ウェイト | 使用例 |
|------|--------|------|----------|--------|
| ページタイトル | 24–30px | 1.2 | bold (700) | 「AI句会ワークショップ」 |
| セクション見出し | 20–24px | 1.3 | bold (700) | 「座を立てました」「季語辞典」 |
| 本文 | 16–18px | 1.6–1.7 | normal (400) / semibold (500) | 説明文、俳句表示 |
| ボタン | 16–20px | 1.2 | semibold (600) / bold (700) | すべてのボタン |
| 入力フィールド | 18–20px | 1.5 | normal | input, textarea |
| 補助テキスト | 14–16px | 1.5 | normal | 日付、キャプション |
| ポラロイド俳句 | 16px | 1.7 | Kaisei Opti | 印刷用俳句 |
| ポラロイド日付 | 10.4px | 1 | normal | 印刷用日付 |

---

## 4. レイアウト・スペーシング（Layout & Spacing）

### 4.1 基本余白ルール

| 用途 | 値 | Tailwind | 説明 |
|------|-----|----------|------|
| ページ内余白 | 8–16px | p-2, p-4 | モバイル: 8px、デスクトップ: 16px |
| カード内余白 | 16–32px | p-4, p-6, p-8 | sm: 24px、lg: 32px |
| 要素間余白（小） | 12–16px | gap-3, gap-4 | ボタン間、チップ間 |
| 要素間余白（中） | 20–24px | space-y-5, space-y-6 | セクション間 |
| 要素間余白（大） | 24–32px | space-y-6, space-y-8 | ブロック間 |

### 4.2 角丸

| 用途 | 値 | Tailwind |
|------|-----|----------|
| 小（入力、チップ） | 8px | rounded-lg |
| 中（ボタン、カード） | 12px | rounded-xl |
| 大（メインカード） | 16px | rounded-2xl |
| 円形（閉じるボタン等） | 50% | rounded-full |

### 4.3 タッチターゲット

- **最小サイズ**: 44×44px（`min-h-[44px] min-w-[44px]`）
- **推奨サイズ**: 48×48px 以上
- **ボタン高さ**: 56px（`h-14`）を推奨（指書き画面の「書き直す」「これで決める」など）
- **フッター高さ**: 88px（`min-h-[88px]`）で下部ボタン領域を確保

### 4.4 ウィザード・レイアウト

- コンテンツ最大幅: `max-w-2xl`（672px）
- 中央揃え: `flex flex-col items-center justify-center`
- ステップインジケータ: 横並びの棒グラフ風（`h-2 flex-1 rounded-full`）

---

## 5. UIコンポーネント・パターン

### 5.1 ボタン

| 種類 | 形状 | 背景 | テキスト | ホバー | その他 |
|------|------|------|----------|--------|--------|
| **Primary** | 角丸（12px） | stone-800 | white | stone-700 | メインアクション |
| **Secondary（Outline）** | 角丸（12px） | transparent | stone-800 | stone-100 | border-2 stone-800 |
| **Tertiary（Link）** | 角丸（12px） | transparent | blue-700 | blue-50 | border-2 blue-600 |
| **Accent（Amber）** | 角丸（12px） | amber-100 / amber-500 | amber-800 / white | amber-200 / amber-600 | 季語選択、俳画 |
| **Success** | 角丸（16px） | green-600 | white | green-700 | 「これで決める」 |
| **Destructive** | 角丸（16px） | red-100 | red-800 | red-200 | 「書き直す」 |
| **Ghost（閉じる）** | 円形 | transparent | stone-500 | stone-200 | 40×40px 以上 |

**共通**: `transition-colors`、`disabled:opacity-50 disabled:cursor-not-allowed`、`touch-manipulation`（タッチデバイス向け）

### 5.2 カード

- **背景**: `bg-white/80 backdrop-blur` または `bg-white`
- **ボーダー**: `border border-stone-200`
- **影**: `shadow-lg`（`0 4px 12px rgba(0,0,0,0.15)` 相当）
- **角丸**: `rounded-xl` または `rounded-2xl`
- **パディング**: `p-4 sm:p-6 lg:p-8`

### 5.3 ポラロイドカード

- **アスペクト比**: 89 / 127（L判）
- **背景**: `#fafaf9`（polaroid-bg）
- **ボーダー**: 8px solid white、外側に `0 0 0 1px #e7e5e4`
- **写真エリア**: 正方形（aspect-ratio: 1）、角丸 2px
- **影**: 画面表示時 `box-shadow: 0 4px 12px rgba(0,0,0,0.15)`、印刷時 none
- **落款（指書き）**: 右下配置、幅・高さ 25%、max 60px、min 32px、`mix-blend-mode: multiply`、`opacity: 0.9`、`transform: rotate(-5deg)`

### 5.4 デジタル半紙（指書きキャンバス）

- **筆致**: `minWidth: 4`、`maxWidth: 9`、`penColor: black`
- **ベロシティ**: `velocityFilterWeight: 0.7`（筆圧の滑らかさ）
- **スロットル**: `16`（約 60fps に制限）
- **背景**: `rgb(255, 255, 255)`、グリッド線は `stone-300/60` で横線 2 本（五・七・五の区切り）
- **ヘッダー**: `bg-amber-50/95`、`border-b border-amber-200/80`
- **フッター**: `min-h-[88px]`、`border-t border-stone-200`

### 5.5 モーダル

- **オーバーレイ**: `bg-black/50` または `bg-black/70 backdrop-blur-sm`
- **コンテンツ**: `bg-white rounded-2xl border border-stone-200 shadow-xl`
- **最大高さ**: `max-h-[85vh]` または `max-h-[90dvh]`
- **閉じるボタン**: 右上、`w-12 h-12`、`rounded-full`

### 5.6 入力フィールド

- **ボーダー**: `border border-stone-300`
- **フォーカス**: `focus:ring-2 focus:ring-stone-400`
- **プレースホルダー**: `stone-500`
- **テキスト色**: `stone-900`（視認性確保）

---

## 6. 印刷・物理メディアの仕様

### 6.1 L判写真用紙（Epson EP 89×127mm）

- **@page**: `size: 89mm 127mm; margin: 0;`
- **印刷時**: アプリ UI を非表示、`polaroid-print-root` のみ表示
- **カラー**: `color-adjust: exact`、`print-color-adjust: exact`
- **ポラロイド**: `box-shadow: none`、`border: 6px solid white`

### 6.2 アニメーション

| 名前 | 用途 |  keyframes |
|------|------|------------|
| fadeIn | 画面遷移 | opacity 0→1、translateY 10px→0 |
| slideIn | 横スライド | opacity 0→1、translateX -20px→0 |
| nudgeFadeIn | ナッジ表示 | opacity 0→1、translateY -10px→0 |
| nudgeBreathe | ナッジ揺れ | 3秒ごとに translateY -2px scale 1.01 |

---

## 7. Design System Prompt Snippet（Figma Make 用）

以下を Figma Make などの AI デザインツールにコピペして使用できます。

```
【AI句会ワークショップ - デザインシステム】

コンセプト: 俳句アプリ。シニア向け。温かみ・わびさび・信頼感。和モダン。

カラー:
- Primary: #292524 (墨色、ボタン)
- Background: #f5f5f4 → #fef3c7 の縦グラデーション
- Card: #ffffff 80% opacity + backdrop blur
- Accent: #fef3c7, #fde68a (amber-100, amber-200)
- Success: #16a34a
- Destructive: #fee2e2 + #dc2626
- Border: #e7e5e4
- Text: #292524 (見出し), #44403c (本文), #78716c (補助)

タイポグラフィ:
- 見出し: 24-30px, bold
- 本文: 16-18px, line-height 1.6
- ボタン: 16-20px, semibold
- 俳句用: Kaisei Opti（明朝体）

レイアウト:
- 角丸: 12px (xl), 16px (2xl)
- タッチ最小: 44×44px
- 余白: 16-32px
- max-width: 672px

ボタン:
- Primary: 背景 #292524, 角丸12px, ホバーで少し明るく
- Secondary: 枠線 #292524, 透明背景
- 成功: 緑 #16a34a
- 破棄: 赤薄め #fee2e2

カード:
- 白80%+blur, 角丸16px, 影あり, ボーダー #e7e5e4

ポラロイド:
- 89:127 アスペクト, 白枠8px, 影
- 写真は正方形, 俳句は明朝体
- 落款は右下, multiply blend
```

---

*本ガイドラインは、`app/globals.css`、`app/layout.tsx`、`components/` 内の実装に基づいて作成されています。*
