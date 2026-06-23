import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_MOUNTAINS = {
  yatsugatake: {
    unlocked: true,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
  },
  takao: {
    unlocked: true,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
  },
  hakone: {
    unlocked: false,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
  },
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      // プレイヤー基本情報
      player: {
        name: '',
        weight: 60,
        points: 10000,
        // 3軸ステータス
        core: 0,    // 体幹
        legs: 0,    // 脚力
        arms: 0,    // 腕力
      },

      // 解禁フラグ
      flags: {
        introCompleted: false,
        profileCompleted: false,
        shopUnlocked: false,
        climbingUnlocked: false,
        maintenanceUnlocked: false,
        arUnlocked: false,
      },

      // 各山の状態
      mountains: DEFAULT_MOUNTAINS,

      // 所持アイテム
      inventory: [],

      // アルバム（登頂写真）
      album: [],

      // --- 計算プロパティ（getter） ---
      getTotalStamina: () => {
        const { core, legs, arms } = get().player
        return Math.floor((core + legs + arms) / 3)
      },

      // --- アクション ---
      addPoints: (amount) => set((state) => ({
        player: { ...state.player, points: state.player.points + amount }
      })),

      spendPoints: (amount) => {
        const current = get().player.points
        if (current < amount) return false
        set((state) => ({
          player: { ...state.player, points: state.player.points - amount }
        }))
        return true
      },

      // 体幹トレーニング
      addCore: (amount) => set((state) => ({
        player: { ...state.player, core: state.player.core + amount }
      })),

      // 脚力トレーニング
      addLegs: (amount) => set((state) => ({
        player: { ...state.player, legs: state.player.legs + amount }
      })),

      // 腕力トレーニング
      addArms: (amount) => set((state) => ({
        player: { ...state.player, arms: state.player.arms + amount }
      })),

      // 温泉回復（総合体力の一定割合を各ステータスに加算）
      recover: (amount) => set((state) => ({
        player: {
          ...state.player,
          core: state.player.core + amount,
          legs: state.player.legs + amount,
          arms: state.player.arms + amount,
        }
      })),

      setPlayerName: (name) => set((state) => ({
        player: { ...state.player, name }
      })),

      setPlayerWeight: (weight) => set((state) => ({
        player: { ...state.player, weight }
      })),

      completeIntro: () => set((state) => ({
        flags: { ...state.flags, introCompleted: true }
      })),

      completeProfile: () => set((state) => ({
        flags: { ...state.flags, profileCompleted: true }
      })),

      unlockShopping: () => set((state) => ({
        flags: { ...state.flags, shopUnlocked: true }
      })),

      unlockClimbing: () => set((state) => ({
        flags: { ...state.flags, climbingUnlocked: true }
      })),

      unlockMaintenance: () => set((state) => ({
        flags: { ...state.flags, maintenanceUnlocked: true }
      })),

      unlockAR: () => set((state) => ({
        flags: { ...state.flags, arUnlocked: true }
      })),

      addItem: (item) => set((state) => ({
        inventory: [...state.inventory, { ...item, purchasedAt: new Date().toISOString() }]
      })),

      hasItem: (itemId) => {
        return get().inventory.some((i) => i.id === itemId)
      },

      completeCourse: (mountainId, courseId) => set((state) => {
        const prev = state.mountains[mountainId]
        if (prev.summitedCourses.includes(courseId)) return state
        return {
          mountains: {
            ...state.mountains,
            [mountainId]: {
              ...prev,
              summitedCourses: [...prev.summitedCourses, courseId],
            }
          }
        }
      }),

      setMountainAccessed: (mountainId) => set((state) => ({
        mountains: {
          ...state.mountains,
          [mountainId]: {
            ...state.mountains[mountainId],
            firstAccessed: true,
          }
        }
      })),

      addAlbumEntry: (entry) => set((state) => ({
        album: [...state.album, { ...entry, date: new Date().toISOString() }]
      })),

      maintainMountain: (mountainId, restoreAmount) => set((state) => ({
        mountains: {
          ...state.mountains,
          [mountainId]: {
            ...state.mountains[mountainId],
            maintenanceLevel: Math.min(100, state.mountains[mountainId].maintenanceLevel + restoreAmount),
            lastMaintainedAt: new Date().toISOString(),
          }
        }
      })),

      // 時間経過による山の荒廃（呼び出し時に計算）
      applyMountainDecay: () => set((state) => {
        const now = Date.now()
        const updated = { ...state.mountains }
        Object.keys(updated).forEach((key) => {
          const m = updated[key]
          if (!m.lastMaintainedAt) return
          const elapsed = now - new Date(m.lastMaintainedAt).getTime()
          const daysPassed = elapsed / (1000 * 60 * 60 * 24)
          // 1日ごとに5ポイント劣化
          const decay = Math.floor(daysPassed * 5)
          if (decay > 0) {
            updated[key] = {
              ...m,
              maintenanceLevel: Math.max(0, m.maintenanceLevel - decay),
              lastMaintainedAt: new Date().toISOString(),
            }
          }
        })
        return { mountains: updated }
      }),
    }),
    {
      name: 'yama-app-storage',
    }
  )
)
