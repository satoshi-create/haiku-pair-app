'use client';

import { useState, useEffect } from 'react';

// window.QRCode の型定義
declare global {
  interface Window {
    QRCode: {
      new (element: HTMLElement, options: {
        text: string;
        width: number;
        height: number;
        colorDark: string;
        colorLight: string;
        correctLevel: number;
      }): void;
      CorrectLevel: {
        L: number;
        M: number;
        Q: number;
        H: number;
      };
    };
  }
}

// 型定義
interface SessionData {
  id: string;
  kigo: string;
  season: string;
  host: string;
  hostHaiku: string;
  guestHaiku: string;
  hostVote?: string;
  guestVote?: string;
  created: string;
}

interface HaikuHistoryEntry {
  id: number;
  haiku: string;
  kigo: string;
  season: string;
  author: string;
  date: string;
}

interface KigoEntry {
  season: string;
  description: string;
  examples: string[];
}

interface ImageSuggestions {
  season: string;
  kigo_suggestions: string[];
  scene_description: string;
  haiku_hints: string[];
}

interface HaikuLine {
  text: string;
  mora: number;
}

// QRコード生成ライブラリをCDNから読み込む
const loadQRCodeScript = (): Promise<typeof window.QRCode> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.QRCode) {
      resolve(window.QRCode);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => resolve(window.QRCode);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const 春の季語 = ['春風', '桜', '霞', '蛙', '雲雀', '菜の花', '朧月', '花冷え', '春雨'];
const 夏の季語 = ['五月雨', '青葉', '蝉', '夕立', '蛍', '虹', '涼風', '夏雲', '青嵐'];
const 秋の季語 = ['紅葉', '月', '虫', '秋風', '露', '稲', '霧', '天高し', '秋雨'];
const 冬の季語 = ['雪', '時雨', '冬木立', '寒月', '氷', '北風', '冬晴', '霜', '枯野'];

const 全季語 = [...春の季語, ...夏の季語, ...秋の季語, ...冬の季語];

// API呼び出しヘルパー
const callAnthropicAPI = async (messages: { role: string; content: string | Array<{ type: string; [key: string]: unknown }> }[], maxTokens = 1000) => {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages,
    }),
  });
  return response.json();
};

export default function HaikuPairMode() {
  const [mode, setMode] = useState('home'); // home, host, join, session, simulation, gallery, kigo_dict
  const [sessionId, setSessionId] = useState('');
  const [role, setRole] = useState(''); // host or guest
  const [userName, setUserName] = useState('');
  const [kigo, setKigo] = useState('');
  const [season, setSeason] = useState('');
  const [myHaiku, setMyHaiku] = useState('');
  const [partnerHaiku, setPartnerHaiku] = useState('');
  const [showPartner, setShowPartner] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // シミュレーションモード用
  const [simStep, setSimStep] = useState(1); // 1: 芭蕉, 2: 蕪村
  const [bashoHaiku, setBashoHaiku] = useState('');
  const [busonHaiku, setBusonHaiku] = useState('');
  const [bashoSubmitted, setBashoSubmitted] = useState(false);
  const [busonSubmitted, setBusonSubmitted] = useState(false);

  // 句の履歴
  const [haikuHistory, setHaikuHistory] = useState<HaikuHistoryEntry[]>([]);

  // 履歴読み込み
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('haiku_history');
      if (stored) {
        setHaikuHistory(JSON.parse(stored));
      }
    } catch {
      console.log('Failed to load history');
    }
  }, []);

  // 句を履歴に保存
  const saveToHistory = (haiku: string, kigoVal: string, seasonVal: string, author = '私') => {
    const newEntry: HaikuHistoryEntry = {
      id: Date.now(),
      haiku,
      kigo: kigoVal,
      season: seasonVal,
      author,
      date: new Date().toISOString(),
    };

    const updated = [newEntry, ...haikuHistory];
    setHaikuHistory(updated);

    try {
      window.localStorage.setItem('haiku_history', JSON.stringify(updated));
    } catch {
      console.log('Failed to save history');
    }
  };

  // 履歴から削除
  const deleteFromHistory = (id: number) => {
    const updated = haikuHistory.filter((item) => item.id !== id);
    setHaikuHistory(updated);

    try {
      window.localStorage.setItem('haiku_history', JSON.stringify(updated));
    } catch {
      console.log('Failed to update history');
    }
  };

  // 俳画生成
  const [isGeneratingHaiga, setIsGeneratingHaiga] = useState(false);
  const [, setHaigaPrompt] = useState('');
  const [generatedHaigaDescription, setGeneratedHaigaDescription] = useState('');
  const [showHaigaModal, setShowHaigaModal] = useState(false);
  const [currentHaikuForHaiga, setCurrentHaikuForHaiga] = useState('');

  const generateHaiga = async (haiku: string, kigoVal: string) => {
    setIsGeneratingHaiga(true);
    setShowHaigaModal(true);
    setCurrentHaikuForHaiga(haiku);

    try {
      const data = await callAnthropicAPI([
        {
          role: 'user',
          content: `以下の俳句に相応しい俳画（haiga）の情景を、簡潔に日本語で描写してください。

俳句：
${haiku}

季語：${kigoVal}

俳画の特徴：
- 墨絵のようなシンプルな構図
- 余白を活かした表現
- 季節感を大切に
- 写実的ではなく、印象的に

150文字以内で、どんな情景を描くべきか説明してください。`,
        },
      ]);

      const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text || '';
      setGeneratedHaigaDescription(text);
      setHaigaPrompt(text);
    } catch (error) {
      console.error('Haiga generation error:', error);
      setGeneratedHaigaDescription('俳画の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGeneratingHaiga(false);
    }
  };

  // 音数カウント関数
  const countMora = (text: string): number => {
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
  };

  // 行ごとの音数を計算
  const analyzeHaikuStructure = (text: string): HaikuLine[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    return lines.map((line) => ({
      text: line,
      mora: countMora(line),
    }));
  };

  // 季語辞典データ
  const kigoDatabase: Record<string, KigoEntry> = {
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

  // 季語詳細表示用のstate
  const [selectedKigo, setSelectedKigo] = useState<string | null>(null);
  const [kigoSearchQuery, setKigoSearchQuery] = useState('');

  // 選句・投票機能
  const [myVote, setMyVote] = useState<string | null>(null);
  const [partnerVote, setPartnerVote] = useState<string | null>(null);
  const [showVoteResult, setShowVoteResult] = useState(false);

  // タイマー機能
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  // タイマーのカウントダウン
  useEffect(() => {
    if (!timerRunning || timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setTimerRunning(false);
          try {
            const audio = new Audio(
              'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTO'
            );
            audio.play();
          } catch {
            console.log('Audio not supported');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

  const startTimer = () => {
    setTimeRemaining(timerMinutes * 60);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeRemaining(null);
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 共有カード生成
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareCardHaiku, setShareCardHaiku] = useState('');
  const [shareCardKigo, setShareCardKigo] = useState('');
  const [shareCardSeason, setShareCardSeason] = useState('');
  const [shareCardAuthor, setShareCardAuthor] = useState('');

  const openShareCard = (haiku: string, kigoVal: string, seasonVal: string, author = '') => {
    setShareCardHaiku(haiku);
    setShareCardKigo(kigoVal);
    setShareCardSeason(seasonVal);
    setShareCardAuthor(author);
    setShowShareCard(true);
  };

  const downloadCard = () => {
    alert(
      '実装時には、このカードをPNG/JPG画像として保存できます。\n\nhtml2canvas や dom-to-image などのライブラリを使用して実装します。'
    );
  };

  const copyCardText = () => {
    const text = `${shareCardHaiku}\n\n季語：${shareCardKigo}（${shareCardSeason}）${shareCardAuthor ? `\n詠み人：${shareCardAuthor}` : ''}\n\n#俳句 #AI句会 #${shareCardKigo}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('テキストをクリップボードにコピーしました！');
      })
      .catch(() => {
        alert('コピーに失敗しました');
      });
  };

  // アニメーション用のstate
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(timer);
  }, [mode, simStep]);

  // 画像から季語提案
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [, setUploadedImage] = useState<File | null>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestions | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzeImageForHaiku = async (imageFile: File) => {
    setImageAnalyzing(true);

    try {
      const base64Image = await convertToBase64(imageFile);

      const data = await callAnthropicAPI([
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageFile.type,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `この写真を見て、俳句を詠むためのヒントを提案してください。

以下のJSON形式で回答してください：
{
  "season": "春/夏/秋/冬のいずれか",
  "kigo_suggestions": ["季語1", "季語2", "季語3"],
  "scene_description": "この写真の情景を簡潔に説明",
  "haiku_hints": ["俳句のヒント1", "俳句のヒント2", "俳句のヒント3"]
}`,
            },
          ],
        },
      ]);

      const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text || '';
      const cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setImageSuggestions(parsed);
    } catch (error) {
      console.error('画像分析エラー:', error);
      setImageSuggestions({
        season: '春',
        kigo_suggestions: ['桜', '春風', '若葉'],
        scene_description: '自然の風景が写っています',
        haiku_hints: ['色彩に注目してみましょう', '音を想像してみましょう', '季節の移ろいを感じてみましょう'],
      });
    } finally {
      setImageAnalyzing(false);
    }
  };

  const selectKigoFromImage = (selectedKigoVal: string, selectedSeason: string) => {
    setKigo(selectedKigoVal);
    setSeason(selectedSeason);
    setShowImageUpload(false);
    setMode('session');
    setRole('host');
    setSessionId(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  // AI句提案機能
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [userIdea, setUserIdea] = useState('');

  const generateAISuggestions = async (idea: string, kigoVal: string) => {
    if (!idea.trim()) return;

    setIsGeneratingSuggestions(true);
    setShowAISuggest(true);

    try {
      const data = await callAnthropicAPI([
        {
          role: 'user',
          content: `あなたは俳句の師匠です。以下のユーザーの句の断片やアイデアをもとに、季語「${kigoVal}」を使った俳句を3〜5句提案してください。

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
        },
      ]);

      const text = data.content?.find((c: { type: string }) => c.type === 'text')?.text || '';
      const cleanText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setAiSuggestions(parsed.suggestions || []);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiSuggestions([
        `${kigoVal}や　${idea}　心に残る`,
        `${idea}　${kigoVal}添えて　静かなり`,
        `${kigoVal}の中　${idea}　風そよぐ`,
      ]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // QRコード生成
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);

  useEffect(() => {
    if (mode === 'host' && sessionId && !qrCodeGenerated) {
      const generateQR = async () => {
        try {
          await loadQRCodeScript();
          const qrContainer = document.getElementById('qrcode-container');
          if (qrContainer && window.QRCode) {
            qrContainer.innerHTML = '';
            const joinURL = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;
            new window.QRCode(qrContainer, {
              text: joinURL,
              width: 256,
              height: 256,
              colorDark: '#1c1917',
              colorLight: '#ffffff',
              correctLevel: window.QRCode.CorrectLevel.H,
            });
            setQrCodeGenerated(true);
          }
        } catch (error) {
          console.error('QRコード生成エラー:', error);
        }
      };
      generateQR();
    }

    if (mode !== 'host') {
      setQrCodeGenerated(false);
    }
  }, [mode, sessionId, qrCodeGenerated]);

  // 季語を検索
  const searchKigo = (query: string): string[] => {
    if (!query) return Object.keys(kigoDatabase);
    return Object.keys(kigoDatabase).filter(
      (k) => k.includes(query) || kigoDatabase[k].description.includes(query)
    );
  };

  // 投票を保存
  const submitVote = (vote: string) => {
    setMyVote(vote);

    if (sessionData) {
      const updated = {
        ...sessionData,
        [role === 'host' ? 'hostVote' : 'guestVote']: vote,
      };
      setSessionData(updated);

      try {
        window.localStorage.setItem(`session_${sessionId}`, JSON.stringify(updated));
      } catch {
        console.log('Failed to save vote');
      }
    }
  };

  // 相手の投票を確認
  const checkPartnerVote = () => {
    try {
      const stored = window.localStorage.getItem(`session_${sessionId}`);
      if (stored) {
        const data = JSON.parse(stored);
        const vote = role === 'host' ? data.guestVote : data.hostVote;
        setPartnerVote(vote);
        setShowVoteResult(true);
      }
    } catch {
      console.log('Failed to check vote');
    }
  };

  // シミュレーション開始
  const startSimulation = () => {
    const random = 全季語[Math.floor(Math.random() * 全季語.length)];

    let selectedSeason = '';
    if (春の季語.includes(random)) selectedSeason = '春';
    else if (夏の季語.includes(random)) selectedSeason = '夏';
    else if (秋の季語.includes(random)) selectedSeason = '秋';
    else selectedSeason = '冬';

    setKigo(random);
    setSeason(selectedSeason);
    setMode('simulation');
    setSimStep(1);
    setBashoHaiku('');
    setBusonHaiku('');
    setBashoSubmitted(false);
    setBusonSubmitted(false);
  };

  // セッション作成
  const createSession = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const random = 全季語[Math.floor(Math.random() * 全季語.length)];

    let selectedSeason = '';
    if (春の季語.includes(random)) selectedSeason = '春';
    else if (夏の季語.includes(random)) selectedSeason = '夏';
    else if (秋の季語.includes(random)) selectedSeason = '秋';
    else selectedSeason = '冬';

    setSessionId(id);
    setKigo(random);
    setSeason(selectedSeason);
    setRole('host');
    setMode('host');

    const data: SessionData = {
      id,
      kigo: random,
      season: selectedSeason,
      host: userName,
      hostHaiku: '',
      guestHaiku: '',
      created: new Date().toISOString(),
    };

    setSessionData(data);

    try {
      window.localStorage.setItem(`session_${id}`, JSON.stringify(data));
    } catch {
      console.log('Storage not available, using in-memory only');
    }
  };

  // セッション参加
  const joinSession = (id: string) => {
    try {
      const stored = window.localStorage.getItem(`session_${id}`);
      if (stored) {
        const data = JSON.parse(stored);
        setSessionData(data);
        setSessionId(id);
        setKigo(data.kigo);
        setSeason(data.season);
        setRole('guest');
        setMode('session');
      } else {
        alert('セッションが見つかりません');
      }
    } catch {
      alert('セッションの読み込みに失敗しました');
    }
  };

  const [submitted, setSubmitted] = useState(false);

  // 句を提出
  const submitHaiku = () => {
    if (!myHaiku.trim()) return;

    if (sessionData) {
      const updated = {
        ...sessionData,
        [role === 'host' ? 'hostHaiku' : 'guestHaiku']: myHaiku,
      };
      setSessionData(updated);

      try {
        window.localStorage.setItem(`session_${sessionId}`, JSON.stringify(updated));
        setSubmitted(true);
      } catch {
        console.log('Storage not available');
      }
    }
  };

  // 相手の句を確認
  const checkPartnerHaiku = () => {
    try {
      const stored = window.localStorage.getItem(`session_${sessionId}`);
      if (stored) {
        const data = JSON.parse(stored);
        const partner = role === 'host' ? data.guestHaiku : data.hostHaiku;
        setPartnerHaiku(partner);
        setShowPartner(true);
      }
    } catch {
      console.log('Storage check failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-amber-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .slide-in {
          animation: slideIn 0.4s ease-out;
        }
        .float {
          animation: float 3s ease-in-out infinite;
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .breathe {
          animation: breathe 2s ease-in-out infinite;
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
      `}</style>
      <div className={`max-w-2xl w-full ${fadeIn ? 'fade-in' : 'opacity-0'}`}>

        {/* ホーム画面 */}
        {mode === 'home' && (
          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-stone-800">AI句会ワークショップ</h1>
              <p className="text-stone-600">ペアモード</p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200 space-y-6">
              <p className="text-stone-700 leading-relaxed">
                二人で座を組み、<br />
                同じ季語で句を詠む。
              </p>

              <div className="space-y-4">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="あなたの名前（芭蕉、蕪村など）"
                  className="w-full p-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                />

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={createSession}
                    disabled={!userName.trim()}
                    className="bg-stone-800 text-white px-6 py-4 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    座を立てる
                  </button>

                  <button
                    onClick={() => setMode('join')}
                    disabled={!userName.trim()}
                    className="border-2 border-stone-800 text-stone-800 px-6 py-4 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    座に参加
                  </button>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <button
                    onClick={startSimulation}
                    className="w-full border-2 border-amber-600 text-amber-700 px-6 py-3 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    🎭 シミュレーションモード
                  </button>
                  <p className="text-xs text-stone-500 text-center mt-2">
                    一人で芭蕉と蕪村を演じてペア体験
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <button
                    onClick={() => setMode('gallery')}
                    className="w-full border-2 border-blue-600 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    📚 句の履歴・ギャラリー
                  </button>
                  <p className="text-xs text-stone-500 text-center mt-2">
                    これまでに詠んだ句を振り返る
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <button
                    onClick={() => setMode('kigo_dict')}
                    className="w-full border-2 border-green-600 text-green-700 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    📖 季語辞典
                  </button>
                  <p className="text-xs text-stone-500 text-center mt-2">
                    季語の意味と例句を調べる
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <button
                    onClick={() => setShowImageUpload(true)}
                    className="w-full border-2 border-indigo-600 text-indigo-700 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    📷 写真から季語を探す
                  </button>
                  <p className="text-xs text-stone-500 text-center mt-2">
                    写真をAIが分析して季語を提案
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 参加画面 */}
        {mode === 'join' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">座に参加</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="セッションID（6桁）"
                  maxLength={6}
                  onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                  className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 text-center text-2xl tracking-wider uppercase"
                />

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => joinSession(sessionId)}
                    disabled={sessionId.length !== 6}
                    className="bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    参加する
                  </button>

                  <button
                    onClick={() => setMode('home')}
                    className="border border-stone-300 px-6 py-3 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    戻る
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ホスト待機画面 */}
        {mode === 'host' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">座を立てました</h2>

              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-stone-600 mb-4">お相手に以下のIDを伝えてください</p>
                  <div className="bg-stone-100 p-6 rounded-lg mb-6">
                    <div className="text-4xl font-bold text-stone-800 tracking-wider mb-2">{sessionId}</div>
                    <div className="text-sm text-stone-600">
                      季語：{kigo}（{season}）
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-stone-600 mb-4">または、QRコードを読み取ってもらう</p>
                  <div className="bg-white p-4 rounded-lg inline-block border-2 border-stone-200">
                    <div id="qrcode-container" className="flex items-center justify-center min-h-[256px]">
                      <div className="text-stone-400">QRコード生成中...</div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    スマホのカメラでこのQRコードを読み取ってください
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => setMode('session')}
                    className="w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    句会を始める
                  </button>
                  <button
                    onClick={() => {
                      setMode('home');
                      setSessionId('');
                      setKigo('');
                      setSeason('');
                      setRole('');
                      setSessionData(null);
                    }}
                    className="w-full text-sm text-stone-600 hover:text-stone-800"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* セッション画面 */}
        {mode === 'session' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
              {/* ヘッダー */}
              <div className="text-center mb-8 pb-6 border-b border-stone-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-stone-600">
                    {role === 'host' ? '主' : '客'}: {userName}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMode('kigo_dict')}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                    >
                      📖 季語辞典
                    </button>
                    <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                      ID: {sessionId}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-stone-600 mb-2">今日のお題</div>
                <div className="text-5xl font-bold text-stone-800 mb-2 float">{kigo}</div>
                <div className="text-stone-500">（{season}）</div>

                {/* タイマー表示 */}
                {timerEnabled && (
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-blue-800">⏱️ 作句時間</span>
                      <div
                        className={`text-3xl font-bold ${
                          timeRemaining !== null && timeRemaining <= 60
                            ? 'text-red-600 animate-pulse'
                            : 'text-blue-800'
                        }`}
                      >
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {!timerRunning ? (
                        <button
                          onClick={startTimer}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          開始
                        </button>
                      ) : (
                        <button
                          onClick={stopTimer}
                          className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          停止
                        </button>
                      )}
                      <button
                        onClick={resetTimer}
                        className="px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm text-blue-700"
                      >
                        リセット
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 作句エリア */}
              <div className="space-y-6">
                {/* タイマー設定 */}
                {!submitted && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-blue-800">
                        <input
                          type="checkbox"
                          checked={timerEnabled}
                          onChange={(e) => setTimerEnabled(e.target.checked)}
                          className="w-4 h-4"
                        />
                        ⏱️ タイマーを使う
                      </label>
                    </div>

                    {timerEnabled && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-blue-700">作句時間：</label>
                        <select
                          value={timerMinutes}
                          onChange={(e) => {
                            setTimerMinutes(Number(e.target.value));
                            resetTimer();
                          }}
                          className="px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                          disabled={timerRunning}
                        >
                          <option value={3}>3分</option>
                          <option value={5}>5分</option>
                          <option value={10}>10分</option>
                          <option value={15}>15分</option>
                          <option value={20}>20分</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-stone-700 mb-3">あなたの句：</p>

                  {/* AI提案ボタン */}
                  {!submitted && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-bold text-amber-800 mb-3">💡 AIに提案を求める</p>
                      <p className="text-xs text-amber-700 mb-3">
                        まずは句のアイデアや断片を入力してください。
                        <br />
                        例：「川の流れが速い」「家が二軒見える」
                      </p>
                      <input
                        type="text"
                        value={userIdea}
                        onChange={(e) => setUserIdea(e.target.value)}
                        placeholder="句のアイデアや断片を入力..."
                        className="w-full p-3 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
                      />
                      <button
                        onClick={() => generateAISuggestions(userIdea, kigo)}
                        disabled={!userIdea.trim()}
                        className="w-full bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        AIに提案を求める
                      </button>
                    </div>
                  )}

                  <textarea
                    value={myHaiku}
                    onChange={(e) => {
                      setMyHaiku(e.target.value);
                      setSubmitted(false);
                    }}
                    placeholder={'句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
                    className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
                    disabled={submitted}
                  />

                  {/* 音数カウンター */}
                  {myHaiku && (
                    <div className="mt-3 bg-stone-50 p-4 rounded-lg border border-stone-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-600">音数カウンター</span>
                        <span className="text-xs text-stone-500">目安：5-7-5</span>
                      </div>
                      {analyzeHaikuStructure(myHaiku).map((line, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                          <div className="flex-1 text-sm text-stone-700 truncate">
                            {line.text || '（空行）'}
                          </div>
                          <div
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              (index === 0 && line.mora === 5) ||
                              (index === 1 && line.mora === 7) ||
                              (index === 2 && line.mora === 5)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {line.mora}音
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-stone-500 mt-3">
                        ※音数は目安です。漢字の読みによって変わる場合があります
                      </p>
                    </div>
                  )}

                  {!submitted ? (
                    <button
                      onClick={submitHaiku}
                      disabled={!myHaiku.trim()}
                      className="mt-3 w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      句を提出
                    </button>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg text-center">
                        ✓ 句を提出しました
                      </div>
                      <button
                        onClick={() => openShareCard(myHaiku, kigo, season, userName)}
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        📤 共有カードを作成
                      </button>
                      <button
                        onClick={() => generateHaiga(myHaiku, kigo)}
                        className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        🎨 俳画を添える
                      </button>
                      <button
                        onClick={() => {
                          saveToHistory(myHaiku, kigo, season, userName);
                          setSubmitted(false);
                        }}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📚 履歴に保存
                      </button>
                      <button
                        onClick={() => setSubmitted(false)}
                        className="w-full text-sm text-stone-600 hover:text-stone-800"
                      >
                        句を編集する
                      </button>
                    </div>
                  )}
                </div>

                {/* 相手の句確認 */}
                <div className="pt-6 border-t border-stone-200">
                  {!showPartner ? (
                    <button
                      onClick={checkPartnerHaiku}
                      className="w-full border-2 border-stone-300 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-50 transition-colors"
                    >
                      相手の句を見る
                    </button>
                  ) : (
                    <div>
                      <p className="text-sm text-stone-700 mb-3">相手の句：</p>
                      <div className="bg-stone-50 p-6 rounded-lg min-h-32 flex items-center justify-center">
                        {partnerHaiku ? (
                          <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap">
                            {partnerHaiku}
                          </p>
                        ) : (
                          <p className="text-stone-400">まだ提出されていません</p>
                        )}
                      </div>

                      {/* 選句・投票セクション */}
                      {partnerHaiku && myHaiku && submitted && (
                        <div className="mt-6 pt-6 border-t border-stone-200">
                          <h4 className="text-sm font-bold text-stone-700 mb-4 text-center">
                            🗳️ 選句タイム
                          </h4>
                          <p className="text-xs text-stone-600 mb-4 text-center">
                            二つの句のうち、より良いと思う方を選んでください
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                              onClick={() => submitVote('mine')}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                myVote === 'mine'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              <div className="text-xs text-stone-600 mb-2">あなたの句</div>
                              <div className="text-sm text-stone-800 line-clamp-3">{myHaiku}</div>
                            </button>

                            <button
                              onClick={() => submitVote('partner')}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                myVote === 'partner'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-stone-300 hover:bg-stone-50'
                              }`}
                            >
                              <div className="text-xs text-stone-600 mb-2">相手の句</div>
                              <div className="text-sm text-stone-800 line-clamp-3">{partnerHaiku}</div>
                            </button>
                          </div>

                          {myVote && (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-center text-sm">
                                ✓ 選句しました
                              </div>

                              {!showVoteResult && (
                                <button
                                  onClick={checkPartnerVote}
                                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  結果を見る
                                </button>
                              )}

                              {showVoteResult && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg border-2 border-amber-200">
                                  <h5 className="font-bold text-stone-800 mb-4 text-center">
                                    📊 選句結果
                                  </h5>

                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-stone-700">あなたの選句：</span>
                                      <span className="text-sm font-bold text-stone-800">
                                        {myVote === 'mine' ? '自分の句' : '相手の句'}
                                      </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-stone-700">相手の選句：</span>
                                      <span className="text-sm font-bold text-stone-800">
                                        {partnerVote
                                          ? partnerVote === 'mine'
                                            ? '自分の句'
                                            : '相手の句'
                                          : '未投票'}
                                      </span>
                                    </div>

                                    {partnerVote && (
                                      <div className="pt-4 mt-4 border-t border-amber-300 text-center">
                                        {(myVote === 'partner' && partnerVote === 'mine') ||
                                        (myVote === 'mine' && partnerVote === 'partner') ? (
                                          <div className="space-y-2">
                                            <p className="text-2xl">🤝</p>
                                            <p className="text-sm text-stone-700">
                                              お互いを選び合いました！
                                              <br />
                                              素晴らしい座でした。
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <p className="text-2xl">✨</p>
                                            <p className="text-sm text-stone-700">
                                              それぞれの感性で選句しました。
                                              <br />
                                              良い句会でした。
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => setShowPartner(false)}
                        className="mt-3 w-full text-sm text-stone-600 hover:text-stone-800"
                      >
                        閉じる
                      </button>
                    </div>
                  )}
                </div>

                {/* ホームに戻る */}
                <div className="pt-6 border-t border-stone-200">
                  <button
                    onClick={() => {
                      setMode('home');
                      setSessionId('');
                      setKigo('');
                      setSeason('');
                      setRole('');
                      setMyHaiku('');
                      setPartnerHaiku('');
                      setShowPartner(false);
                      setSubmitted(false);
                      setSessionData(null);
                      setMyVote(null);
                      setPartnerVote(null);
                      setShowVoteResult(false);
                      resetTimer();
                      setTimerEnabled(false);
                    }}
                    className="w-full text-sm text-stone-600 hover:text-stone-800"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* シミュレーションモード */}
        {mode === 'simulation' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
              <div className="text-center mb-8 pb-6 border-b border-stone-200">
                <h2 className="text-2xl font-bold text-stone-800 mb-2">🎭 シミュレーション</h2>
                <div className="text-sm text-stone-600 mb-2">今日のお題</div>
                <div className="text-5xl font-bold text-stone-800 mb-2 float">{kigo}</div>
                <div className="text-stone-500">（{season}）</div>
              </div>

              {/* 芭蕉のターン */}
              {simStep === 1 && (
                <div className="space-y-4 slide-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold">
                      芭
                    </div>
                    <div>
                      <div className="font-bold text-stone-800">松尾芭蕉</div>
                      <div className="text-xs text-stone-500">まずは芭蕉として一句</div>
                    </div>
                  </div>

                  <textarea
                    value={bashoHaiku}
                    onChange={(e) => setBashoHaiku(e.target.value)}
                    placeholder={'芭蕉として句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
                    className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
                    disabled={bashoSubmitted}
                  />

                  {bashoHaiku && (
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-600">音数カウンター</span>
                        <span className="text-xs text-stone-500">目安：5-7-5</span>
                      </div>
                      {analyzeHaikuStructure(bashoHaiku).map((line, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                          <div className="flex-1 text-sm text-stone-700 truncate">
                            {line.text || '（空行）'}
                          </div>
                          <div
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              (index === 0 && line.mora === 5) ||
                              (index === 1 && line.mora === 7) ||
                              (index === 2 && line.mora === 5)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {line.mora}音
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!bashoSubmitted ? (
                    <button
                      onClick={() => {
                        if (bashoHaiku.trim()) {
                          setBashoSubmitted(true);
                          setSimStep(2);
                        }
                      }}
                      disabled={!bashoHaiku.trim()}
                      className="w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      芭蕉の句を提出 → 蕪村のターンへ
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg text-center">
                      ✓ 芭蕉の句を提出しました
                    </div>
                  )}
                </div>
              )}

              {/* 蕪村のターン */}
              {simStep === 2 && (
                <div className="space-y-4 slide-in">
                  <div className="bg-stone-50 p-4 rounded-lg mb-4 border border-stone-200">
                    <div className="text-xs text-stone-500 mb-1">芭蕉の句（まだ見えません）</div>
                    <div className="text-stone-400 text-sm">***提出済み***</div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold">
                      蕪
                    </div>
                    <div>
                      <div className="font-bold text-stone-800">与謝蕪村</div>
                      <div className="text-xs text-stone-500">次は蕪村として一句</div>
                    </div>
                  </div>

                  <textarea
                    value={busonHaiku}
                    onChange={(e) => setBusonHaiku(e.target.value)}
                    placeholder={'蕪村として句を詠んでください\n（改行で3行に分けると音数が表示されます）'}
                    className="w-full p-4 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 min-h-32 text-stone-800"
                    disabled={busonSubmitted}
                  />

                  {busonHaiku && (
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-stone-600">音数カウンター</span>
                        <span className="text-xs text-stone-500">目安：5-7-5</span>
                      </div>
                      {analyzeHaikuStructure(busonHaiku).map((line, index) => (
                        <div key={index} className="flex items-center gap-3 mb-2">
                          <div className="flex-1 text-sm text-stone-700 truncate">
                            {line.text || '（空行）'}
                          </div>
                          <div
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              (index === 0 && line.mora === 5) ||
                              (index === 1 && line.mora === 7) ||
                              (index === 2 && line.mora === 5)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {line.mora}音
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!busonSubmitted ? (
                    <button
                      onClick={() => {
                        if (busonHaiku.trim()) {
                          setBusonSubmitted(true);
                        }
                      }}
                      disabled={!busonHaiku.trim()}
                      className="w-full bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      蕪村の句を提出 → 披露へ
                    </button>
                  ) : (
                    <div className="space-y-6 slide-in">
                      <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-3 rounded-lg text-center">
                        ✓ 両者の句が出揃いました！
                      </div>

                      <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-6 rounded-lg border-2 border-stone-300">
                        <h3 className="text-lg font-bold text-stone-800 mb-6 text-center">
                          📜 句の披露
                        </h3>

                        <div className="space-y-6">
                          <div className="p-4 bg-white rounded-lg border border-stone-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center font-bold text-sm">
                                芭
                              </div>
                              <span className="font-bold text-stone-700">松尾芭蕉</span>
                            </div>
                            <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap pl-10">
                              {bashoHaiku}
                            </p>
                          </div>

                          <div className="p-4 bg-white rounded-lg border border-stone-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm">
                                蕪
                              </div>
                              <span className="font-bold text-stone-700">与謝蕪村</span>
                            </div>
                            <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap pl-10">
                              {busonHaiku}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <button
                            onClick={() => {
                              saveToHistory(bashoHaiku, kigo, season, '芭蕉');
                              saveToHistory(busonHaiku, kigo, season, '蕪村');
                              alert('両方の句を履歴に保存しました');
                            }}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            📚 両方の句を履歴に保存
                          </button>
                          <button
                            onClick={() => openShareCard(bashoHaiku, kigo, season, '芭蕉')}
                            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            📤 芭蕉の共有カード
                          </button>
                          <button
                            onClick={() => openShareCard(busonHaiku, kigo, season, '蕪村')}
                            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            📤 蕪村の共有カード
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={startSimulation}
                          className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          🎭 もう一度シミュレーション
                        </button>
                        <button
                          onClick={() => setMode('home')}
                          className="w-full text-sm text-stone-600 hover:text-stone-800"
                        >
                          ホームに戻る
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* シミュレーション中のホームボタン */}
              {!(simStep === 2 && busonSubmitted) && (
                <div className="mt-6 pt-4 border-t border-stone-200">
                  <button
                    onClick={() => setMode('home')}
                    className="w-full text-sm text-stone-600 hover:text-stone-800"
                  >
                    ホームに戻る
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ギャラリー・履歴画面 */}
        {mode === 'gallery' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">📚 句の履歴</h2>

              {haikuHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-stone-400 text-lg mb-2">まだ句がありません</p>
                  <p className="text-stone-400 text-sm">句会やシミュレーションで句を詠んでみましょう</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {haikuHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-stone-50 p-5 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors"
                    >
                      <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap mb-3">
                        {entry.haiku}
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-stone-500">
                          季語：{entry.kigo}（{entry.season}）
                          {entry.author && ` / ${entry.author}`} /{' '}
                          {new Date(entry.date).toLocaleDateString('ja-JP')}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openShareCard(entry.haiku, entry.kigo, entry.season, entry.author)}
                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                          >
                            📤 共有
                          </button>
                          <button
                            onClick={() => generateHaiga(entry.haiku, entry.kigo)}
                            className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors"
                          >
                            🎨 俳画
                          </button>
                          <button
                            onClick={() => deleteFromHistory(entry.id)}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-stone-200">
                <button
                  onClick={() => setMode('home')}
                  className="w-full text-sm text-stone-600 hover:text-stone-800"
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 季語辞典 */}
        {mode === 'kigo_dict' && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 shadow-lg border border-stone-200">
              <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">📖 季語辞典</h2>

              <input
                type="text"
                value={kigoSearchQuery}
                onChange={(e) => setKigoSearchQuery(e.target.value)}
                placeholder="季語を検索..."
                className="w-full p-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 mb-6"
              />

              {/* 季節別タブ */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {['春', '夏', '秋', '冬'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setKigoSearchQuery(kigoSearchQuery === s ? '' : s)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      kigoSearchQuery === s
                        ? s === '春'
                          ? 'bg-pink-500 text-white'
                          : s === '夏'
                            ? 'bg-green-500 text-white'
                            : s === '秋'
                              ? 'bg-orange-500 text-white'
                              : 'bg-blue-500 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* 季語詳細表示 */}
              {selectedKigo && kigoDatabase[selectedKigo] && (
                <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-lg border-2 border-amber-200 slide-in">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl font-bold text-stone-800">{selectedKigo}</h3>
                    <button
                      onClick={() => setSelectedKigo(null)}
                      className="text-stone-400 hover:text-stone-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="text-sm text-amber-700 mb-2">
                    {kigoDatabase[selectedKigo].season}の季語
                  </div>
                  <p className="text-stone-700 mb-4">{kigoDatabase[selectedKigo].description}</p>
                  <div>
                    <div className="text-sm font-bold text-stone-600 mb-2">例句：</div>
                    {kigoDatabase[selectedKigo].examples.map((ex, i) => (
                      <p key={i} className="text-stone-700 text-sm mb-1 pl-4 border-l-2 border-amber-300">
                        {ex}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* 季語一覧 */}
              <div className="grid grid-cols-3 gap-2">
                {searchKigo(kigoSearchQuery).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSelectedKigo(k === selectedKigo ? null : k)}
                    className={`p-3 rounded-lg text-sm text-left transition-all ${
                      selectedKigo === k
                        ? 'bg-amber-100 border-2 border-amber-400 text-amber-800 font-bold'
                        : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-bold">{k}</div>
                    <div className="text-xs text-stone-500">{kigoDatabase[k].season}</div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200">
                <button
                  onClick={() => setMode('home')}
                  className="w-full text-sm text-stone-600 hover:text-stone-800"
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI提案モーダル */}
        {showAISuggest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-stone-800">💡 AI句提案</h3>
                <button
                  onClick={() => setShowAISuggest(false)}
                  className="text-stone-400 hover:text-stone-600 text-xl"
                >
                  ✕
                </button>
              </div>

              {isGeneratingSuggestions ? (
                <div className="text-center py-8">
                  <div className="text-stone-400 animate-pulse">句を考えています...</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setMyHaiku(suggestion);
                        setShowAISuggest(false);
                      }}
                      className="w-full p-4 bg-stone-50 border border-stone-200 rounded-lg text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <p className="text-stone-800 whitespace-pre-wrap">{suggestion}</p>
                    </button>
                  ))}
                  <p className="text-xs text-stone-500 text-center mt-4">
                    提案をタップすると作句エリアに反映されます。
                    <br />
                    自由に編集してお使いください。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 俳画モーダル */}
        {showHaigaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-stone-800">🎨 俳画</h3>
                <button
                  onClick={() => setShowHaigaModal(false)}
                  className="text-stone-400 hover:text-stone-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-stone-50 p-4 rounded-lg mb-4 border border-stone-200">
                <p className="text-stone-800 whitespace-pre-wrap text-center">{currentHaikuForHaiga}</p>
              </div>

              {isGeneratingHaiga ? (
                <div className="text-center py-8">
                  <div className="text-stone-400 animate-pulse">俳画の情景を生成中...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-stone-100 to-amber-50 p-6 rounded-lg border border-stone-200">
                    <p className="text-sm font-bold text-stone-600 mb-2">情景描写：</p>
                    <p className="text-stone-700 leading-relaxed">{generatedHaigaDescription}</p>
                  </div>
                  <p className="text-xs text-stone-500 text-center">
                    この情景をもとに、墨絵やイラストで俳画を描いてみてください。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 共有カードモーダル */}
        {showShareCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-stone-800">📤 共有カード</h3>
                <button
                  onClick={() => setShowShareCard(false)}
                  className="text-stone-400 hover:text-stone-600 text-xl"
                >
                  ✕
                </button>
              </div>

              {/* カードプレビュー */}
              <div className="bg-gradient-to-br from-stone-50 to-amber-50 p-8 rounded-lg border-2 border-stone-300 mb-6">
                <div className="text-center space-y-4">
                  <p className="text-lg text-stone-800 leading-relaxed whitespace-pre-wrap font-serif">
                    {shareCardHaiku}
                  </p>
                  <div className="text-sm text-stone-500">
                    季語：{shareCardKigo}（{shareCardSeason}）
                  </div>
                  {shareCardAuthor && (
                    <div className="text-sm text-stone-600">詠み人：{shareCardAuthor}</div>
                  )}
                  <div className="text-xs text-stone-400">AI句会ワークショップ</div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={copyCardText}
                  className="w-full bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors"
                >
                  📋 テキストをコピー
                </button>
                <button
                  onClick={downloadCard}
                  className="w-full border border-stone-300 text-stone-700 px-6 py-3 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  💾 画像として保存（準備中）
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 画像アップロードモーダル */}
        {showImageUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-stone-800">📷 写真から季語を探す</h3>
                <button
                  onClick={() => {
                    setShowImageUpload(false);
                    setImageSuggestions(null);
                    setUploadedImage(null);
                  }}
                  className="text-stone-400 hover:text-stone-600 text-xl"
                >
                  ✕
                </button>
              </div>

              {!imageSuggestions ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
                    <p className="text-stone-500 mb-4">写真をアップロードしてください</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedImage(file);
                          analyzeImageForHaiku(file);
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  {imageAnalyzing && (
                    <div className="text-center py-4">
                      <div className="text-stone-400 animate-pulse">写真を分析しています...</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 slide-in">
                  <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                    <p className="text-sm font-bold text-stone-600 mb-2">情景：</p>
                    <p className="text-stone-700 text-sm">{imageSuggestions.scene_description}</p>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-stone-600 mb-2">
                      提案された季語（{imageSuggestions.season}）：
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {imageSuggestions.kigo_suggestions.map((k, i) => (
                        <button
                          key={i}
                          onClick={() => selectKigoFromImage(k, imageSuggestions.season)}
                          className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors text-sm font-bold"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-stone-600 mb-2">俳句のヒント：</p>
                    <ul className="space-y-1">
                      {imageSuggestions.haiku_hints.map((hint, i) => (
                        <li key={i} className="text-stone-700 text-sm pl-4 border-l-2 border-stone-300">
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setImageSuggestions(null);
                      setUploadedImage(null);
                    }}
                    className="w-full text-sm text-stone-600 hover:text-stone-800"
                  >
                    別の写真を試す
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
