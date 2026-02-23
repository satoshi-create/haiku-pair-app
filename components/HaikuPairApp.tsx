'use client';

import { useState, useEffect } from 'react';
import type { ScreenMode, SessionData, HaikuHistoryEntry, ImageSuggestions } from '@/lib/types';
import { pickRandomKigo, pickMonthlyKigo } from '@/lib/kigo';
import { callAI } from '@/lib/api';
import { saveSession, loadSession, loadHistory, saveHistory } from '@/lib/storage';

import HomeScreen from '@/components/screens/HomeScreen';
import JoinScreen from '@/components/screens/JoinScreen';
import HostScreen from '@/components/screens/HostScreen';
import SessionScreen from '@/components/screens/SessionScreen'; // 保持（削除不可）
import SimulationScreen from '@/components/screens/SimulationScreen'; // 保持（削除不可）
import GalleryScreen from '@/components/screens/GalleryScreen';
import KigoDictScreen from '@/components/screens/KigoDictScreen'; // 保持（削除不可）
import ComposeScreen from '@/components/screens/ComposeScreen';

import AISuggestModal from '@/components/modals/AISuggestModal';
import HaigaModal from '@/components/modals/HaigaModal';
import ShareCardModal from '@/components/modals/ShareCardModal';
import ImageUploadModal from '@/components/modals/ImageUploadModal';

export default function HaikuPairApp() {
  // --- 画面モード ---
  const [mode, setMode] = useState<ScreenMode>('home');

  // --- セッション状態 ---
  const [sessionId, setSessionId] = useState('');
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [kigo, setKigo] = useState('');
  const [season, setSeason] = useState('');
  const [myHaiku, setMyHaiku] = useState('');
  const [partnerHaiku, setPartnerHaiku] = useState('');
  const [showPartner, setShowPartner] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // --- 句の履歴 ---
  const [haikuHistory, setHaikuHistory] = useState<HaikuHistoryEntry[]>([]);

  useEffect(() => {
    setHaikuHistory(loadHistory());
  }, []);

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
    saveHistory(updated);
  };

  const deleteFromHistory = (id: number) => {
    const updated = haikuHistory.filter((item) => item.id !== id);
    setHaikuHistory(updated);
    saveHistory(updated);
  };

  // --- 投票 ---
  const [myVote, setMyVote] = useState<string | null>(null);
  const [partnerVote, setPartnerVote] = useState<string | null>(null);
  const [showVoteResult, setShowVoteResult] = useState(false);

  const submitVote = (vote: string) => {
    setMyVote(vote);
    if (sessionData) {
      const updated = {
        ...sessionData,
        [role === 'host' ? 'hostVote' : 'guestVote']: vote,
      };
      setSessionData(updated);
      saveSession(sessionId, updated);
    }
  };

  const checkPartnerVote = () => {
    const data = loadSession(sessionId);
    if (data) {
      const vote = role === 'host' ? data.guestVote : data.hostVote;
      setPartnerVote(vote ?? null);
      setShowVoteResult(true);
    }
  };

  // --- 俳画 ---
  const [isGeneratingHaiga, setIsGeneratingHaiga] = useState(false);
  const [generatedHaigaDescription, setGeneratedHaigaDescription] = useState('');
  const [showHaigaModal, setShowHaigaModal] = useState(false);
  const [currentHaikuForHaiga, setCurrentHaikuForHaiga] = useState('');

  const generateHaiga = async (haiku: string, kigoVal: string) => {
    setIsGeneratingHaiga(true);
    setShowHaigaModal(true);
    setCurrentHaikuForHaiga(haiku);

    try {
      const data = await callAI(`以下の俳句に相応しい俳画（haiga）の情景を、簡潔に日本語で描写してください。

俳句：
${haiku}

季語：${kigoVal}

俳画の特徴：
- 墨絵のようなシンプルな構図
- 余白を活かした表現
- 季節感を大切に
- 写実的ではなく、印象的に

150文字以内で、どんな情景を描くべきか説明してください。`);

      setGeneratedHaigaDescription(data.text);
    } catch (error) {
      console.error('Haiga generation error:', error);
      setGeneratedHaigaDescription('俳画の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGeneratingHaiga(false);
    }
  };

  // --- 共有カード ---
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

  // --- 画像から季語 ---
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState<ImageSuggestions | null>(null);
  /** 写真プレビュー URL（ComposeScreen に渡す） */
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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
    setImagePreviewUrl(URL.createObjectURL(imageFile));
    setImageAnalyzing(true);

    try {
      const base64Image = await convertToBase64(imageFile);

      const data = await callAI(
        `この写真を見て、俳句を詠むためのヒントを提案してください。

以下のJSON形式で回答してください：
{
  "season": "春/夏/秋/冬のいずれか",
  "kigo_suggestions": ["季語1", "季語2", "季語3"],
  "scene_description": "この写真の情景を簡潔に説明",
  "haiku_hints": ["俳句のヒント1", "俳句のヒント2", "俳句のヒント3"]
}`,
        {
          mode: 'json',
          image: { data: base64Image, mediaType: imageFile.type },
        },
      );

      const cleanText = data.text.replace(/```json|```/g, '').trim();
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

  // --- AI句提案 ---
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [userIdea, setUserIdea] = useState('');

  const generateAISuggestions = async (idea: string, kigoVal: string) => {
    if (!idea.trim()) return;

    setIsGeneratingSuggestions(true);
    // ComposeScreen がインライン表示するためモーダルは開かない

    try {
      const data = await callAI(
        `以下のユーザーの句の断片やアイデアをもとに、季語「${kigoVal}」を使った俳句を3〜5句提案してください。

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
        { mode: 'json' },
      );

      const cleanText = data.text.replace(/```json|```/g, '').trim();
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

  // --- セッション操作 ---
  const createSession = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const picked = pickMonthlyKigo();

    setSessionId(id);
    setKigo(picked.kigo);
    setSeason(picked.season);
    setRole('host');
    setMode('host');

    const data: SessionData = {
      id,
      kigo: picked.kigo,
      season: picked.season,
      host: userName,
      hostHaiku: '',
      guestHaiku: '',
      created: new Date().toISOString(),
    };
    setSessionData(data);
    saveSession(id, data);
  };

  const joinSession = (id: string) => {
    const data = loadSession(id);
    if (data) {
      setSessionData(data);
      setSessionId(id);
      setKigo(data.kigo);
      setSeason(data.season);
      setRole('guest');
      setMode('session');
    } else {
      alert('セッションが見つかりません');
    }
  };

  const submitHaiku = () => {
    if (!myHaiku.trim()) return;
    if (sessionData) {
      const updated = {
        ...sessionData,
        [role === 'host' ? 'hostHaiku' : 'guestHaiku']: myHaiku,
      };
      setSessionData(updated);
      saveSession(sessionId, updated);
      setSubmitted(true);
    }
  };

  const checkPartnerHaiku = () => {
    const data = loadSession(sessionId);
    if (data) {
      const partner = role === 'host' ? data.guestHaiku : data.hostHaiku;
      setPartnerHaiku(partner);
      setShowPartner(true);
    }
  };

  const startSimulation = () => {
    const picked = pickRandomKigo();
    setKigo(picked.kigo);
    setSeason(picked.season);
    setMode('simulation');
  };

  const resetToHome = () => {
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
    setImagePreviewUrl(null);
    setImageSuggestions(null);
    setAiSuggestions([]);
  };

  // --- フェードインアニメーション ---
  // SSR時は true にして opacity-0 で不可視になるのを防ぐ。
  // クライアント側で mode 切替時にだけ false→true のアニメーションを走らせる。
  const [fadeIn, setFadeIn] = useState(true);
  const [prevMode, setPrevMode] = useState<ScreenMode>(mode);

  if (mode !== prevMode) {
    setPrevMode(mode);
    setFadeIn(false);
  }

  useEffect(() => {
    if (!fadeIn) {
      const timer = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [fadeIn]);

  // --- レンダー ---
  const renderScreen = () => {
    switch (mode) {
      case 'home':
        return (
          <HomeScreen
            userName={userName}
            onUserNameChange={setUserName}
            onCreateSession={createSession}
            onJoin={() => setMode('join')}
            onSimulation={startSimulation}
            onGallery={() => setMode('gallery')}
            onKigoDict={() => setMode('kigo_dict')}
            onImageUpload={() => setShowImageUpload(true)}
          />
        );
      case 'join':
        return (
          <JoinScreen
            onJoin={joinSession}
            onBack={() => setMode('home')}
          />
        );
      case 'host':
        return (
          <HostScreen
            sessionId={sessionId}
            kigo={kigo}
            season={season}
            onStartSession={() => setMode('session')}
            onCancel={resetToHome}
          />
        );
      case 'session':
        return (
          <ComposeScreen
            kigo={kigo}
            season={season}
            imagePreviewUrl={imagePreviewUrl}
            isAnalyzing={imageAnalyzing}
            onFileSelect={analyzeImageForHaiku}
            imageSuggestions={imageSuggestions}
            myHaiku={myHaiku}
            onMyHaikuChange={setMyHaiku}
            onSubmitHaiku={submitHaiku}
            submitted={submitted}
            userIdea={userIdea}
            onUserIdeaChange={setUserIdea}
            onGenerateAISuggestions={generateAISuggestions}
            aiSuggestions={aiSuggestions}
            isGeneratingSuggestions={isGeneratingSuggestions}
            onGoHome={resetToHome}
          />
        );
      case 'simulation':
        return (
          <SimulationScreen
            kigo={kigo}
            season={season}
            onSaveToHistory={saveToHistory}
            onOpenShareCard={openShareCard}
            onRestartSimulation={startSimulation}
            onGoHome={() => setMode('home')}
          />
        );
      case 'gallery':
        return (
          <GalleryScreen
            history={haikuHistory}
            onOpenShareCard={openShareCard}
            onGenerateHaiga={generateHaiga}
            onDeleteEntry={deleteFromHistory}
            onGoHome={() => setMode('home')}
          />
        );
      case 'kigo_dict':
        return (
          <KigoDictScreen
            onGoHome={() => setMode('home')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-amber-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full ${fadeIn ? 'fade-in' : 'opacity-0'}`}>
        {renderScreen()}

        {/* モーダル群 */}
        <AISuggestModal
          show={showAISuggest}
          isGenerating={isGeneratingSuggestions}
          suggestions={aiSuggestions}
          onSelect={(suggestion) => {
            setMyHaiku(suggestion);
            setShowAISuggest(false);
          }}
          onClose={() => setShowAISuggest(false)}
        />

        <HaigaModal
          show={showHaigaModal}
          isGenerating={isGeneratingHaiga}
          haiku={currentHaikuForHaiga}
          description={generatedHaigaDescription}
          onClose={() => setShowHaigaModal(false)}
        />

        <ShareCardModal
          show={showShareCard}
          haiku={shareCardHaiku}
          kigo={shareCardKigo}
          season={shareCardSeason}
          author={shareCardAuthor}
          onClose={() => setShowShareCard(false)}
        />

        <ImageUploadModal
          show={showImageUpload}
          isAnalyzing={imageAnalyzing}
          suggestions={imageSuggestions}
          onFileSelect={analyzeImageForHaiku}
          onSelectKigo={selectKigoFromImage}
          onReset={() => setImageSuggestions(null)}
          onClose={() => {
            setShowImageUpload(false);
            setImageSuggestions(null);
          }}
        />
      </div>
    </div>
  );
}
