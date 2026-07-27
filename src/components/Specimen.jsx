import GameIcon from './GameIcon'
import { specimenSprite } from '../utils/specimenAssets'

/* 標本の絵。専用スプライトがあればそれを、無ければ既存アイコンで代用する */
export default function Specimen({ sp, size = 46, style }) {
  const url = specimenSprite(sp.id)
  if (url) {
    return (
      <img
        src={url} width={size} height={size} alt=""
        draggable={false}
        style={{ display: 'block', objectFit: 'contain', ...style }}
      />
    )
  }
  return <GameIcon name={sp.icon} size={size} style={style} />
}
