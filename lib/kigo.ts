import type { KigoEntry } from './types';

export const 春の季語 = ['春風', '桜', '霞', '蛙', '雲雀', '菜の花', '朧月', '花冷え', '春雨'];
export const 夏の季語 = ['五月雨', '青葉', '蝉', '夕立', '蛍', '虹', '涼風', '夏雲', '青嵐'];
export const 秋の季語 = ['紅葉', '月', '虫', '秋風', '露', '稲', '霧', '天高し', '秋雨'];
export const 冬の季語 = ['雪', '時雨', '冬木立', '寒月', '氷', '北風', '冬晴', '霜', '枯野'];

export const 全季語 = [...春の季語, ...夏の季語, ...秋の季語, ...冬の季語];

export function getSeasonForKigo(kigo: string): string {
  if (春の季語.includes(kigo)) return '春';
  if (夏の季語.includes(kigo)) return '夏';
  if (秋の季語.includes(kigo)) return '秋';
  return '冬';
}

export function pickRandomKigo(): { kigo: string; season: string } {
  const kigo = 全季語[Math.floor(Math.random() * 全季語.length)];
  return { kigo, season: getSeasonForKigo(kigo) };
}

export const kigoDatabase: Record<string, KigoEntry> = {
  // 春
  '春風': { season: '春', description: '春に吹く穏やかな風。暖かく心地よい風を指す。', examples: ['春風や　闘志抱きて　丘に立つ　（高浜虚子）'] },
  '桜': { season: '春', description: '春の代表的な花。日本の国花として親しまれる。', examples: ['さまざまの　事思ひ出す　桜かな　（松尾芭蕉）'] },
  '霞': { season: '春', description: '春の空気が湿って遠くが霞んで見える現象。', examples: ['霞たつ　長き春日を　子供かな　（与謝蕪村）'] },
  '蛙': { season: '春', description: '冬眠から覚めて活動を始める蛙。春の訪れを告げる。', examples: ['古池や　蛙飛びこむ　水の音　（松尾芭蕉）'] },
  '雲雀': { season: '春', description: '春の空高く舞い上がって鳴く小鳥。', examples: ['雲雀より　空にやすらふ　峠かな　（松尾芭蕉）'] },
  '菜の花': { season: '春', description: '春に一面に咲く黄色い花。明るく華やかな春の景色。', examples: ['菜の花や　月は東に　日は西に　（与謝蕪村）'] },
  '朧月': { season: '春', description: '春の夜、霞んでぼんやりと見える月。', examples: ['朧月　棹のしづくも　ぬくし　（与謝蕪村）'] },
  '花冷え': { season: '春', description: '桜の咲く頃の思いがけない寒さ。', examples: ['花冷えや　ともし火細き　京の宿'] },
  '春雨': { season: '春', description: '春に静かに降る雨。草木を育てる恵みの雨。', examples: ['春雨や　物語ゆく　蓑と笠　（与謝蕪村）'] },
  // 夏
  '五月雨': { season: '夏', description: '旧暦5月（梅雨時）に降る長雨。', examples: ['五月雨を　集めて早し　最上川　（松尾芭蕉）'] },
  '青葉': { season: '夏', description: '新緑から濃い緑へと変わった夏の葉。', examples: ['青葉して　御目の雫　拭はばや　（松尾芭蕉）'] },
  '蝉': { season: '夏', description: '夏を代表する昆虫。激しく鳴く声が夏の盛りを告げる。', examples: ['閑さや　岩にしみ入る　蝉の声　（松尾芭蕉）'] },
  '夕立': { season: '夏', description: '夏の午後に突然降る激しい雨。', examples: ['夕立や　草葉をつかむ　むら雀　（松尾芭蕉）'] },
  '蛍': { season: '夏', description: '夏の夜に淡い光を放って飛ぶ虫。', examples: ['蛍火の　昼は消えつつ　柱かな　（与謝蕪村）'] },
  '虹': { season: '夏', description: '夏の夕立の後に現れる七色の光の帯。', examples: ['虹立つや　どの町へでも　行かれそう'] },
  '涼風': { season: '夏', description: '暑さの中に吹く涼しい風。', examples: ['涼風の　曲りくねつて　来たりけり　（小林一茶）'] },
  '夏雲': { season: '夏', description: '夏空に湧き上がる入道雲。', examples: ['夏雲や　力いっぱい　湧き上がる'] },
  '青嵐': { season: '夏', description: '青葉を吹き渡る初夏の強い風。', examples: ['青嵐　いくたび海を　見に行かむ'] },
  // 秋
  '紅葉': { season: '秋', description: '秋に木々の葉が赤や黄に色づく様子。', examples: ['奥山に　紅葉踏み分け　鳴く鹿の　声聞く時ぞ　秋は悲しき'] },
  '月': { season: '秋', description: '秋の澄んだ空に浮かぶ美しい月。中秋の名月。', examples: ['名月や　池をめぐりて　夜もすがら　（松尾芭蕉）'] },
  '虫': { season: '秋', description: '秋に鳴く虫の総称。コオロギ、スズムシなど。', examples: ['虫の音も　聞こえぬ程に　鳴きにけり'] },
  '秋風': { season: '秋', description: '秋に吹く涼しい風。物悲しさを感じさせる。', examples: ['秋風や　白木の弓に　弦はらん　（与謝蕪村）'] },
  '露': { season: '秋', description: '秋の朝、草木に降りる冷たい露。', examples: ['露の世は　露の世ながら　さりながら　（小林一茶）'] },
  '稲': { season: '秋', description: '秋の実りを迎えた稲穂。黄金色に輝く。', examples: ['稲妻や　波もて洗ふ　杭の跡　（松尾芭蕉）'] },
  '霧': { season: '秋', description: '秋の朝に立ち込める霧。幻想的な景色を作る。', examples: ['霧しぐれ　富士を見ぬ日ぞ　面白き　（松尾芭蕉）'] },
  '天高し': { season: '秋', description: '秋の澄んだ高い空。秋晴れの爽快な空。', examples: ['天高し　馬肥ゆる秋　とはいへど'] },
  '秋雨': { season: '秋', description: '秋に降る物悲しい雨。', examples: ['秋雨や　草に埋もるる　水車'] },
  // 冬
  '雪': { season: '冬', description: '冬の代表的な季語。静寂と純白の世界。', examples: ['降る雪や　明治は遠く　なりにけり　（中村草田男）'] },
  '時雨': { season: '冬', description: '冬の初めに降ったり止んだりする雨。', examples: ['初しぐれ　猿も小蓑を　ほしげ也　（松尾芭蕉）'] },
  '冬木立': { season: '冬', description: '葉を落とした冬の木々。寒々とした景色。', examples: ['冬木立　真直ぐに道の　続きをり'] },
  '寒月': { season: '冬', description: '冬の澄んだ空に浮かぶ冷たい月。', examples: ['寒月や　夜半に高みを　渡りけり'] },
  '氷': { season: '冬', description: '冬の厳しい寒さで凍った水。', examples: ['氷張る　月日の池や　光かな'] },
  '北風': { season: '冬', description: '冬に北から吹く冷たく強い風。', examples: ['北風や　岩に裂けたる　海の音'] },
  '冬晴': { season: '冬', description: '冬の晴れた日。空気が澄んで清々しい。', examples: ['冬晴や　富士くっきりと　朝の窓'] },
  '霜': { season: '冬', description: '冬の朝、地面や草木に降りる白い霜。', examples: ['霜枯れの　畦に白鷺　一羽かな'] },
  '枯野': { season: '冬', description: '冬の枯れた野原。寂しさと静けさの景色。', examples: ['枯野かな　とびたつ鳥の　影法師'] },
};

export function searchKigo(query: string): string[] {
  if (!query) return Object.keys(kigoDatabase);
  return Object.keys(kigoDatabase).filter(
    (k) => k.includes(query) || kigoDatabase[k].description.includes(query) || kigoDatabase[k].season === query
  );
}
