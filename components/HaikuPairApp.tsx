"use client";

import {
  analyzeImage,
  generateHaiga as generateHaigaAI,
  generateHaikuSuggestions,
} from "@/lib/ai";
import { pickRandomKigo } from "@/lib/kigo";
import {
  loadHistory,
  loadSession,
  saveHistory,
  saveSession,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase/client";
import type {
  HaikuHistoryEntry,
  ImageSuggestions,
  ScreenMode,
  SessionData,
} from "@/lib/types";
import { useEffect, useState } from "react";

import GalleryScreen from "@/components/screens/GalleryScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import HostScreen from "@/components/screens/HostScreen";
import JoinScreen from "@/components/screens/JoinScreen";
import SessionScreen from "@/components/screens/SessionScreen";

import AISuggestModal from "@/components/modals/AISuggestModal";
import HaigaModal from "@/components/modals/HaigaModal";
import ShareCardModal from "@/components/modals/ShareCardModal";

export default function HaikuPairApp() {
  // --- 画面モード ---
  const [mode, setMode] = useState<ScreenMode>("home");

  // --- セッション内ステップ（5ステップウィザード） ---
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // --- セッション状態 ---
  const [sessionId, setSessionId] = useState("");
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [kigo, setKigo] = useState("");
  const [season, setSeason] = useState("");
  const [myHaiku, setMyHaiku] = useState("");
  const [partnerHaiku, setPartnerHaiku] = useState("");
  const [showPartner, setShowPartner] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);

  // --- 句の履歴 ---
  const [haikuHistory, setHaikuHistory] = useState<HaikuHistoryEntry[]>([]);

  useEffect(() => {
    setHaikuHistory(loadHistory());
  }, []);

  // --- Realtime: 相手の俳句を自動受信 ---
  // useEffect(() => {
  //   if (!dbSessionId || !myParticipantId) return;

  //   const channel = supabase
  //     .channel(`haiku-${dbSessionId}`)
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "*",
  //         schema: "public",
  //         table: "haikus",
  //         filter: `session_id=eq.${dbSessionId}`,
  //       },
  //       (payload) => {
  //         const newRow = payload.new as {
  //           participant_id: string;
  //           content: string;
  //         };
  //         if (newRow.participant_id !== myParticipantId) {
  //           setPartnerHaiku(newRow.content);
  //           setShowPartner(true);
  //         }
  //       },
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [dbSessionId, myParticipantId]);

  useEffect(() => {
    console.log("🧩 Realtime effect triggered");
    console.log("  dbSessionId:", dbSessionId);
    console.log("  myParticipantId:", myParticipantId);

    if (!dbSessionId || !myParticipantId) {
      console.log("⏸ Realtime skipped: missing IDs");
      return;
    }

    console.log("🚀 Subscribing to session:", dbSessionId);

    const channel = supabase
      .channel(`haiku-${dbSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "haikus",
          filter: `session_id=eq.${dbSessionId}`,
        },
        (payload) => {
          console.log("🔥 Realtime payload received:");
          console.log("  eventType:", payload.eventType);
          console.log("  full payload:", payload);

          const newRow = payload.new as {
            participant_id: string;
            content: string;
          };

          console.log("  incoming participant_id:", newRow?.participant_id);
          console.log("  myParticipantId:", myParticipantId);

          if (!newRow?.participant_id) {
            console.log("⚠️ No participant_id in payload");
            return;
          }

          if (newRow.participant_id !== myParticipantId) {
            console.log("✅ Partner update detected → updating UI");
            setPartnerHaiku(newRow.content);
            setShowPartner(true);
          } else {
            console.log("🙅 Self update ignored");
          }
        },
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status);
      });

    return () => {
      console.log("🧹 Cleaning up channel:", `haiku-${dbSessionId}`);
      supabase.removeChannel(channel);
    };
  }, [dbSessionId, myParticipantId]);

  const saveToHistory = (
    haiku: string,
    kigoVal: string,
    seasonVal: string,
    author = "私",
  ) => {
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
  const [hasVoted, setHasVoted] = useState(false);

  const submitVote = (vote: string) => {
    setMyVote(vote);
    if (sessionData) {
      const updated = {
        ...sessionData,
        [role === "host" ? "hostVote" : "guestVote"]: vote,
      };
      setSessionData(updated);
      saveSession(sessionId, updated);
    }
  };

  const handleVote = async (votedFor: "self" | "partner") => {
    if (!dbSessionId || !myParticipantId) {
      console.error("[Supabase] handleVote: dbSessionId or myParticipantId missing");
      return;
    }

    try {
      let targetId: string = myParticipantId;

      if (votedFor === "partner") {
        const { data: partnerParticipant, error: partnerError } = await supabase
          .from("participants")
          .select("id")
          .eq("session_id", dbSessionId)
          .neq("id", myParticipantId)
          .single();

        if (partnerError || !partnerParticipant) {
          console.error("[Supabase] handleVote: partner fetch failed:", partnerError?.message);
          return;
        }
        targetId = partnerParticipant.id;
      }

      const { error: voteError } = await supabase.from("votes").insert({
        session_id: dbSessionId,
        voter_id: myParticipantId,
        voted_for_id: targetId,
      });

      if (voteError) {
        console.error("[Supabase] votes insert failed:", voteError.message);
      } else {
        setHasVoted(true);
      }
    } catch (e) {
      console.error("[Supabase] unexpected error in handleVote:", e);
    }
  };

  // localStorage + Supabase の両方に投票を保存する
  const handleVoteCombined = (vote: string) => {
    submitVote(vote);
    handleVote(vote === "mine" ? "self" : "partner");
  };

  const checkPartnerVote = () => {
    const data = loadSession(sessionId);
    if (data) {
      const vote = role === "host" ? data.guestVote : data.hostVote;
      setPartnerVote(vote ?? null);
      setShowVoteResult(true);
    }
  };

  // --- 俳画 ---
  const [isGeneratingHaiga, setIsGeneratingHaiga] = useState(false);
  const [generatedHaigaDescription, setGeneratedHaigaDescription] =
    useState("");
  const [showHaigaModal, setShowHaigaModal] = useState(false);
  const [currentHaikuForHaiga, setCurrentHaikuForHaiga] = useState("");

  const generateHaiga = async (haiku: string, kigoVal: string) => {
    setIsGeneratingHaiga(true);
    setShowHaigaModal(true);
    setCurrentHaikuForHaiga(haiku);

    try {
      const description = await generateHaigaAI(haiku, kigoVal);
      setGeneratedHaigaDescription(description);
    } catch (error) {
      console.error("Haiga generation error:", error);
      setGeneratedHaigaDescription(
        "俳画の生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setIsGeneratingHaiga(false);
    }
  };

  // --- 共有カード ---
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareCardHaiku, setShareCardHaiku] = useState("");
  const [shareCardKigo, setShareCardKigo] = useState("");
  const [shareCardSeason, setShareCardSeason] = useState("");
  const [shareCardAuthor, setShareCardAuthor] = useState("");

  const openShareCard = (
    haiku: string,
    kigoVal: string,
    seasonVal: string,
    author = "",
  ) => {
    setShareCardHaiku(haiku);
    setShareCardKigo(kigoVal);
    setShareCardSeason(seasonVal);
    setShareCardAuthor(author);
    setShowShareCard(true);
  };

  // --- 画像から季語（セッション画面内で利用） ---
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const [imageSuggestions, setImageSuggestions] =
    useState<ImageSuggestions | null>(null);

  // 画像をキャンバスでリサイズして base64 に変換（大容量写真による4MBボディ制限超過を防ぐ）
  const resizeAndEncodeImage = (
    file: File,
    maxSide = 1024,
  ): Promise<{ data: string; mediaType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve({ data: dataUrl.split(",")[1], mediaType: "image/jpeg" });
      };

      img.onerror = reject;
      img.src = url;
    });
  };

  const analyzeImageForHaiku = async (imageFile: File) => {
    setImageAnalyzing(true);

    try {
      const { data, mediaType } = await resizeAndEncodeImage(imageFile);
      const parsed = await analyzeImage(data, mediaType);
      setImageSuggestions(parsed);
    } catch (error) {
      console.error("画像分析エラー:", error);
      setImageSuggestions({
        season: "春",
        kigo_suggestions: ["桜", "春風", "若葉"],
        scene_description: "自然の風景が写っています",
        haiku_hints: [
          "色彩に注目してみましょう",
          "音を想像してみましょう",
          "季節の移ろいを感じてみましょう",
        ],
      });
    } finally {
      setImageAnalyzing(false);
    }
  };

  // --- AI句提案 ---
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [userIdea, setUserIdea] = useState("");

  const generateAISuggestions = async (idea: string, kigoVal: string) => {
    if (!idea.trim()) return;

    setIsGeneratingSuggestions(true);
    setShowAISuggest(true);

    try {
      const suggestions = await generateHaikuSuggestions(idea, kigoVal);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI suggestion error:", error);
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
  const createSession = async () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    const picked = pickRandomKigo();

    setSessionId(id);
    setKigo(picked.kigo);
    setSeason(picked.season);
    setRole("host");
    setMode("host");

    const data: SessionData = {
      id,
      kigo: picked.kigo,
      season: picked.season,
      host: userName,
      hostHaiku: "",
      guestHaiku: "",
      created: new Date().toISOString(),
    };
    setSessionData(data);
    saveSession(id, data);

    // Supabase に保存（失敗してもUIは壊さない）
    try {
      const { data: createdSession, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          code: id,
          kigo: picked.kigo,
          season: picked.season,
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error(
          "[Supabase] sessions insert failed:",
          sessionError.message,
        );
        return;
      }

      setDbSessionId(createdSession.id);

      // client_key の生成・取得
      const clientKey =
        localStorage.getItem("client_key") ?? crypto.randomUUID();
      localStorage.setItem("client_key", clientKey);

      // participants に host を insert
      const { data: createdParticipant, error: participantError } =
        await supabase
          .from("participants")
          .insert({
            session_id: createdSession.id,
            name: userName,
            role: "host",
            client_key: clientKey,
          })
          .select("id")
          .single();

      if (participantError) {
        console.error(
          "[Supabase] participants insert failed:",
          participantError.message,
        );
      } else if (createdParticipant) {
        setMyParticipantId(createdParticipant.id);
      }
    } catch (e) {
      console.error("[Supabase] unexpected error:", e);
    }
  };

  const joinSession = async (id: string) => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("code", id)
        .maybeSingle();

      if (sessionError) {
        console.error(
          "[Supabase] joinSession select failed:",
          sessionError.message,
        );
        // フォールバック（localStorageへ続行）
      } else if (!session) {
        console.warn("Session not found in DB");
        alert("セッションが見つかりません");
        return;
      } else {
        // 満席チェック：guest がすでに存在するか確認
        const { data: existingGuest, error: guestCheckError } = await supabase
          .from("participants")
          .select("id")
          .eq("session_id", session.id)
          .eq("role", "guest")
          .maybeSingle();

        if (guestCheckError) {
          console.error(
            "[Supabase] guest check failed:",
            guestCheckError.message,
          );
        } else if (existingGuest) {
          alert("満席です");
          return;
        } else {
          setDbSessionId(session.id);

          // guest を insert
          const clientKey =
            localStorage.getItem("client_key") ?? crypto.randomUUID();
          localStorage.setItem("client_key", clientKey);

          const { data: insertedParticipant, error: participantError } =
            await supabase
              .from("participants")
              .insert({
                session_id: session.id,
                name: userName,
                role: "guest",
                client_key: clientKey,
              })
              .select("id")
              .single();

          if (participantError) {
            console.error(
              "[Supabase] participants insert failed:",
              participantError.message,
            );
          } else if (insertedParticipant) {
            setMyParticipantId(insertedParticipant.id);
          }
        }
      }
    } catch (e) {
      console.error("[Supabase] unexpected error during join:", e);
    }

    // 既存のlocalStorageロジック（DB確認成功 or Supabaseエラー時のフォールバック）
    const data = loadSession(id);
    if (data) {
      setSessionData(data);
      setSessionId(id);
      setKigo(data.kigo);
      setSeason(data.season);
      setRole("guest");
      setMode("session");
      setActiveStep(1);
    } else {
      alert("セッションが見つかりません");
    }
  };

  const submitHaiku = async () => {
    if (!myHaiku.trim()) return;

    // 既存のlocalStorageロジック（UIは先に更新）
    if (sessionData) {
      const updated = {
        ...sessionData,
        [role === "host" ? "hostHaiku" : "guestHaiku"]: myHaiku,
      };
      setSessionData(updated);
      saveSession(sessionId, updated);
      setSubmitted(true);
    }

    // Supabase に保存（失敗してもUIは壊さない）
    try {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("code", sessionId)
        .single();

      if (sessionError || !session) {
        console.error(
          "[Supabase] submitHaiku: session fetch failed:",
          sessionError?.message,
        );
        return;
      }

      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", session.id)
        .eq("role", role)
        .single();

      if (participantError || !participant) {
        console.error(
          "[Supabase] submitHaiku: participant fetch failed:",
          participantError?.message,
        );
        return;
      }

      const { error: upsertError } = await supabase.from("haikus").upsert(
        {
          session_id: session.id,
          participant_id: participant.id,
          content: myHaiku,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "session_id,participant_id" },
      );

      if (upsertError) {
        console.error("[Supabase] haikus upsert failed:", upsertError.message);
      }
    } catch (e) {
      console.error("[Supabase] unexpected error in submitHaiku:", e);
    }
  };

  const checkPartnerHaiku = async () => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("code", sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error(sessionError?.message ?? "session not found");
      }

      const partnerRole = role === "host" ? "guest" : "host";

      const { data: partner, error: partnerError } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", session.id)
        .eq("role", partnerRole)
        .single();

      if (partnerError || !partner) {
        throw new Error(partnerError?.message ?? "partner not found");
      }

      const { data: haiku, error: haikuError } = await supabase
        .from("haikus")
        .select("*")
        .eq("session_id", session.id)
        .eq("participant_id", partner.id)
        .maybeSingle();

      if (haikuError) {
        throw new Error(haikuError.message);
      }

      // Supabase 成功 — localStorageフォールバック不要
      if (haiku) {
        setPartnerHaiku(haiku.content);
        setShowPartner(true);
      } else {
        alert("まだ提出されていません");
      }
      return;
    } catch (e) {
      console.error("[Supabase] checkPartnerHaiku failed:", e);
    }

    // Supabaseエラー時のみlocalStorageフォールバック
    const data = loadSession(sessionId);
    if (data) {
      const partner = role === "host" ? data.guestHaiku : data.hostHaiku;
      setPartnerHaiku(partner);
      setShowPartner(true);
    }
  };

  const resetToHome = () => {
    setMode("home");
    setSessionId("");
    setKigo("");
    setSeason("");
    setRole("");
    setMyHaiku("");
    setPartnerHaiku("");
    setShowPartner(false);
    setSubmitted(false);
    setSessionData(null);
    setMyVote(null);
    setPartnerVote(null);
    setShowVoteResult(false);
    setDbSessionId(null);
    setMyParticipantId(null);
    setHasVoted(false);
    setActiveStep(1);
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
      case "home":
        return (
          <HomeScreen
            userName={userName}
            onUserNameChange={setUserName}
            onCreateSession={createSession}
            onJoin={() => setMode("join")}
            onGallery={() => setMode("gallery")}
          />
        );
      case "join":
        return (
          <JoinScreen onJoin={joinSession} onBack={() => setMode("home")} />
        );
      case "host":
        return (
          <HostScreen
            sessionId={sessionId}
            kigo={kigo}
            season={season}
            onStartSession={() => {
              setActiveStep(1);
              setMode("session");
            }}
            onCancel={resetToHome}
          />
        );
      case "session":
        return (
          <SessionScreen
            sessionId={sessionId}
            role={role}
            userName={userName}
            kigo={kigo}
            season={season}
            myHaiku={myHaiku}
            onMyHaikuChange={setMyHaiku}
            onSubmitHaiku={submitHaiku}
            onCheckPartner={checkPartnerHaiku}
            partnerHaiku={partnerHaiku}
            showPartner={showPartner}
            onClosePartner={() => setShowPartner(false)}
            submitted={submitted}
            onSetSubmitted={setSubmitted}
            onOpenShareCard={openShareCard}
            onGenerateHaiga={generateHaiga}
            onSaveToHistory={saveToHistory}
            onGoHome={resetToHome}
            onGoKigoDict={() => {}}
            userIdea={userIdea}
            onUserIdeaChange={setUserIdea}
            onGenerateAISuggestions={generateAISuggestions}
            onSubmitVote={handleVoteCombined}
            onCheckPartnerVote={checkPartnerVote}
            myVote={myVote}
            partnerVote={partnerVote}
            showVoteResult={showVoteResult}
            hasVoted={hasVoted}
            // 5ステップウィザード制御
            activeStep={activeStep}
            onStepChange={setActiveStep}
            // 写真解析（画面内で利用）
            imageAnalyzing={imageAnalyzing}
            imageSuggestions={imageSuggestions}
            onImageFileSelect={analyzeImageForHaiku}
            onResetImageSuggestions={() => setImageSuggestions(null)}
          />
        );
      case "gallery":
        return (
          <GalleryScreen
            history={haikuHistory}
            onOpenShareCard={openShareCard}
            onGenerateHaiga={generateHaiga}
            onDeleteEntry={deleteFromHistory}
            onGoHome={() => setMode("home")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-amber-50 flex items-center justify-center p-4">
      <div className={`max-w-2xl w-full ${fadeIn ? "fade-in" : "opacity-0"}`}>
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

      </div>
    </div>
  );
}
