"use client";

import {
    analyzeImage,
    generateHaiga as generateHaigaAI,
    generateHaikuSuggestions,
    recognizeHandwriting,
} from "@/lib/ai";
import {
    ensureMyUserUuid,
    getDisplayName,
    getLastHaikuSubmitTimestamp,
    getMyUserUuid,
    HAIKU_COOLDOWN_SECONDS,
    loadHistory,
    loadSession,
    saveHistory,
    saveSession,
    setDisplayName,
    setLastHaikuSubmitTimestamp,
} from "@/lib/storage";
import {
    checkAiRateLimit,
    getAiRequestRemaining,
    logAiRequest,
} from "@/lib/supabase/aiRateLimit";
import { supabase } from "@/lib/supabase/client";
import { uploadHaikuImage } from "@/lib/supabase/storage";
import type {
    HaikuHistoryEntry,
    ImageSuggestions,
    ScreenMode,
    SessionData,
} from "@/lib/types";
import { getSeasonTheme } from "@/lib/themeUtils";
import { useEffect, useMemo, useRef, useState } from "react";

import GalleryScreen from "@/components/screens/GalleryScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import HostScreen from "@/components/screens/HostScreen";
import JoinScreen from "@/components/screens/JoinScreen";
import SessionScreen from "@/components/screens/SessionScreen";

import AISuggestModal from "@/components/modals/AISuggestModal";
import HaigaModal from "@/components/modals/HaigaModal";
import ShareCardModal from "@/components/modals/ShareCardModal";
import SakuraPetals from "@/components/SakuraPetals";

/** 全画面ルートの背景。`globals.css` のテーマ変数（html[data-theme]）に追従する */
const APP_ROOT_SHELL_CLASS =
  "h-dvh min-h-dvh overflow-hidden bg-[linear-gradient(180deg,var(--theme-surface)_0%,var(--theme-surface-muted)_55%,var(--theme-gradient-end)_100%)]";

export default function HaikuPairApp() {
  const seasonTheme = useMemo(() => getSeasonTheme(), []);

  // --- ユーザーID読み込み（アプリ起動時に確実にセット） ---
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdLoading, setUserIdLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const uuid = ensureMyUserUuid();
      console.log("[Debug] App startup - my_user_uuid:", uuid);
      if (!uuid) {
        setUserIdLoading(false);
        return;
      }
      setUserId(uuid);

      // profiles テーブルに存在保証（Upsert）。完了してからローディング解除
      const displayName = getDisplayName() ?? "";
      try {
        const { error } = await supabase
          .from("profiles")
          .upsert(
            { id: uuid, display_name: displayName },
            { onConflict: "id" },
          );
        if (error) {
          console.warn("[profiles] upsert failed:", error.message);
        }
      } catch (e) {
        console.warn("[profiles] upsert error:", e);
      }
      if (!cancelled) setUserIdLoading(false);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- 画面モード ---
  const [mode, setMode] = useState<ScreenMode>("home");

  // --- QRリンク（?session=XXX）の自動参加 ---
  const autoJoinAttemptedRef = useRef(false);
  useEffect(() => {
    if (userIdLoading || mode !== "home" || autoJoinAttemptedRef.current) return;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const sessionParam = params?.get("session")?.trim().toUpperCase();
    if (!sessionParam || sessionParam.length !== 6) return;

    autoJoinAttemptedRef.current = true;
    joinSession(sessionParam);
    window.history.replaceState({}, "", window.location.pathname);
  }, [userIdLoading, mode]);

  // --- セッション内ステップ（5ステップウィザード） ---
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // --- セッション状態 ---
  const [sessionId, setSessionId] = useState("");
  const [role, setRole] = useState("");
  const [userName, setUserNameState] = useState("");
  const setUserName = (name: string) => {
    setUserNameState(name);
    setDisplayName(name);
  };
  const [kigo, setKigo] = useState("");
  const [season, setSeason] = useState("");
  const [myHaiku, setMyHaiku] = useState("");
  const [partnerHaiku, setPartnerHaiku] = useState("");
  const [showPartner, setShowPartner] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmittingHaiku, setIsSubmittingHaiku] = useState(false);
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [coolDownSecondsRemaining, setCoolDownSecondsRemaining] = useState(0);
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [hostViewingKigoDict, setHostViewingKigoDict] = useState(false);

  // --- 句の履歴 ---
  const [haikuHistory, setHaikuHistory] = useState<HaikuHistoryEntry[]>([]);
  /** 相手の句を履歴に保存したか（1回だけ保存） */
  const partnerSavedToHistoryRef = useRef(false);
  /** 指書き画像（data URL）。デジタル半紙で書いた直後のみ保持し、提出時に履歴に紐づける */
  const [lastHandwritingDataUrl, setLastHandwritingDataUrl] = useState<string | null>(null);

  useEffect(() => {
    setHaikuHistory(loadHistory());
  }, []);

  useEffect(() => {
    const stored = getDisplayName();
    if (stored) setUserNameState(stored);
  }, []);

  // --- 俳句投稿クールダウン（localStorage から復元） ---
  useEffect(() => {
    const last = getLastHaikuSubmitTimestamp();
    if (!last) return;
    const elapsed = (Date.now() - last) / 1000;
    if (elapsed < HAIKU_COOLDOWN_SECONDS) {
      setIsCoolingDown(true);
      setCoolDownSecondsRemaining(Math.ceil(HAIKU_COOLDOWN_SECONDS - elapsed));
    }
  }, []);

  // --- クールダウンカウントダウン ---
  useEffect(() => {
    if (!isCoolingDown || coolDownSecondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setCoolDownSecondsRemaining((s) => {
        if (s <= 1) {
          setIsCoolingDown(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCoolingDown, coolDownSecondsRemaining]);

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

  // --- Realtime: sessions テーブル購読（ホストがお題を更新したらゲストに反映） ---
  useEffect(() => {
    if (!dbSessionId) return;
    const channel = supabase
      .channel(`sessions-${dbSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${dbSessionId}`,
        },
        (payload) => {
          const row = payload.new as {
            kigo?: string;
            season?: string;
            shared_image?: string | null;
            shared_hints?: string | null;
          };
          if (row.kigo != null) setKigo(row.kigo);
          if (row.season != null) setSeason(row.season);
          if (row.shared_image != null) setSharedImageDataUrl(row.shared_image || null);
          if (row.shared_hints != null) {
            try {
              const parsed = JSON.parse(row.shared_hints) as ImageSuggestions;
              setImageSuggestions(parsed);
            } catch {
              // ignore invalid JSON
            }
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbSessionId]);

  const saveToHistory = (
    haiku: string,
    kigoVal: string,
    seasonVal: string,
    author = "私",
    handwritingImageUrl?: string | null,
  ) => {
    const newEntry: HaikuHistoryEntry = {
      id: Date.now(),
      haiku,
      kigo: kigoVal,
      season: seasonVal,
      author,
      date: new Date().toISOString(),
      ...(handwritingImageUrl && { handwriting_image_url: handwritingImageUrl }),
    };
    setHaikuHistory((prev) => {
      const updated = [newEntry, ...prev];
      saveHistory(updated);
      return updated;
    });
  };

  const deleteFromHistory = (id: number | string) => {
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
  const [currentKigoForHaiga, setCurrentKigoForHaiga] = useState("");
  const [currentSeasonForHaiga, setCurrentSeasonForHaiga] = useState("");

  const generateHaiga = async (haikuVal: string, kigoVal: string, seasonOverride?: string) => {
    setIsGeneratingHaiga(true);
    setShowHaigaModal(true);
    setCurrentHaikuForHaiga(haikuVal);
    setCurrentKigoForHaiga(kigoVal);
    setCurrentSeasonForHaiga(seasonOverride ?? season);

    try {
      const description = await generateHaigaAI(haikuVal, kigoVal);
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
  /** 共有用写真（data URL）。ホストは解析時にセット、ゲストは Realtime で受信 */
  const [sharedImageDataUrl, setSharedImageDataUrl] = useState<string | null>(null);

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
      const dataUrl = `data:${mediaType};base64,${data}`;
      setSharedImageDataUrl(dataUrl);
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
        identified_plants: [],
        plant_confidence: "low",
        plant_kigo_note: "",
      });
    } finally {
      setImageAnalyzing(false);
    }
  };

  // --- AI句提案 ---
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isHandwritingOcrLoading, setIsHandwritingOcrLoading] = useState(false);
  const [userIdea, setUserIdea] = useState("");
  const [aiSuggestionRemaining, setAiSuggestionRemaining] = useState<number | undefined>(undefined);

  const fetchAiSuggestionRemaining = async () => {
    const uid = getMyUserUuid() ?? ensureMyUserUuid();
    if (!uid) return;
    const remaining = await getAiRequestRemaining(uid, "suggestion");
    setAiSuggestionRemaining(remaining);
  };

  useEffect(() => {
    if (mode === "session" && userId) fetchAiSuggestionRemaining();
  }, [mode, userId]);

  const generateAISuggestions = async (idea: string, kigoVal: string) => {
    if (!idea.trim()) return;

    const uid = getMyUserUuid() ?? ensureMyUserUuid();
    if (!uid) {
      alert("ユーザー情報の読み込みに失敗しました。ページを再読み込みしてください。");
      return;
    }

    const allowed = await checkAiRateLimit(uid, "suggestion");
    if (!allowed) {
      alert(
        "今日はAIもたくさん考えて疲れちゃったみたいです。少し時間を置いてまた相談してくださいね",
      );
      return;
    }

    setIsGeneratingSuggestions(true);
    setShowAISuggest(true);

    try {
      const suggestions = await generateHaikuSuggestions(idea, kigoVal);
      setAiSuggestions(suggestions);
      await logAiRequest(uid, "suggestion");
      await fetchAiSuggestionRemaining();
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

  // --- 手書き認識（デジタル半紙 → OCR → myHaiku 設定・Step 3 へ） ---
  const handleHandwritingComplete = async (dataUrl: string) => {
    setIsHandwritingOcrLoading(true);
    try {
      const text = await recognizeHandwriting(dataUrl);
      setMyHaiku(text);
      setLastHandwritingDataUrl(dataUrl);
      setActiveStep(3);
    } catch (error) {
      console.error("Handwriting OCR error:", error);
      alert(
        "手書きの読み取りに失敗しました。もう一度書いてみるか、キーボードで入力してください。"
      );
    } finally {
      setIsHandwritingOcrLoading(false);
    }
  };

  // --- お題の同期（ホストが季語を決定したときに呼ぶ） ---
  const updateSessionKigo = async (kigoVal: string, seasonVal: string) => {
    setKigo(kigoVal);
    setSeason(seasonVal);
    const payload: Partial<SessionData> = {
      kigo: kigoVal,
      season: seasonVal,
    };
    if (sessionData) {
      const updated = { ...sessionData, ...payload };
      if (sharedImageDataUrl && imageSuggestions) {
        updated.shared_image = sharedImageDataUrl;
        updated.shared_hints = JSON.stringify(imageSuggestions);
      }
      setSessionData(updated);
      saveSession(sessionId, updated);
    }
    if (!dbSessionId) return;
    try {
      const dbPayload: Record<string, unknown> = {
        kigo: kigoVal,
        season: seasonVal,
      };
      if (sharedImageDataUrl && imageSuggestions) {
        dbPayload.shared_image = sharedImageDataUrl;
        dbPayload.shared_hints = JSON.stringify(imageSuggestions);
        // ※ DB に shared_image / shared_hints カラムがない場合はマイグレーションが必要です
      }
      const { error } = await supabase
        .from("sessions")
        .update(dbPayload)
        .eq("id", dbSessionId);
      if (error) console.error("[Supabase] sessions kigo update failed:", error.message);
    } catch (e) {
      console.error("[Supabase] updateSessionKigo:", e);
    }
  };

  const handleKigoDictOpenChange = (open: boolean) => {
    setHostViewingKigoDict(open);
    // ゲストに「季語辞典を見ています」を伝えるには sessions に host_viewing_dict カラムを追加し、
    // ここで Supabase を更新する必要があります。現状はローカル状態のみで、ゲストは常に「お題を探しています」と表示されます。
  };

  // --- セッション操作 ---
  const createSession = async () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();

    setSessionId(id);
    setKigo("");
    setSeason("");
    setRole("host");
    setMode("host");

    const data: SessionData = {
      id,
      kigo: "",
      season: "",
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
          kigo: "",
          season: "",
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

      // client_key の生成・取得（user_id と別物。座席管理用）
      const clientKey =
        localStorage.getItem("client_key") ?? crypto.randomUUID();
      localStorage.setItem("client_key", clientKey);

      // participants に host を insert。user_id は常に localStorage から取得
      const hostUserId = getMyUserUuid() ?? ensureMyUserUuid();
      console.log("[Debug] participants insert 直前 (host) - my_user_uuid:", hostUserId);
      const { data: createdParticipant, error: participantError } =
        await supabase
          .from("participants")
          .insert({
            session_id: createdSession.id,
            name: userName,
            role: "host",
            client_key: clientKey,
            ...(hostUserId && { user_id: hostUserId }),
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
    // user_id は常に localStorage から取得
    const freshUserId = getMyUserUuid() ?? ensureMyUserUuid();
    console.log("[Debug] joinSession - my_user_uuid:", freshUserId);

    try {
      if (freshUserId) setUserId(freshUserId);
      if (!freshUserId) {
        console.error("[joinSession] user_id を取得できませんでした");
        alert("ユーザー情報の読み込みに失敗しました。ページを再読み込みしてください。");
        return;
      }

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

          // guest を insert。user_id は常に localStorage から取得
          const clientKey =
            localStorage.getItem("client_key") ?? crypto.randomUUID();
          localStorage.setItem("client_key", clientKey);
          const participantUserId = getMyUserUuid() ?? ensureMyUserUuid();
          console.log("[Debug] participants insert 直前 (guest) - my_user_uuid:", participantUserId);

          const { data: insertedParticipant, error: participantError } =
            await supabase
              .from("participants")
              .insert({
                session_id: session.id,
                name: userName,
                role: "guest",
                client_key: clientKey,
                ...(participantUserId && { user_id: participantUserId }),
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
          setSessionId(id);
          setKigo(session.kigo ?? "");
          setSeason(session.season ?? "");
          if (session.shared_image != null)
            setSharedImageDataUrl(session.shared_image || null);
          if (session.shared_hints != null) {
            try {
              setImageSuggestions(JSON.parse(session.shared_hints) as ImageSuggestions);
            } catch {
              // ignore
            }
          }
          setRole("guest");
          setMode("session");
          setActiveStep(1);
          const guestSessionData: SessionData = {
            id: session.code,
            kigo: session.kigo ?? "",
            season: session.season ?? "",
            host: "",
            hostHaiku: "",
            guestHaiku: "",
            created: (session as { created_at?: string }).created_at ?? new Date().toISOString(),
          };
          setSessionData(guestSessionData);
          saveSession(id, guestSessionData);
          return;
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

    // user_id は常に localStorage から取得
    const currentUserId = getMyUserUuid() ?? ensureMyUserUuid();
    console.log("[Debug] submitHaiku - my_user_uuid:", currentUserId);

    if (!currentUserId) {
      alert("ユーザー情報の再読み込みが必要です。ページを再読み込みしてください。");
      return;
    }

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

    // 提出と同時に履歴に保存（ギャラリーに表示）
    saveToHistory(myHaiku.trim(), kigo, season, "私", lastHandwritingDataUrl ?? undefined);
    setLastHandwritingDataUrl(null);

    // Supabase に保存（失敗してもUIは壊さない）
    setIsSubmittingHaiku(true);
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

      // 送信直前に localStorage から user_id を再取得（ステートに依存しない）
      const userIdForInsert = getMyUserUuid() ?? ensureMyUserUuid();
      if (!userIdForInsert) {
        alert("ユーザー情報の再読み込みが必要です。ページを再読み込みしてください。");
        return;
      }

      // DBレートリミット: 直近1分に3件以上 or 1日に20件以上で中断
      const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: count1min } = await supabase
        .from("haikus")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userIdForInsert)
        .gte("submitted_at", oneMinAgo);
      const { count: count1day } = await supabase
        .from("haikus")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userIdForInsert)
        .gte("submitted_at", oneDayAgo);
      if ((count1min ?? 0) >= 3 || (count1day ?? 0) >= 20) {
        alert("少し時間を置いてから投稿してください。");
        return;
      }

      // image_url: 共有写真。Data URL の場合は Storage にアップロードして公開URLを取得
      const rawImageUrl =
        sharedImageDataUrl ?? (session as { shared_image?: string | null }).shared_image ?? null;

      let imageUrlForInsert: string | null = null;
      if (rawImageUrl) {
        console.log("A: Before upload:", rawImageUrl.substring(0, 20));
        if (rawImageUrl.startsWith("data:")) {
          const uploadResult = await uploadHaikuImage(rawImageUrl, userIdForInsert);
          console.log("B: After upload result:", uploadResult);
          if (!uploadResult) {
            alert("画像の保存に失敗しました。もう一度お試しください。");
            return;
          }
          if (!uploadResult.startsWith("https://")) {
            console.error("[submitHaiku] upload returned non-https URL:", uploadResult);
            alert("画像の保存に失敗しました。");
            return;
          }
          imageUrlForInsert = uploadResult;
        } else if (rawImageUrl.startsWith("https://")) {
          imageUrlForInsert = rawImageUrl;
        }
      }

      const haikuPayload = {
        session_id: session.id,
        participant_id: participant.id,
        user_id: userIdForInsert,
        content: myHaiku,
        submitted_at: new Date().toISOString(),
        ...(imageUrlForInsert && { image_url: imageUrlForInsert }),
      };
      console.log("C: DB Payload:", haikuPayload);

      const { error: upsertError } = await supabase.from("haikus").upsert(
        haikuPayload,
        { onConflict: "session_id,participant_id" },
      );

      if (upsertError) {
        console.error("[Supabase] haikus upsert failed:", upsertError.message);
      } else {
        // 投稿成功：履歴の最新エントリに image_url を反映（localStorage フォールバック用）
        if (imageUrlForInsert) {
          setHaikuHistory((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[0] = { ...updated[0], image_url: imageUrlForInsert };
            }
            saveHistory(updated);
            return updated;
          });
        }
        // クールダウン開始（localStorage に保存してリロード後も維持）
        const now = Date.now();
        setLastHaikuSubmitTimestamp(now);
        setIsCoolingDown(true);
        setCoolDownSecondsRemaining(HAIKU_COOLDOWN_SECONDS);
      }
    } catch (e) {
      console.error("[Supabase] unexpected error in submitHaiku:", e);
    } finally {
      setIsSubmittingHaiku(false);
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
        const content = haiku.content ?? "";
        setPartnerHaiku(content);
        setShowPartner(true);
        if (content.trim() && !partnerSavedToHistoryRef.current) {
          partnerSavedToHistoryRef.current = true;
          saveToHistory(content.trim(), kigo, season, "相手");
        }
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
      if (partner && partner.trim() && !partnerSavedToHistoryRef.current) {
        partnerSavedToHistoryRef.current = true;
        saveToHistory(partner.trim(), kigo, season, "相手");
      }
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
    setHostViewingKigoDict(false);
    setImageSuggestions(null);
    setSharedImageDataUrl(null);
    partnerSavedToHistoryRef.current = false;
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
            seasonTheme={seasonTheme}
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
            aiSuggestionRemaining={aiSuggestionRemaining}
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
            sharedImageDataUrl={sharedImageDataUrl}
            onImageFileSelect={analyzeImageForHaiku}
            onResetImageSuggestions={() => {
              setImageSuggestions(null);
              setSharedImageDataUrl(null);
            }}
            onConfirmKigoFromPhoto={updateSessionKigo}
            onSelectKigoFromDict={updateSessionKigo}
            hostViewingKigoDict={hostViewingKigoDict}
            onKigoDictOpenChange={handleKigoDictOpenChange}
            hasAiSuggestions={aiSuggestions.length > 0}
            isGeneratingSuggestions={isGeneratingSuggestions}
            aiSuggestions={aiSuggestions}
            userId={userId}
            isSubmittingHaiku={isSubmittingHaiku}
            isCoolingDown={isCoolingDown}
            coolDownSecondsRemaining={coolDownSecondsRemaining}
            onHandwritingComplete={handleHandwritingComplete}
            isHandwritingOcrLoading={isHandwritingOcrLoading}
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

  // ユーザーID読み込み中はローディング表示。未確定のままセッション画面へ進まない。
  if (userIdLoading) {
    return (
      <div className={`${APP_ROOT_SHELL_CLASS} relative flex items-center justify-center px-2 sm:px-4`}>
        {seasonTheme === "sakura" && <SakuraPetals />}
        <div className="relative z-10 text-center">
          <p className="text-xl sm:text-2xl text-stone-600 animate-pulse">読み込み中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${APP_ROOT_SHELL_CLASS} relative flex flex-col`}>
      {seasonTheme === "sakura" && <SakuraPetals />}
      <div
        className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden touch-pan-y px-2 sm:px-4 py-4 min-h-0"
      >
        <div className="min-h-full flex flex-col items-center justify-center py-8 sm:py-10">
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
          kigo={currentKigoForHaiga}
          season={currentSeasonForHaiga}
          author="私"
          onClose={() => setShowHaigaModal(false)}
          onSaveToHistory={saveToHistory}
          onOpenShareCard={openShareCard}
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
      </div>
    </div>
  );
}
