// API呼び出しヘルパー — Next.js Route Handler 経由で OpenAI API を呼ぶ

interface CallAIOptions {
  mode?: 'json';
  image?: { data: string; mediaType: string };
}

export const callAI = async (
  prompt: string,
  options?: CallAIOptions,
): Promise<{ text: string }> => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      mode: options?.mode,
      image: options?.image,
    }),
  });
  return response.json();
};
