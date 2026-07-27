/* GameIconのSVGをcanvas(Phaser)用のHTMLImageElementに変換する */
import { renderToStaticMarkup } from 'react-dom/server'
import GameIcon, { iconImageUrl } from '../components/GameIcon'

export function iconDataUri(name, size = 48) {
  // 外部生成画像があればそのURLをそのまま使う
  const override = iconImageUrl(name)
  if (override) return override
  const svg = renderToStaticMarkup(<GameIcon name={name} size={size} />)
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

/* 複数アイコンを読み込み済みImage要素の辞書として返す */
export function preloadIconImages(names, size = 48) {
  return Promise.all(
    names.map(
      (n) =>
        new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve([n, img])
          img.onerror = reject
          img.src = iconDataUri(n, size)
        })
    )
  ).then(Object.fromEntries)
}
