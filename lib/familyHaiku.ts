/**
 * 母_俳句.csv のデータ（日付の新しい順）
 */
export interface FamilyHaikuEntry {
  date: string; // YYYY/M/D
  haiku: string;
}

const RAW_ENTRIES: FamilyHaikuEntry[] = [
  { date: '2025/3/1', haiku: 'ナラ枯れて　貧し森や　カタクリ咲く' },
  { date: '2017/6/1', haiku: '代搔きや　上を下へと　泥しぶき' },
  { date: '2016/7/1', haiku: 'ヤマユリの　白のまばゆし　風そよぐ' },
  { date: '2016/7/1', haiku: 'ヤマユリの　花の多さ　緑映ゆ' },
  { date: '2015/11/1', haiku: '干し籾に　枯れ葉舞い落ち　谷津田かな' },
  { date: '2015/6/1', haiku: '走る水　ホトケドジョウ　群れ集う' },
  { date: '2014/12/1', haiku: '今日踏む　落ち葉も我も　歳重ね' },
  { date: '2014/12/1', haiku: 'むつまじく　紅葉踏みしめ　年送る' },
  { date: '2014/12/1', haiku: '落ち葉かき　熊手の先に　古き香り' },
  { date: '2013/7/1', haiku: '林縁に　ヤマユリ四五本　谷戸揺らす' },
  { date: '2011/11/1', haiku: '燻炭の　煙囲みて　集いけり' },
  { date: '2011/11/1', haiku: 'ワラボッチ　一年の息を　吸い込みぬ' },
  { date: '2011/9/1', haiku: 'ゴマの実の　はじける音や　乾きたり' },
  { date: '2011/7/1', haiku: '山路折れ　コジュケイの尾　藪に消え' },
  { date: '2011/6/1', haiku: '水匂う　畔にひらりと　キアゲハよ' },
  { date: '2011/2/1', haiku: '落とすまい　雪抱き枝　母の腕' },
  { date: '2011/2/1', haiku: '霜溶けて　音にぎわしき　谷戸の午後' },
  { date: '2011/1/1', haiku: '初仕事　仰ぎ見れば　白き富士' },
  { date: '2010/11/1', haiku: '稲去りて　ほっと一息　田圃かな' },
  { date: '2010/11/1', haiku: '草地より　濡れ顔覗く　スッポンタケ' },
  { date: '2010/7/1', haiku: '待望の　雨に息づく　我と稲' },
  { date: '2010/7/1', haiku: 'ネムの花　谷戸に紅差し　緑映え' },
  { date: '2010/6/1', haiku: '水澄て　鏡と化す　谷津田かな' },
  { date: '2010/5/1', haiku: '苗床に　朝の陽集め　露の網' },
  { date: '2010/5/1', haiku: '陽に笑い　雨に歌えり　小紫陽花' },
  { date: '2010/1/1', haiku: '陽を浴びて　照れ笑いする　アカマンマ' },
  { date: '2010/1/1', haiku: '見上ぐれば　ウリカエデ笑む　里の径' },
  { date: '2009/8/1', haiku: '畔草を　刈りて後の　涼しさよ' },
  { date: '2009/7/1', haiku: '夏緑　切りて走る　多摩の径' },
  { date: '2007/9/1', haiku: 'まだかなと　稲穂待つ身は　人の親' },
];

/** 日付の新しい順でソート済みの一覧 */
export const FAMILY_HAIKU_LIST: FamilyHaikuEntry[] = RAW_ENTRIES;

/** 日付文字列から「詠まれた時期」（例: 2010年5月）を返す */
export function formatFamilyHaikuDate(dateStr: string): string {
  const [y, m] = dateStr.split('/');
  if (y && m) return `${y}年${parseInt(m, 10)}月`;
  return dateStr;
}
