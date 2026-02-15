import type { HaikuLine } from './types';

export function countMora(text: string): number {
  if (!text) return 0;

  let count = 0;
  const chars = text.split('');

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // 小文字（捨て仮名）は前の文字と合わせて1音なのでカウントしない
    if ('ぁぃぅぇぉゃゅょゎァィゥェォヮヵヶっッ'.includes(char)) {
      continue;
    }

    // ひらがな・カタカナ・長音符をカウント
    if (/[ぁ-んァ-ヶー]/.test(char)) {
      count++;
    }

    // 漢字は簡易的に1文字1音とする
    if (/[一-龯]/.test(char)) {
      count++;
    }
  }

  return count;
}

export function analyzeHaikuStructure(text: string): HaikuLine[] {
  const lines = text.split('\n').filter((line) => line.trim());
  return lines.map((line) => ({
    text: line,
    mora: countMora(line),
  }));
}
