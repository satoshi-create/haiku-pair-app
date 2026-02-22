# システムアーキテクチャ

## 概要

このドキュメントでは、AI句会ワークショップアプリケーションの技術的実装詳細、アーキテクチャパターン、データフロー、API設計について解説します。

---

## システム構成図

### ハイレベルアーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Client)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │          React Application (TypeScript)          │  │
│  │  ┌─────────────┐  ┌──────────────────────────┐  │  │
│  │  │ Pair Mode   │  │ Group Mode               │  │  │
│  │  │ Components  │  │ Components               │  │  │
│  │  └─────────────┘  └──────────────────────────┘  │  │
│  │                                                  │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │    Shared Components & Utilities         │   │  │
│  │  │  - Kigo Dictionary                       │   │  │
│  │  │  - Haiku Validation                      │   │  │
│  │  │  - API Client                            │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────┐
│                   AI Services (External)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Anthropic Claude API                  │  │
│  │  - Text Generation (Haiku Suggestions)           │  │
│  │  - Text Analysis (Proofreading)                  │  │
│  │  - Image Generation (Haiga, Group Photo)         │  │
│  │  - Commentary Generation                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  Data Storage (Client-side)             │
│  - localStorage: Session data, User preferences         │
│  - In-memory State: Active session state                │
└─────────────────────────────────────────────────────────┘
```

---

## フロントエンド設計

### 技術スタック

```json
{
  "framework": "React 18",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "icons": "Lucide React",
  "stateManagement": "React Hooks (useState, useReducer)",
  "routing": "React Router (if multi-page)",
  "buildTool": "Vite / Create React App"
}
```

### ディレクトリ構造

```
src/
├── components/
│   ├── common/               # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   ├── pair/                 # ペアモード専用
│   │   ├── PairSession.tsx
│   │   ├── KigoSelector.tsx
│   │   ├── HaikuComposer.tsx
│   │   ├── HaigaDisplay.tsx
│   │   └── VotingInterface.tsx
│   └── group/                # グループモード専用
│       ├── FacilitatorDashboard.tsx
│       ├── ParticipantView.tsx
│       ├── VotingPhase.tsx
│       ├── StatisticsDisplay.tsx
│       └── ReportGenerator.tsx
├── hooks/                    # カスタムフック
│   ├── useHaikuValidation.ts
│   ├── useAIService.ts
│   └── useSessionState.ts
├── services/                 # API・ビジネスロジック
│   ├── claudeAPI.ts
│   ├── kigoService.ts
│   └── reportService.ts
├── types/                    # TypeScript型定義
│   ├── haiku.ts
│   ├── session.ts
│   └── user.ts
├── utils/                    # ユーティリティ関数
│   ├── haikuUtils.ts         # 音数カウントなど
│   ├── formatters.ts
│   └── validators.ts
├── data/                     # 静的データ
│   └── kigoDatabase.ts       # 季語データベース
└── App.tsx                   # ルートコンポーネント
```

---

## 状態管理

### ペアモード状態

```typescript
// types/session.ts
interface PairModeState {
  // セッション情報
  sessionId: string;
  createdAt: Date;
  
  // 参加者
  participants: {
    playerA: {
      id: string;
      name: string;
      connected: boolean;
    };
    playerB: {
      id: string;
      name: string;
      connected: boolean;
    };
  };
  
  // 現在のフェーズ
  currentPhase: 'kigo_selection' | 'composition' | 'haiga' | 'voting' | 'results';
  
  // 季語
  selectedKigo: {
    season: string;
    word: string;
    description: string;
    examples: string[];
  } | null;
  
  // 俳句
  haikus: {
    playerA: {
      text: string;
      syllables: [number, number, number]; // 5-7-5
      completed: boolean;
    };
    playerB: {
      text: string;
      syllables: [number, number, number];
      completed: boolean;
    };
  };
  
  // 俳画
  haigaUrls: {
    playerA: string | null;
    playerB: string | null;
  };
  
  // 投票
  votes: {
    playerA: number;
    playerB: number;
  };
  
  // AI支援履歴
  aiInteractions: Array<{
    type: 'suggestion' | 'proofread' | 'haiga';
    timestamp: Date;
    player: 'A' | 'B';
    response: any;
  }>;
}
```

### グループモード状態

```typescript
// types/session.ts
interface GroupModeState {
  // セッション基本情報
  session: {
    id: string;
    name: string;
    facilitatorId: string;
    facilitatorName: string;
    accessCode: string;
    createdAt: Date;
    startedAt: Date | null;
    endedAt: Date | null;
  };
  
  // 季語設定
  kigo: {
    season: string;
    word: string;
    description: string;
    category: string;
  };
  
  // 時間設定
  timeSettings: {
    compositionMinutes: number;
    votingMinutes: number;
  };
  
  // 現在のフェーズ
  phase: 'waiting' | 'composing' | 'voting' | 'results' | 'ended';
  phaseStartTime: Date | null;
  
  // 参加者リスト
  participants: Array<{
    id: string;
    name: string;
    joinedAt: Date;
    isActive: boolean;
    badges: string[];
  }>;
  
  // 俳句作品
  haikus: Array<{
    id: string;
    authorId: string;
    authorName: string;
    text: string;
    syllables: [number, number, number];
    submittedAt: Date;
    votes: number;
    voters: string[]; // participant IDs
  }>;
  
  // 投票状況
  votingStatus: {
    totalVotes: number;
    participantsVoted: string[]; // participant IDs
    participantsNotVoted: string[];
  };
  
  // 集合写真
  collectivePhoto: {
    url: string | null;
    generatedAt: Date | null;
  };
  
  // AI講評
  aiCommentary: {
    text: string | null;
    generatedAt: Date | null;
  };
  
  // 統計データ
  statistics: {
    totalParticipants: number;
    totalHaikus: number;
    totalVotes: number;
    averageVotesPerHaiku: number;
    participationRate: number; // %
    topHaikus: Array<{
      haikuId: string;
      votes: number;
    }>;
  };
  
  // 連歌（オプション機能）
  renga: {
    active: boolean;
    verses: Array<{
      order: number;
      authorId: string;
      text: string;
      type: '5-7-5' | '7-7';
    }>;
  } | null;
}
```

### 状態管理パターン

```typescript
// hooks/useSessionState.ts
import { useReducer, useCallback } from 'react';

type Action =
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'SUBMIT_HAIKU'; payload: { participantId: string; haiku: Haiku } }
  | { type: 'CAST_VOTE'; payload: { voterId: string; haikuId: string } }
  | { type: 'SET_COLLECTIVE_PHOTO'; payload: string }
  | { type: 'SET_AI_COMMENTARY'; payload: string };

function sessionReducer(state: GroupModeState, action: Action): GroupModeState {
  switch (action.type) {
    case 'SET_PHASE':
      return {
        ...state,
        phase: action.payload,
        phaseStartTime: new Date(),
      };
    
    case 'ADD_PARTICIPANT':
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };
    
    case 'SUBMIT_HAIKU':
      return {
        ...state,
        haikus: [
          ...state.haikus,
          {
            id: generateId(),
            ...action.payload.haiku,
            authorId: action.payload.participantId,
            votes: 0,
            voters: [],
          },
        ],
      };
    
    case 'CAST_VOTE':
      return {
        ...state,
        haikus: state.haikus.map(h =>
          h.id === action.payload.haikuId
            ? { ...h, votes: h.votes + 1, voters: [...h.voters, action.payload.voterId] }
            : h
        ),
        votingStatus: {
          ...state.votingStatus,
          totalVotes: state.votingStatus.totalVotes + 1,
          participantsVoted: [...state.votingStatus.participantsVoted, action.payload.voterId],
        },
      };
    
    // ... その他のアクション
    
    default:
      return state;
  }
}

export function useSessionState(initialState: GroupModeState) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  
  const setPhase = useCallback((phase: Phase) => {
    dispatch({ type: 'SET_PHASE', payload: phase });
  }, []);
  
  const addParticipant = useCallback((participant: Participant) => {
    dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
  }, []);
  
  // ... その他のアクション関数
  
  return { state, setPhase, addParticipant, /* ... */ };
}
```

---

## AI統合（Claude API）

### API クライアント設計

```typescript
// services/claudeAPI.ts
class ClaudeAPIClient {
  private apiKey: string;
  private baseURL = 'https://api.anthropic.com/v1/messages';
  private model = 'claude-sonnet-4-5-20250929';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 俳句提案を生成
   */
  async generateHaikuSuggestions(kigo: string, count: number = 3): Promise<string[]> {
    const prompt = `
あなたは経験豊富な俳句講師です。
季語「${kigo}」を使った俳句を${count}句提案してください。

要件:
- 五七五の形式を厳守
- 初心者でも理解しやすい表現
- 季語の本質を捉えた句
- それぞれ異なる視点や情景

回答は俳句のみを改行区切りで出力してください。説明は不要です。
    `.trim();

    const response = await this.callAPI(prompt);
    return this.parseHaikusFromResponse(response);
  }

  /**
   * 推敲支援
   */
  async proofreadHaiku(haiku: string, kigo: string): Promise<ProofreadResult> {
    const prompt = `
あなたは経験豊富な俳句講師です。
以下の俳句を添削してください。

俳句: ${haiku}
季語: ${kigo}

以下の観点で評価してください:
1. 良い点（2-3点）
2. 改善提案（具体的に）
3. 改善例（1-2句）

温かく励ましの気持ちを込めて、200字程度でお願いします。
JSON形式で回答してください:
{
  "goodPoints": ["...", "..."],
  "improvements": ["...", "..."],
  "examples": ["...", "..."]
}
    `.trim();

    const response = await this.callAPI(prompt);
    return JSON.parse(response);
  }

  /**
   * 俳画生成
   */
  async generateHaiga(haiku: string, kigo: string): Promise<string> {
    const imagePrompt = `
Create a traditional Japanese haiga (俳画) style illustration for this haiku:

"${haiku}"

Key seasonal word (kigo): ${kigo}

Style requirements:
- Traditional sumi-e (ink wash painting) aesthetic
- Minimalist composition with simple brush strokes
- Capture the essence and mood of the haiku
- Focus on elements related to the kigo
- Subtle use of color (mostly monochrome with accent colors)
- Leave negative space for contemplation

The image should evoke the same feeling as the haiku without being literal.
    `.trim();

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: imagePrompt,
        }],
      }),
    });

    const data = await response.json();
    // 画像URLを抽出（実装詳細は省略）
    return extractImageURL(data);
  }

  /**
   * 集合写真生成（グループモード）
   */
  async generateCollectivePhoto(
    haikus: string[],
    kigo: string,
    participantCount: number
  ): Promise<string> {
    const imagePrompt = `
Create a traditional Japanese landscape painting (sumi-e style) that captures 
the collective spirit of these ${participantCount} haikus about "${kigo}":

${haikus.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Style requirements:
- Ink wash painting with subtle watercolor accents
- Harmonious composition representing multiple voices
- Elements that reflect common themes across the haikus
- Seasonal atmosphere appropriate for ${kigo}
- Balanced, peaceful, and contemplative mood

Create a unified landscape that honors all these poetic expressions.
    `.trim();

    // 実装は generateHaiga と同様
    return this.generateImage(imagePrompt);
  }

  /**
   * AI講評生成（グループモード）
   */
  async generateCommentary(
    rankedHaikus: Array<{ text: string; votes: number; author: string }>,
    kigo: string,
    participantProfile: string
  ): Promise<string> {
    const prompt = `
あなたは経験豊富な俳句講師です。
${participantProfile}のワークショップの講評をお願いします。

季語: ${kigo}
作品数: ${rankedHaikus.length}句

上位作品:
${rankedHaikus.slice(0, 5).map((h, i) => 
  `${i + 1}位 (${h.votes}票): ${h.text}`
).join('\n')}

以下の内容を含む講評を300字程度で述べてください:
1. 全体的な傾向と特徴
2. 優秀作品の鑑賞ポイント（具体的に）
3. 今後の学習アドバイス
4. 次回への励まし

温かく、前向きなトーンでお願いします。
    `.trim();

    return await this.callAPI(prompt);
  }

  /**
   * 連歌の繋がりチェック
   */
  async checkRengaConnection(
    previousVerses: string[],
    newVerse: string
  ): Promise<{ appropriate: boolean; feedback: string }> {
    const prompt = `
あなたは連歌の専門家です。
以下の連歌の流れに、新しい句が適切に繋がっているか評価してください。

これまでの句:
${previousVerses.map((v, i) => `${i + 1}. ${v}`).join('\n')}

新しい句:
${newVerse}

評価ポイント:
- 前の句との関連性（付け）
- 季節の重複回避
- 転換の適切さ

JSON形式で回答:
{
  "appropriate": true/false,
  "feedback": "具体的なフィードバック"
}
    `.trim();

    const response = await this.callAPI(prompt);
    return JSON.parse(response);
  }

  /**
   * 基本的なAPI呼び出し
   */
  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * レスポンスから俳句を抽出
   */
  private parseHaikusFromResponse(response: string): string[] {
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.startsWith('#') && !line.startsWith('//'))
      .slice(0, 3); // 最大3句
  }
}

// シングルトンインスタンス
export const claudeAPI = new ClaudeAPIClient(process.env.ANTHROPIC_API_KEY!);
```

---

## ユーティリティ関数

### 俳句バリデーション

```typescript
// utils/haikuUtils.ts

/**
 * 音数をカウント（簡易版）
 */
export function countSyllables(text: string): number {
  // ひらがな・カタカナ: 1文字 = 1音
  // 漢字: 読み方によるため推定が必要（簡易実装では1文字=2音と仮定）
  // 促音（っ）、拗音（ゃゅょ）は前の文字と合わせて1音
  
  let count = 0;
  const chars = text.split('');
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];
    
    // 促音・拗音はスキップ（前の文字とセット）
    if (char === 'っ' || char === 'ゃ' || char === 'ゅ' || char === 'ょ') {
      continue;
    }
    
    // 次が促音・拗音の場合も1音
    if (nextChar && (nextChar === 'っ' || nextChar === 'ゃ' || nextChar === 'ゅ' || nextChar === 'ょ')) {
      count += 1;
      i++; // 次の文字をスキップ
      continue;
    }
    
    // ひらがな・カタカナ
    if (/[ぁ-ん]/.test(char) || /[ァ-ヴ]/.test(char)) {
      count += 1;
    }
    // 漢字（簡易的に2音と仮定）
    else if (/[一-龯]/.test(char)) {
      count += 2;
    }
  }
  
  return count;
}

/**
 * 俳句の形式チェック（5-7-5）
 */
export function validateHaikuStructure(lines: [string, string, string]): {
  valid: boolean;
  syllables: [number, number, number];
  errors: string[];
} {
  const syllables: [number, number, number] = [
    countSyllables(lines[0]),
    countSyllables(lines[1]),
    countSyllables(lines[2]),
  ];
  
  const errors: string[] = [];
  
  if (syllables[0] !== 5) {
    errors.push(`上五が${syllables[0]}音です（5音必要）`);
  }
  if (syllables[1] !== 7) {
    errors.push(`中七が${syllables[1]}音です（7音必要）`);
  }
  if (syllables[2] !== 5) {
    errors.push(`下五が${syllables[2]}音です（5音必要）`);
  }
  
  return {
    valid: errors.length === 0,
    syllables,
    errors,
  };
}

/**
 * 季語の存在チェック
 */
export function checkKigoPresence(haiku: string, kigo: string): boolean {
  return haiku.includes(kigo);
}
```

---

## データフロー

### ペアモード: 作句フロー

```
[User Input: 俳句入力]
        ↓
[countSyllables()] ← リアルタイム音数カウント
        ↓
[validateHaikuStructure()] ← 5-7-5チェック
        ↓
[User Action: 「推敲してもらう」]
        ↓
[claudeAPI.proofreadHaiku()] ← AI推敲支援
        ↓
[UI Update: フィードバック表示]
        ↓
[User Action: 「完成」]
        ↓
[State Update: haiku submitted]
```

### グループモード: ワークショップフロー

```
[Facilitator: セッション作成]
        ↓
[State: session initialized]
        ↓
[Participants: アクセスコード入力]
        ↓
[State: participants added]
        ↓
[Facilitator: 作句フェーズ開始]
        ↓
[Participants: 各自作句 + AI支援]
        ↓
[State: haikus submitted]
        ↓
[Facilitator: 投票フェーズ開始]
        ↓
[Participants: 投票]
        ↓
[State: votes counted]
        ↓
[Auto: 統計計算]
        ↓
[claudeAPI.generateCommentary()] ← AI講評生成
        ↓
[claudeAPI.generateCollectivePhoto()] ← 集合写真生成
        ↓
[State: results finalized]
        ↓
[UI: 結果表示]
        ↓
[Facilitator: レポート出力]
```

---

## パフォーマンス最適化

### API呼び出し最適化

```typescript
// バッチ処理で複数俳句を一度に推敲
async function batchProofread(haikus: Array<{ id: string; text: string }>) {
  const prompt = `
以下の俳句を一括で添削してください:
${haikus.map((h, i) => `${i + 1}. ${h.text}`).join('\n')}

各句について簡潔に良い点と改善点を述べてください。
  `;
  
  const response = await claudeAPI.callAPI(prompt);
  // レスポンスをパース...
}
```

### キャッシング

```typescript
// 季語データのメモ化
import { useMemo } from 'react';

function useKigoData() {
  const kigoData = useMemo(() => loadKigoDatabase(), []);
  return kigoData;
}
```

---

## セキュリティ考慮

### API キー管理

```typescript
// 環境変数から読み込み
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

// クライアントサイドでの直接使用は避け、
// 本番環境ではバックエンドプロキシを使用
```

### データプライバシー

- 個人情報の最小化
- ローカルストレージのみ使用（サーバー保存なし）
- セッション終了後のデータクリア機能

---

## アクセシビリティ実装

### ARIA属性

```tsx
// アクセシブルなボタン
<button
  aria-label="AIに俳句を提案してもらう"
  aria-describedby="ai-suggestion-help"
  onClick={handleAISuggestion}
>
  AI提案
</button>
<div id="ai-suggestion-help" className="sr-only">
  季語に合った俳句の例を3句表示します
</div>
```

### キーボードナビゲーション

```tsx
// フォーカス管理
useEffect(() => {
  if (phase === 'composition') {
    haikuInputRef.current?.focus();
  }
}, [phase]);
```

---

## 今後の技術的改善

### Phase 2
1. **バックエンド実装**: Node.js + Express で API プロキシ
2. **データベース**: Supabase でセッション永続化
3. **WebSocket**: リアルタイム同期（ペアモード）

### Phase 3
1. **PWA化**: オフライン対応
2. **パフォーマンス**: コード分割、遅延読み込み
3. **テスト**: Jest + React Testing Library

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-07  
**Related Documents**: 00_project_overview.md, 03_feature_matrix.md
