import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

export default function ExploreGame({ onClear, onGameOver }) {
  const gameRef = useRef(null)
  const phaserRef = useRef(null)

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 360,
      height: 500,
      parent: gameRef.current,
      backgroundColor: '#1a1a2e',
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
    let filmSlots = []

    function create() {
      // タイマー表示
      timerText = this.add.text(16, 16, '残 2:30', {
        fontSize: '20px',
        fill: '#ffffff',
        fontStyle: 'bold',
      })

      // スコア表示
      scoreText = this.add.text(16, 44, 'スコア: 0', {
        fontSize: '16px',
        fill: '#ffffff',
      })

      // フィルムスロット表示
      for (let i = 0; i < filmCapacity; i++) {
        const slot = this.add.rectangle(
          30 + i * 52, 470, 44, 44, 0x333333
        ).setStrokeStyle(2, 0xffffff)
        filmSlots.push(slot)
      }

      // アイテムを配置
      spawnItems.call(this)

      // 1秒ごとのタイマー
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          timeLeft--
          const min = Math.floor(timeLeft / 60)
          const sec = timeLeft % 60
          timerText.setText(`残 ${min}:${sec.toString().padStart(2, '0')}`)

          if (timeLeft <= 0) {
            onGameOver(score)
            phaserRef.current.destroy(true)
          }
        },
        loop: true,
      })
    }

    function spawnItems() {
      const emojis = ['🪨', '💎', '🌿', '🍄', '🦋', '🐾', '🌸', '⛏️']
      for (let i = 0; i < 8; i++) {
        const x = Phaser.Math.Between(30, 330)
        const y = Phaser.Math.Between(80, 420)
        const emoji = emojis[Math.floor(Math.random() * emojis.length)]

        const item = this.add.text(x, y, emoji, {
          fontSize: '36px',
        })
        .setInteractive()
        .on('pointerdown', () => {
          score += 100
          scoreText.setText(`スコア: ${score}`)
          item.destroy()
          items = items.filter(i => i !== item)

          film.push(emoji)

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
              score += 500
              scoreText.setText(`スコア: ${score}`)
            }
          })

          // アイテムが全部なくなったらクリア
          if (items.length === 0) {
            onClear(score)
            phaserRef.current.destroy(true)
          }
        })
        items.push(item)
      }
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
    }} />
  )
}
