import { NextRequest, NextResponse } from 'next/server';
import type { AITaskName, TaskConfig } from '@/lib/ai/types';

// --- Task handler map (strategy pattern) ---

type TaskHandler = (payload: Record<string, unknown>) => TaskConfig;

const taskHandlers: Record<AITaskName, TaskHandler> = {
  haiga: (payload) => {
    const { haiku, kigo } = payload as { haiku: string; kigo: string };
    return {
      systemPrompt: 'あなたは俳句の師匠です。',
      userContent: `以下の俳句に相応しい俳画（haiga）の情景を、簡潔に日本語で描写してください。

俳句：
${haiku}

季語：${kigo}

俳画の特徴：
- 墨絵のようなシンプルな構図
- 余白を活かした表現
- 季節感を大切に
- 写実的ではなく、印象的に

150文字以内で、どんな情景を描くべきか説明してください。`,
      maxTokens: 300,
      temperature: 0.8,
      responseMode: 'text',
    };
  },

  haiku: (payload) => {
    const { idea, kigo } = payload as { idea: string; kigo: string };
    return {
      systemPrompt:
        'あなたは俳句の師匠です。必ずJSONのみを出力してください。説明文やマークダウンは禁止です。',
      userContent: `以下のユーザーの句の断片やアイデアをもとに、季語「${kigo}」を使った俳句を3〜5句提案してください。

ユーザーの句・アイデア：
${idea}

以下のJSON形式のみで回答してください（他の文章は一切含めないでください）：
{
  "suggestions": [
    "俳句1",
    "俳句2",
    "俳句3"
  ]
}`,
      maxTokens: 500,
      temperature: 0.7,
      responseMode: 'json',
    };
  },

  analysis: (payload) => {
    const { image } = payload as {
      image: { data: string; mediaType: string };
    };
    return {
      systemPrompt:
        'あなたは俳句の師匠です。必ずJSONのみを出力してください。説明文やマークダウンは禁止です。',
      userContent: [
        {
          type: 'text',
          text: `この写真を見て、俳句を詠むためのヒントを提案してください。

追加要件：
- 花・木・草など植物が写っている場合は、できるだけ具体名を特定してください（例：ハナミズキ、ほととぎす、沈丁花）。
- 特定が難しい場合は、似ている植物名を候補として挙げてください。
- 植物に触れる場合は、その植物がどの季節の季語として扱われることがあるか、どんな情緒で詠まれてきたかを1文で添えてください。
- 全体の語り口は「やさしく教える案内役」にしてください（例：「これは〇〇という花ですね。俳句では〇〇という季語として使われることがありますよ。」）。

以下のJSON形式で回答してください：
{
  "season": "春/夏/秋/冬のいずれか",
  "kigo_suggestions": ["季語1", "季語2", "季語3"],
  "scene_description": "この写真の情景を簡潔に説明",
  "haiku_hints": ["俳句のヒント1", "俳句のヒント2", "俳句のヒント3"],
  "identified_plants": ["植物名1", "植物名2"],
  "plant_confidence": "high/medium/low",
  "plant_kigo_note": "植物名・季語・情緒をやさしく案内する1文"
}

注意：
- JSON以外の文章は出力しないでください。
- 植物が見当たらない場合は "identified_plants": [] とし、"plant_confidence": "low"、"plant_kigo_note": "" を返してください。`,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${image.mediaType};base64,${image.data}`,
          },
        },
      ],
      maxTokens: 500,
      temperature: 0.5,
      responseMode: 'json',
    };
  },

  handwriting: (payload) => {
    const { image } = payload as {
      image: { data: string; mediaType: string };
    };
    return {
      systemPrompt:
        'あなたは手書き日本語の読み取りに熟練しています。横書き3行で書かれた俳句（5・7・5）を、正確にテキストに変換してください。',
      userContent: [
        {
          type: 'text',
          text: `この画像には、横書き3行で書かれた俳句（5・7・5の形式）が手書きで含まれています。上から順に1行目・2行目・3行目を読み取り、そのままテキストで出力してください。
- 改行はそのまま維持（3行のまま）
- 句読点・スペースも正確に
- 読み取れない文字は「？」で代替
- 俳句以外の余分な記述は含めない`,
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${image.mediaType};base64,${image.data}`,
          },
        },
      ],
      maxTokens: 200,
      temperature: 0.1,
      responseMode: 'text',
    };
  },

  kigo: (payload) => {
    const { theme, season } = payload as { theme: string; season?: string };
    const seasonConstraint = season
      ? `季節は「${season}」に限定してください。`
      : '';
    return {
      systemPrompt:
        'あなたは俳句の師匠です。必ずJSONのみを出力してください。説明文やマークダウンは禁止です。',
      userContent: `テーマ「${theme}」に関連する季語を5つ提案してください。${seasonConstraint}

以下のJSON形式のみで回答してください：
{
  "season": "春/夏/秋/冬のいずれか（最も関連の深い季節）",
  "kigo_suggestions": ["季語1", "季語2", "季語3", "季語4", "季語5"],
  "explanations": ["季語1の説明", "季語2の説明", "季語3の説明", "季語4の説明", "季語5の説明"]
}`,
      maxTokens: 500,
      temperature: 0.6,
      responseMode: 'json',
    };
  },
};

// --- Safe JSON parse (3-tier) ---

function safeParseJSON(text: string): unknown {
  // 1. Direct parse
  try {
    return JSON.parse(text);
  } catch {
    /* continue */
  }

  // 2. Strip markdown code fences
  const stripped = text
    .replace(/```(?:json)?\s*/g, '')
    .replace(/```\s*$/g, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    /* continue */
  }

  // 3. Extract first JSON object
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }

  throw new Error('No valid JSON found in response');
}

// --- Provider call (OpenAI) ---

async function callProvider(
  apiKey: string,
  config: TaskConfig,
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: config.userContent },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || `Provider error: ${response.status}`,
    );
  }

  return data.choices?.[0]?.message?.content || '';
}

// --- POST handler ---

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { task, payload } = body as {
      task: string;
      payload: Record<string, unknown>;
    };

    const handler = taskHandlers[task as AITaskName];
    if (!handler) {
      return NextResponse.json(
        {
          error: `Unknown task: ${task}. Valid tasks: ${Object.keys(taskHandlers).join(', ')}`,
        },
        { status: 400 },
      );
    }

    const config = handler(payload);
    const rawText = await callProvider(apiKey, config);

    // JSON mode: parse server-side and return structured data
    if (config.responseMode === 'json') {
      try {
        const parsed = safeParseJSON(rawText);
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json(
          { error: 'AI returned invalid JSON' },
          { status: 502 },
        );
      }
    }

    // Text mode: wrap in task-specific response shape
    if (task === 'haiga') {
      return NextResponse.json({ description: rawText });
    }
    if (task === 'handwriting') {
      return NextResponse.json({ text: rawText.trim() });
    }

    return NextResponse.json({ text: rawText });
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
