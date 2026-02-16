import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  try {
    const { prompt, mode, image } = await request.json();

    // JSON出力を要求するモードではシステムプロンプトで厳格に指示
    const systemContent =
      mode === 'json'
        ? 'あなたは俳句の師匠です。必ずJSONのみを出力してください。説明文やマークダウンは禁止です。'
        : 'あなたは俳句の師匠です。';

    // 画像付きの場合は multimodal content を構築
    const userContent = image
      ? [
          { type: 'text' as const, text: prompt },
          {
            type: 'image_url' as const,
            image_url: { url: `data:${image.mediaType};base64,${image.data}` },
          },
        ]
      : prompt;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userContent },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ text });
  } catch (error) {
    console.error('OpenAI API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
