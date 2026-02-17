"use client";

import { useEffect, useState } from "react";

export default function SupabaseDebugPage() {
  const [status, setStatus] = useState<{
    url: string;
    keySet: boolean;
    connected: boolean | null;
    error: string | null;
  }>({
    url: "",
    keySet: false,
    connected: null,
    error: null,
  });

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const keySet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !keySet) {
      setStatus({
        url: url || "(未設定)",
        keySet,
        connected: false,
        error: "環境変数が設定されていません",
      });
      return;
    }

    // 接続テスト: Supabase REST endpoint にヘルスチェック
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        // 軽量な接続確認 — テーブル不要
        const { error } = await supabase
          .from("_health_check_dummy")
          .select("*")
          .limit(1);
        // テーブルが無くても 4xx が返れば「接続自体は成功」
        if (error && error.code === "PGRST116") {
          // relation does not exist — 接続OK、テーブル未作成
          setStatus({ url, keySet, connected: true, error: null });
        } else if (error) {
          // 認証エラーや接続不可など
          setStatus({ url, keySet, connected: false, error: error.message });
        } else {
          setStatus({ url, keySet, connected: true, error: null });
        }
      } catch (e) {
        setStatus({
          url,
          keySet,
          connected: false,
          error: e instanceof Error ? e.message : "不明なエラー",
        });
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-bold">Supabase 接続デバッグ</h1>

        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-medium">URL</td>
              <td className="py-2">{status.url || "読み込み中..."}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-medium">Anon Key</td>
              <td className="py-2">
                {status.keySet ? (
                  <span className="text-green-600">設定済み</span>
                ) : (
                  <span className="text-red-600">未設定</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium">接続状態</td>
              <td className="py-2">
                {status.connected === null && "確認中..."}
                {status.connected === true && (
                  <span className="text-green-600">接続OK</span>
                )}
                {status.connected === false && (
                  <span className="text-red-600">
                    未接続{status.error && ` — ${status.error}`}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-xs text-gray-400">
          このページはデバッグ用です。本番環境では無効化してください。
        </p>
      </div>
    </div>
  );
}
