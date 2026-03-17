/** 各ステップの説明データ */
export interface StepData {
  title: string;
  /** どこを見るか */
  lookAt: string[];
  /** 何をするか */
  actions: string[];
  /** 応援の一言 */
  nudge: string;
}

export type HelpVariant = "session" | "home" | "host-wait" | "join";

// =========================
// 🏠 ホーム画面
// =========================

/** 1. ホーム（共通） */
export const HOME_STEPS: StepData[] = [
  {
    title: "ホーム",
    lookAt: ["「操作ガイド」", "「■ 応援の一言」"],
    actions: [
      "① お名前を入れてください",
      "俳句のときに使うお名前です",
      "② 次に進みます",
      "「座を立てる」：はじめる方はこちら",
      "「座に参加」：お誘いを受けた方はこちら",
    ],
    nudge: "はじめの一歩です。お名前を入れるだけで、もう句会の仲間です",
  },
];

/** 2. ホスト（座を立てる方） */
export const HOST_WAIT_STEPS: StepData[] = [
  {
    title: "ホスト（座を立てる方）",
    lookAt: ["「操作ガイド」", "「■ 応援の一言」"],
    actions: [
      "① 表示された番号（ID）をお相手に伝えます",
      "またはQRコードを見せます",
      "② お相手が入ってくるのを、少し待ちます",
      "③ そろったら、句会を始めます",
    ],
    nudge: "あなたが今日の場をひらく人です。ゆっくりで大丈夫です",
  },
];

/** 3. ゲスト（座に参加する方） */
export const JOIN_STEPS: StepData[] = [
  {
    title: "ゲスト（座に参加する方）",
    lookAt: ["「操作ガイド」", "「■ 応援の一言」"],
    actions: [
      "① 教えてもらった番号を入れます",
      "またはQRコードを読み取ります",
      "② 「参加する」を押します",
      "③ お題が出るまで、少しお待ちください",
    ],
    nudge: "もうすぐ句会が始まります。どんな言葉が浮かぶか楽しみですね",
  },
];

// =========================
// ✍️ 俳句作成画面
// =========================

/** Step 1 / 5：写真からお題を決める（ホスト） */
const SESSION_STEP1_HOST: StepData = {
  title: "写真からお題を決める",
  lookAt: ["写真からおすすめの季語", "季語の一覧", "「この季語をお題にする」ボタン"],
  actions: [
    "季語（きご）を探します（写真からおすすめが出てきます／または一覧から選べます）",
    "気に入った言葉を指で押します",
    "「この季語をお題にする」を押します",
  ],
  nudge: "この写真のどこが、お心に残りましたか？その思いが、今日の一句になります",
};

/** Step 1 / 5：お題が出るまで待つ（ゲスト） */
const SESSION_STEP1_GUEST: StepData = {
  title: "お題が出るまで待つ",
  lookAt: ["「ホストがお題を探しています…」の表示", "お題（季語）が表示されるエリア"],
  actions: ["お題が出るまで、少しお待ちください", "お題が出たら「次へ」を押します"],
  nudge: "もうすぐ句会が始まります。どんな言葉が浮かぶか楽しみですね",
};

/** Step 2 / 5：句を詠む */
const SESSION_STEP2: StepData = {
  title: "句を詠む",
  lookAt: ["入力欄", "「指で書く」ボタン", "手書き画面の「これで決める」"],
  actions: [
    "「指で書く」を押します",
    "ゆっくり俳句を書きます（一文字ずつ／五・七・五の形にしてみましょう）",
    "「これで決める」を押します",
    "文字の読み取りを待ちます",
  ],
  nudge: "ゆっくり書くと、きれいに読み取れます。指を動かすのも、よい体操になります",
};

/** Step 3 / 5：AIに相談 */
const SESSION_STEP3: StepData = {
  title: "AIに相談",
  lookAt: ["表示された句（編集できます）", "「AIに相談する」ボタン", "提案一覧"],
  actions: [
    "表示された句を確認します（間違いがあれば直せます）",
    "「AIに相談する」を押します",
    "提案の中から気に入ったものを選びます",
    "次へ進みます",
  ],
  nudge: "AIさんが少し言葉を整えてくれました。お好きな表現を選んでください",
};

/** Step 4 / 5：提出する */
const SESSION_STEP4: StepData = {
  title: "提出する",
  lookAt: ["最終確認の句", "「みんなに送る」ボタン"],
  actions: [
    "もう一度ゆっくり読みます",
    "気になるところがあれば直します",
    "「みんなに送る」を押します",
  ],
  nudge: "世界にひとつだけの、あなたの一句です",
};

/** Step 5 / 5：披講（鑑賞） */
const SESSION_STEP5: StepData = {
  title: "披講（鑑賞）",
  lookAt: ["みんなの句", "「句の履歴」", "印刷関連のボタン（プレビュー/印刷）"],
  actions: [
    "みんなの句をゆっくり眺めます",
    "「句の履歴」から過去の作品も見られます",
    "印刷したい句を選びます",
    "印刷の設定をします（プレビューや印を選べます）",
    "印刷ボタンを押して待ちます",
  ],
  nudge: "ノートに貼って、日付や出来事を書き添えると、思い出の一冊になります",
};

export const STEPS_HOST: StepData[] = [
  SESSION_STEP1_HOST,
  SESSION_STEP2,
  SESSION_STEP3,
  SESSION_STEP4,
  SESSION_STEP5,
];

export const STEPS_GUEST: StepData[] = [
  SESSION_STEP1_GUEST,
  SESSION_STEP2,
  SESSION_STEP3,
  SESSION_STEP4,
  SESSION_STEP5,
];

export function getStepsForVariant(
  variant: HelpVariant,
  role: "host" | "guest"
): StepData[] {
  switch (variant) {
    case "home":
      return HOME_STEPS;
    case "host-wait":
      return HOST_WAIT_STEPS;
    case "join":
      return JOIN_STEPS;
    default:
      return role === "guest" ? STEPS_GUEST : STEPS_HOST;
  }
}
