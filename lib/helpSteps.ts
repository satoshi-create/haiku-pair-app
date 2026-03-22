/** 各ステップの説明データ */
export interface StepData {
  title: string;
  /** 何をするか */
  actions: string[];
  /** 応援の一言 */
  nudge: string;
  /** 図解画像（public 配下のパス）。未指定時はプレースホルダ */
  imageSrc?: string;
}

export type HelpVariant = "session" | "home" | "host-wait" | "join";

// =========================
// 🏠 ホーム画面
// =========================

/** 1. ホーム（共通） */
export const HOME_STEPS: StepData[] = [
  {
    title: "ホーム",
    imageSrc: "/assets/guide/step/01_home.png",
    actions: [
      "① お名前を入れてください",
      "　俳句のときに使うお名前です",
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
    imageSrc: "/assets/guide/step/02_host_home.png",
    actions: [
      "① 表示された番号（ID）をお相手に伝えます",
      "　またはQRコードを見せます",
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
    imageSrc: "/assets/guide/step/03_guest_home.png",
    actions: [
      "① 教えてもらった番号を入れます",
      "　またはQRコードを読み取ります",
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
  actions: [
    "① 季語（きご）を探します",
    "　写真からおすすめが出てきます",
    "　または一覧から選べます",
    "② 気に入った言葉を指で押します",
    "③ 「この季語をお題にする」を押します",
  ],
  nudge: "この写真のどこが、お心に残りましたか？その思いが、今日の一句になります",
};

/** Step 1 / 5：お題が出るまで待つ（ゲスト） */
const SESSION_STEP1_GUEST: StepData = {
  title: "お題が出るまで待つ",
  actions: ["① お題が出るまで、少しお待ちください", "② お題が出たら「次へ」を押します"],
  nudge: "もうすぐ句会が始まります。どんな言葉が浮かぶか楽しみですね",
};

/** Step 2 / 5：句を詠む */
const SESSION_STEP2: StepData = {
  title: "句を詠む",
  actions: [
    "① 「指で書く」を押します",
    "② ゆっくり俳句を書きます",
    "　一文字ずつ書いていきます",
    "　五・七・五の形にしてみましょう",
    "③ 「これで決める」を押します",
    "④ 文字の読み取りを待ちます",
  ],
  nudge: "ゆっくり書くと、きれいに読み取れます。指を動かすのも、よい体操になります",
};

/** Step 3 / 5：AIに相談 */
const SESSION_STEP3: StepData = {
  title: "AIに相談",
  actions: [
    "① 表示された句を確認します",
    "　間違いがあれば直せます",
    "② 「AIに相談する」を押します",
    "③ 提案の中から気に入ったものを選びます",
    "④ 次へ進みます",
  ],
  nudge: "AIさんが少し言葉を整えてくれました。お好きな表現を選んでください",
};

/** Step 4 / 5：提出する */
const SESSION_STEP4: StepData = {
  title: "提出する",
  actions: [
    "① もう一度ゆっくり読みます",
    "② 気になるところがあれば直します",
    "③ 「みんなに送る」を押します",
  ],
  nudge: "世界にひとつだけの、あなたの一句です",
};

/** Step 5 / 5：披講（鑑賞） */
const SESSION_STEP5: StepData = {
  title: "披講（鑑賞）",
  actions: [
    "① みんなの句をゆっくり眺めます",
    "② 「句の履歴」から過去の作品も見られます",
    "③ 印刷したい句を選びます",
    "④ 印刷の設定をします",
    "　プレビューや印を選べます",
    "⑤ 印刷ボタンを押して待ちます",
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

export function getAllStepsForPrint(role: "host" | "guest"): StepData[] {
  if (role === "host") {
    return [...HOME_STEPS, ...HOST_WAIT_STEPS, ...STEPS_HOST];
  }
  return [...HOME_STEPS, ...JOIN_STEPS, ...STEPS_GUEST];
}
