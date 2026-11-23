/* 登れる山の一覧（並びは登山トップの並び：修正指示・最新ラフどおり）。
   ふもとの里山はテスト用。リリースの際には消す（一問一答 2026-11-23） */
export const MOUNTAINS = [
  {
    id: 'yatsugatake', name: '八ヶ岳連峰', short: '八ヶ岳', pref: '長野県・山梨県', height: '2,899m（赤岳）',
    intro: 'フォッサマグナの中央で噴火と浸食を繰り返し、秀麗な谷を造った火山群',
    lat: 35.9708, lon: 138.3703,
  },
  {
    id: 'takao', name: '高尾山', short: '高尾山', pref: '東京都', height: '599m',
    intro: '都心から近く、多くの人に親しまれてきた信仰と自然の山（仮の文）',
    lat: 35.6251, lon: 139.2437,
  },
  {
    id: 'hakone', name: '箱根山', short: '箱根連山', pref: '神奈川県・静岡県', height: '1,438m（神山）',
    intro: '火山活動がつくった湖と温泉に恵まれた山々（仮の文）',
    lat: 35.2333, lon: 139.0214,
  },
  {
    id: 'satoyama', name: 'ふもとの里山', short: 'ふもとの里山', pref: 'テスト用', height: '',
    intro: '登山に慣れるための練習の山（テスト用。リリースの際には消す）',
    test: true,
  },
]

export const MOUNTAIN_NAME = Object.fromEntries(MOUNTAINS.map((m) => [m.id, m.name]))
