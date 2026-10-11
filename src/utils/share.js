/* 登頂記録のSNS共有。Web Share API が使える端末では共有シート、
   使えない環境（PCブラウザなど）ではクリップボードにコピーする。 */

const SITE = 'https://hanarokuindas.github.io/yama-app/'

export function buildSummitText({ playerName, mountainName, courseName, total, rate }) {
  const who = playerName ? `${playerName}は` : ''
  return [
    `${who}「${mountainName} ${courseName}」に登頂しました！`,
    `総合体力 ${total} ／ 図鑑コンプ率 ${rate}%`,
    '',
    '#山アプリ',
    SITE,
  ].join('\n')
}

export function buildAlbumText({ playerName, summitCount, rate, discovered, total }) {
  const who = playerName ? `${playerName}の` : ''
  return [
    `${who}登山記録：${summitCount}コース登頂`,
    `図鑑 ${discovered} / ${total} 種（${rate}%）`,
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
