import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

// 背景設定
const BACKGROUNDS = [
  { key: 'cave', color: '#1a1a2e', name: '岩場', itemEmojis: ['🪨', '💎', '⛏️', '🦇', '🔮', '🌑'] },
  { key: 'forest', color: '#1a3a1a', name: '登山道', itemEmojis: ['🌿', '🍄', '🦋', '🐾', '🌸', '🐿️'] },
  { key: 'meadow', color: '#2a4a1a', name: '草原', itemEmojis: ['🌼', '🦗', '🌺', '🍀', '🦎', '🌻'] },
]

export default function ExploreGame({ onClear, onGameOver }) {
  const gameRef = useRef(null)
  const phaserRef = useRef(null)

  useEffect(() => {
    // ランダムに背景を選択
    const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]

    const config = {
      type: Phaser.AUTO,
      width: 360,
      height: 500,
      parent: gameRef.current,
      backgroundColor: bg.color,
      scene: {
        create: create,
        update: update,
      }
    }

    phaserRef.current = new Phaser.Game(config)

    let timeLeft = 150
    let timerText
    let scoreText
    let score = 0
    let film = []
    const filmCapacity = 6
    let items = []
    let targetEmoji = ''

    function create() {
      // 背景名表示
      this.add.text(180, 16, bg.name, {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0)

      // タイマー表示
      timerText = this.add.text(270, 16, '残 2:30', {
        fontSize: '16px',
        fill: '#ffffff',
      })

      // スコア表示
      scoreText = this.add.text(16, 16, 'スコア: 0', {
        fontSize: '16px',
        fill: '#ffffff',
      })

      // 指定アイテム表示
      targetEmoji = bg.itemEmojis[Math.floor(Math.random() * bg.itemEmojis.length)]
      this.add.text(180, 44, `探せ！ ${targetEmoji}`, {
        fontSize: '20px',
        fill: '#ffff00',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0)

      // フィルムスロット
      for (let i = 0; i < filmCapacity; i++) {
        this.add.rectangle(
          30 + i * 52, 470, 44, 44, 0x333333
        ).setStrokeStyle(2, 0xaaaaaa)
      }

      // アイテム配置
      spawnItems.call(this)

      // タイマー
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          timeLeft--
          const min = Math.floor(timeLeft / 60)
          const sec = timeLeft % 60
          timerText.setText(`残 ${min}:${sec.toString().padStart(2, '0')}`)

          if (timeLeft <= 30) {
            timerText.setStyle({ fill: '#ff4444' })
          }

          if (timeLeft <= 0) {
            onGameOver(score)
            phaserRef.current.destroy(true)
          }
        },
        loop: true,
      })
    }

    function spawnItems() {
      // 指定アイテムを必ず3つ含める
      const allEmojis = [...bg.itemEmojis]
      const gameItems = []

      // 指定アイテムを3つ追加
      for (let i = 0; i < 3; i++) {
        gameItems.push(targetEmoji)
      }

      // 残り5つはランダム（指定アイテム以外）
      const otherEmojis = allEmojis.filter(e => e !== targetEmoji)
      for (let i = 0; i < 5; i++) {
        gameItems.push(otherEmojis[Math.floor(Math.random() * otherEmojis.length)])
      }

      // シャッフル
      gameItems.sort(() => Math.random() - 0.5)

      gameItems.forEach((emoji) => {
        const x = Phaser.Math.Between(30, 330)
        const y = Phaser.Math.Between(80, 430)

        const item = this.add.text(x, y, emoji, {
          fontSize: '36px',
        })
        .setInteractive()
        .on('pointerdown', () => {
          if (emoji === targetEmoji) {
            // 正解
            score += 200
            scoreText.setText(`スコア: ${score}`)

            // キラキラエフェクト
            this.add.text(item.x, item.y, '✨+200', {
              fontSize: '16px',
              fill: '#ffff00',
            })

            item.destroy()
            items = items.filter(i => i !== item)
            film.push(emoji)
          } else {
            // 不正解
            score = Math.max(0, score - 50)
            scoreText.setText(`スコア: ${score}`)

            // ミスエフェクト
            this.add.text(item.x, item.y, '❌-50', {
              fontSize: '16px',
              fill: '#ff4444',
            })

            item.destroy()
            items = items.filter(i => i !== item)
            film.push(emoji)
          }

          // フィルム満杯チェック
          if (film.length >= filmCapacity) {
            onGameOver(score)
            phaserRef.current.destroy(true)
            return
          }

          // 3つそろったら消す
          const counts = {}
          film.forEach(f => counts[f] = (counts[f] || 0) + 1)
          Object.entries(counts).forEach(([type, count]) => {
            if (count >= 3) {
              film = film.filter(f => f !== type)
              score += 300
              scoreText.setText(`スコア: ${score}`)
            }
          })

          // 全部なくなったらクリア
          if (items.length === 0) {
            onClear(score)
            phaserRef.current.destroy(true)
          }
        })
        items.push(item)
      })
    }

    function update() {}

    return () => {
      if (phaserRef.current) {
        phaserRef.current.destroy(true)
      }
    }
  }, [])

  return (
    <div ref={gameRef} style={{
      width: '360px',
      height: '500px',
      margin: '0 auto',
      borderRadius: '12px',
      overflow: 'hidden',
    }} />
  )
}
