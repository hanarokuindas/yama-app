import { useEffect, useState } from 'react'
import GameIcon from '../components/GameIcon'
import { HomeButton } from '../components/PlankButton'
import { Window, Tile, PointPlank } from '../components/ui'
import { ui, FS } from '../components/uiStyles'
import { BG } from '../assets/backgrounds'
import { UI } from '../assets/ui'
import { senpaiMini } from '../assets/characters/senpai'
import { useGameStore } from '../stores/gameStore'
import itemsData from '../data/items.json'
import { itemUses } from '../data/equipment'
import { sfx } from '../utils/sound'

/* 装備：山ショップ／マイアイテムの2ページ。カテゴリは後日の表で変更予定 */
const CATEGORIES = ['すべて', 'ウェア', 'シューズ', '小物', 'バッグ', '食料', '道具', '救急', '必需品']

function usesText(item) {
  const n = itemUses(item)
  return n == null ? '消耗しない' : `${n}回の登山で消耗`
}

export default function Shop() {
  const points = useGameStore((s) => s.player.points)
  const [page, setPage] = useState('shop') // shop / mine

  return (
    <div style={{ ...st.root, backgroundImage: `url(${page === 'shop' ? BG.shop : BG.myroom})` }}>
      <div style={st.topBar}>
        <PointPlank points={points} />
        <div style={st.tabs}>
          {[['shop', '山ショップ'], ['mine', 'マイアイテム']].map(([id, label]) => (
            <button key={id} style={{ ...st.tab, ...(page === id ? st.tabOn : null) }}
              onClick={() => { sfx.tap(); setPage(id) }}>
              <span className="icon-label" style={st.tabLabel}>{label}</span>
            </button>
          ))}
        </div>
        <HomeButton />
      </div>
      {page === 'shop' ? <ShopPage /> : <MyItemsPage />}
    </div>
  )
}

/* ───────── 山ショップ ───────── */
function ShopPage() {
  const points = useGameStore((s) => s.player.points)
  const inventory = useGameStore((s) => s.inventory)
  const spendPoints = useGameStore((s) => s.spendPoints)
  const addItem = useGameStore((s) => s.addItem)
  const [cat, setCat] = useState('すべて')
  const [selected, setSelected] = useState(null)
  const [msg, setMsg] = useState('')

  const owned = new Map(inventory.map((i) => [i.id, i]))
  const list = cat === 'すべて' ? itemsData : itemsData.filter((i) => i.category === cat)
  const have = selected && owned.get(selected.id)
  const after = selected ? points - selected.price : points

  const buy = () => {
    if (!spendPoints(selected.price)) {
      sfx.miss()
      setMsg(`ポイントが足りないよ（あと ${(selected.price - points).toLocaleString()}pt）`)
      return
    }
    sfx.coin()
    addItem(selected)
    setMsg(`${selected.name}を買ったよ！`)
  }

  return (
    <div style={st.body}>
      <div style={st.listSide}>
        <div style={st.cats}>
          {CATEGORIES.map((c) => (
            <button key={c} style={{ ...st.cat, ...(cat === c ? st.catOn : null) }}
              onClick={() => { sfx.tap(); setCat(c) }}>{c}</button>
          ))}
        </div>
        <div style={st.grid}>
          {list.map((item) => (
            <Tile key={item.id} active={selected?.id === item.id}
              onClick={() => { sfx.tap(); setSelected(item); setMsg('') }}>
              <GameIcon name={item.icon} size={64} style={st.tileIcon} />
              <span style={st.tileName}>{item.name}</span>
              <span style={st.tilePrice}>{item.price === 0 ? '無料' : `${item.price.toLocaleString()}pt`}</span>
              {owned.has(item.id) && <span style={st.ownedBadge}>持ってる</span>}
            </Tile>
          ))}
        </div>
      </div>

      {/* 右：先輩のアドバイス */}
      <div style={st.adviceSide}>
        <div style={{ ...ui.bubble, ...st.adviceBubble }}>
          {selected ? (
            <>
              <div style={st.adviceHead}>
                <GameIcon name={selected.icon} size={40} />
                <div>
                  <div style={st.adviceName}>{selected.name}</div>
                  <div style={st.adviceCat}>{selected.category} ・ {usesText(selected)}</div>
                </div>
              </div>
              <p style={st.adviceText}>{selected.advice}</p>
            </>
          ) : (
            <p style={st.adviceText}>気になる装備をタップしてね！{'\n'}選び方のコツを教えるよ</p>
          )}
          <div style={st.bubbleTail} />
        </div>
        {/* 下：値段と購入（左）・ミニ先輩（右） */}
        <div style={st.buyRow}>
          <div style={st.buyBox}>
            {selected && (have ? (
              <p style={st.haveText}>
                持っているよ{have.usesLeft != null ? `（あと${have.usesLeft}回）` : ''}
              </p>
            ) : (
              <>
                <div style={st.priceRow}>
                  <span>{selected.price === 0 ? '無料' : `${selected.price.toLocaleString()}pt`}</span>
                  <span style={{ ...st.afterText, color: after < 0 ? '#d0402b' : 'var(--brown-text)' }}>
                    購入後 {after.toLocaleString()}pt
                  </span>
                </div>
                <button className="btn-primary" style={st.buyBtn} onClick={buy}>購入する</button>
              </>
            ))}
            {msg && <p style={st.msg}>{msg}</p>}
          </div>
          <img src={selected ? senpaiMini.glassesWink : senpaiMini.glassesSmile} alt="" style={st.senpai} draggable={false} />
        </div>
      </div>
    </div>
  )
}

/* ───────── マイアイテム ───────── */
function MyItemsPage() {
  const inventory = useGameStore((s) => s.inventory)
  const wornOut = useGameStore((s) => s.wornOut)
  const clearWornOut = useGameStore((s) => s.clearWornOut)
  const [detail, setDetail] = useState(null)
  // 「消耗しました！」は一度見せたら消す
  const [justWorn] = useState(() => wornOut.map((w) => w.id))
  useEffect(() => { clearWornOut() }, [clearWornOut])

  const owned = new Map(inventory.map((i) => [i.id, i]))
  const ownedCount = itemsData.filter((i) => owned.has(i.id)).length

  return (
    <div style={{ ...st.body, flexDirection: 'column' }}>
      <div style={st.mineHead}>
        <span style={st.mineCount}>持っている装備 {ownedCount} / {itemsData.length}</span>
      </div>
      <div style={{ ...st.grid, gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(78px, 22cqh, 130px), 1fr))' }}>
        {itemsData.map((item) => {
          const have = owned.get(item.id)
          const worn = !have && justWorn.includes(item.id)
          return (
            <Tile key={item.id} onClick={() => { sfx.tap(); setDetail(item) }}
              style={have ? null : st.notOwned}>
              <GameIcon name={item.icon} size={64} style={{ ...st.tileIcon, ...(have ? null : st.grayIcon) }} />
              <span style={st.tileName}>{item.name}</span>
              {have && have.usesLeft != null && <span style={st.usesLeft}>あと{have.usesLeft}回</span>}
              {worn && <span style={st.wornStamp}>消耗しました！</span>}
            </Tile>
          )
        })}
      </div>
      {detail && <ItemDetail item={detail} have={owned.get(detail.id)} onClose={() => setDetail(null)} />}
    </div>
  )
}

/* 詳細のポップ（先輩なし） */
function ItemDetail({ item, have, onClose }) {
  return (
    <Window title={item.name} onClose={onClose} width={560}>
      <div style={st.detail}>
        <GameIcon name={item.icon} size={120} style={{ ...st.detailIcon, ...(have ? null : st.grayIcon) }} />
        <div style={{ flex: 1 }}>
          <div style={st.adviceCat}>{item.category} ・ {usesText(item)}</div>
          <p style={st.detailText}>{item.advice}</p>
          <p style={st.haveText}>
            {have
              ? `持っているよ${have.usesLeft != null ? `（あと${have.usesLeft}回の登山で消耗）` : ''}`
              : 'まだ持っていないよ。山ショップで買えるよ'}
          </p>
        </div>
      </div>
    </Window>
  )
}

const st = {
  root: {
    position: 'relative',
    height: '100cqh',
    display: 'flex', flexDirection: 'column',
    backgroundSize: 'cover', backgroundPosition: 'center',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    padding: '1.5cqh 1.5cqw',
    flexShrink: 0,
  },
  tabs: { display: 'flex', gap: 'clamp(6px, 1.5cqw, 14px)' },
  tab: {
    height: 'clamp(36px, 11cqh, 64px)', padding: '0 clamp(14px, 3cqw, 30px)',
    background: `url(${UI.plankShort}) center / 100% 100% no-repeat`,
    border: 'none', cursor: 'pointer',
    filter: 'drop-shadow(0 2px 3px rgba(60,40,20,0.35)) brightness(0.8) saturate(0.7)',
    transition: 'filter 0.15s, transform 0.15s',
  },
  tabOn: {
    filter: 'drop-shadow(0 3px 6px rgba(60,40,20,0.45))',
    transform: 'scale(1.08)',
  },
  tabLabel: { fontSize: FS(4.4, 14, 22) },

  body: {
    flex: 1, minHeight: 0,
    display: 'flex', gap: 'clamp(8px, 1.5cqw, 16px)',
    padding: '0 1.5cqw 2cqh',
  },
  listSide: {
    flex: '0 0 62%', minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.6cqh, 10px)',
    background: 'rgba(250,244,232,0.82)', borderRadius: 18, padding: 'clamp(8px, 2cqh, 14px)',
    border: '2px solid var(--beige-edge)',
  },
  cats: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  cat: {
    padding: '4px 12px', borderRadius: 99,
    border: '2px solid var(--beige-edge)', background: '#fff',
    color: 'var(--brown-text)', fontSize: FS(3.4, 12, 15), fontWeight: 800, cursor: 'pointer',
  },
  catOn: { background: 'linear-gradient(135deg, #f8c537, #e0a000)', color: '#4a2e00', border: '2px solid #c58f00' },
  grid: {
    flex: 1, minHeight: 0, overflowY: 'auto',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(76px, 21cqh, 124px), 1fr))',
    gap: 'clamp(8px, 2.2cqh, 14px)', alignContent: 'start',
    padding: '2px 2px 8px',
  },
  tileIcon: { width: '46%', height: '46%' },
  tileName: { fontSize: FS(3, 10.5, 14), textAlign: 'center', lineHeight: 1.2 },
  tilePrice: {
    fontSize: FS(3.2, 11, 15), color: 'var(--yamabuki)',
    textShadow: '0 0 2px #5a3a10, 0 0 2px #5a3a10',
  },
  ownedBadge: {
    position: 'absolute', top: 4, right: 4,
    background: '#1a8a47', color: '#fff', fontSize: 10, fontWeight: 800,
    padding: '1px 6px', borderRadius: 8,
  },

  adviceSide: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2.4cqh, 14px)',
  },
  adviceBubble: {
    position: 'relative',
    flex: '0 1 auto', minHeight: 0, overflowY: 'auto',
    padding: 'clamp(8px, 2.6cqh, 16px) clamp(10px, 1.6cqw, 16px)',
  },
  bubbleTail: {
    position: 'absolute', bottom: -10, right: 'clamp(30px, 10cqh, 70px)',
    width: 16, height: 16, background: '#fffdf7',
    borderRight: '2px solid var(--beige-edge)', borderBottom: '2px solid var(--beige-edge)',
    transform: 'rotate(45deg)',
  },
  adviceHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  adviceName: { fontSize: FS(4.2, 14, 20), fontWeight: 800, color: 'var(--brown-text)' },
  adviceCat: { fontSize: 12, color: '#8b7a66', fontWeight: 700 },
  adviceText: { fontSize: FS(3.6, 12.5, 16), margin: '4px 0', whiteSpace: 'pre-wrap', color: 'var(--brown-text)' },
  buyRow: { display: 'flex', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  buyBox: { flex: 1, minWidth: 0, paddingBottom: 4 },
  priceRow: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap',
    fontSize: FS(4.4, 15, 22), fontWeight: 800, color: 'var(--brown-text)',
    background: 'rgba(250,244,232,0.92)', borderRadius: 12, padding: '2px 10px',
  },
  afterText: { fontSize: FS(3.4, 12, 16) },
  buyBtn: { marginTop: 6, padding: 'clamp(6px, 2cqh, 10px) 0', fontSize: FS(4, 14, 18) },
  haveText: {
    color: '#1a8a47', fontSize: 14, fontWeight: 800, margin: 0,
    background: 'rgba(250,244,232,0.92)', borderRadius: 12, padding: '6px 10px',
  },
  msg: {
    color: '#8b5a00', fontSize: 13, fontWeight: 800, margin: '6px 0 0',
    background: 'rgba(250,244,232,0.92)', borderRadius: 12, padding: '4px 10px',
  },
  senpai: {
    flexShrink: 0,
    height: 'clamp(80px, 30cqh, 240px)', width: 'auto',
    filter: 'drop-shadow(0 6px 12px rgba(40,25,10,0.35))',
    pointerEvents: 'none',
  },

  mineHead: { display: 'flex', justifyContent: 'flex-end', flexShrink: 0 },
  mineCount: {
    background: 'rgba(250,244,232,0.9)', border: '2px solid var(--beige-edge)', borderRadius: 99,
    padding: '3px 14px', color: 'var(--brown-text)', fontSize: 13, fontWeight: 800,
  },
  notOwned: { background: '#e9e4dc', boxShadow: '0 5px 0 #bdb3a3, 0 7px 12px rgba(60,40,20,0.12)', color: '#9a9088' },
  grayIcon: { filter: 'grayscale(1)', opacity: 0.45 },
  usesLeft: { fontSize: 11, color: '#8b7a66' },
  wornStamp: {
    position: 'absolute', inset: '30% -4px auto',
    transform: 'rotate(-12deg)',
    background: 'rgba(208,64,43,0.92)', color: '#fff',
    fontSize: FS(3.2, 11, 15), fontWeight: 800, textAlign: 'center',
    borderRadius: 6, padding: '3px 0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    animation: 'popIn 0.5s ease both',
  },
  detail: { display: 'flex', gap: 16, alignItems: 'center' },
  detailIcon: { width: 'clamp(70px, 26cqh, 130px)', height: 'clamp(70px, 26cqh, 130px)', flexShrink: 0 },
  detailText: { color: 'var(--brown-text)', fontSize: 14.5, lineHeight: 1.7, margin: '6px 0' },
}
