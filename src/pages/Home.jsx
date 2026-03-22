import { useGameStore } from '../stores/gameStore'

export default function Home() {
  const points = useGameStore((state) => state.player.points)
  const addPoints = useGameStore((state) => state.addPoints)

  return (
    <div>
      <h1>ホーム画面</h1>
      <p>ポイント：{points}</p>
      <button onClick={() => addPoints(100)}>
        ポイント+100（テスト）
      </button>
    </div>
  )
}
