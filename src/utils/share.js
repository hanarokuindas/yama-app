/* 記録のSNS共有。Web Share API が使える端末では共有シート、
   使えない環境（PCブラウザなど）ではクリップボードにコピーする。 */

const SITE = 'https://hanarokuindas.github.io/yama-app/'

export function buildSummitText({ playerName, mountainName, courseName, total, rate }) {
  const who = playerName ? `${playerName}は` : ''
  return [
    `${who}「${mountainName} ${courseName}」に登頂しました！`,
    `総合体力 ${total} ／ アルバムコンプ率 ${rate}%`,
    '',
    '#山アプリ',
    SITE,
  ].join('\n')
}

/* メニューの「SNS」：自分の記録（登った山・アルバムのコンプ率など） */
export function buildRecordText({ playerName, level, total, climbed, courseCount, discovered, totalSpecimens }) {
  const who = playerName ? `${playerName}さん` : 'わたし'
  const rate = Math.round((discovered / totalSpecimens) * 100)
  return [
    `${who}の山の記録（Lv.${level}・総合体力 ${total}）`,
    climbed.length ? `登った山：${climbed.join('・')}（${courseCount}コース）` : '登った山：まだこれから！',
    `アルバム ${discovered} / ${totalSpecimens} 種（コンプ率 ${rate}%）`,
    '',
    '#山アプリ',
    SITE,
  ].join('\n')
}

/**
 * 共有を実行する。
 * @returns {Promise<'shared'|'copied'|'cancelled'|'failed'>}
 */
export async function shareText(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (e) {
      // ユーザーが共有シートを閉じただけなら失敗扱いにしない
      if (e && e.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
