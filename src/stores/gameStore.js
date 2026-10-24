import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TUTORIALS, nextStepIndex } from '../data/tutorial'

const DEFAULT_MOUNTAINS = {
  yatsugatake: {
    unlocked: true,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
    workingActivity: null,   // 整備作業中のアクティビティID
    workingUntil: null,      // 作業完了時刻(ISO)。この間はその山に登れない
  },
  takao: {
    unlocked: true,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
    workingActivity: null,
    workingUntil: null,
  },
  hakone: {
    unlocked: false,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
    workingActivity: null,
    workingUntil: null,
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

      // デイリー（ログインボーナス・ミッション）
      daily: {
        lastLoginDate: null, // 'YYYY-MM-DD'
        streak: 0,
        missionDate: null,
        missionProgress: {}, // { train: 1, explore: 0, ... }
        missionClaimed: [],  // ['train', ...]
      },

      // アルバム（登頂写真）
      album: [],

      // 図鑑（発見済みの標本ID）と山探索の進行度
      discovered: [],
      exploreLevel: 1,

      // 直前の登山で失った体力。温泉の回復量の基準に使う
      lastFatigue: 0,

      // ご利益：お土産を山神にお供えすると付く。次の登山1回だけ総合体力を底上げする
      blessing: null,  // { mountainId, name, pct }

      // チュートリアル。進行中なら { id, step }（data/tutorial.js の章とステップ位置）
      tutorial: null,
      tutorialSeen: {},  // { start: true, climb: true }

      // --- 計算プロパティ（getter） ---
      getTotalStamina: () => {
        const { core, legs, arms } = get().player
        return Math.floor((core + legs + arms) / 3)
      },

      // --- デイリーログインボーナス ---
      // 新しい日なら {streak, bonus} を返してポイント付与、同日ならnull
      checkDailyLogin: () => {
        const today = new Date().toISOString().slice(0, 10)
        const d = get().daily
        if (d.lastLoginDate === today) return null
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const streak = d.lastLoginDate === yesterday ? Math.min(d.streak + 1, 7) : 1
        const bonus = 300 + (streak - 1) * 200 // 300/500/700/…最大1500
        // ミッションは日替わりでリセット。ただし今日すでに進めた分（ボーナスより先に遊んだ分）は残す
        const sameDay = d.missionDate === today
        set((state) => ({
          player: { ...state.player, points: state.player.points + bonus },
          daily: {
            ...state.daily,
            lastLoginDate: today,
            streak,
            missionDate: today,
            missionProgress: sameDay ? state.daily.missionProgress : {},
            missionClaimed: sameDay ? state.daily.missionClaimed : [],
          },
        }))
        return { streak, bonus }
      },

      // --- デイリーミッション ---
      recordMission: (type) => set((state) => {
        const today = new Date().toISOString().slice(0, 10)
        const d = state.daily
        const sameDay = d.missionDate === today
        const progress = sameDay ? { ...d.missionProgress } : {}
        progress[type] = (progress[type] || 0) + 1
        return {
          daily: {
            ...d,
            missionDate: today,
            missionProgress: progress,
            missionClaimed: sameDay ? d.missionClaimed : [],
          },
        }
      }),

      claimMission: (id, reward) => {
        const d = get().daily
        if (d.missionClaimed.includes(id)) return false
        set((state) => ({
          player: { ...state.player, points: state.player.points + reward },
          daily: { ...state.daily, missionClaimed: [...state.daily.missionClaimed, id] },
        }))
        return true
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

      // 疲労（登山による総合体力の減少。企画書p21: 登頂=必要値×0.1 / 脱落=×0.02×ステージ数）
      applyFatigue: (amount) => set((state) => ({
        lastFatigue: amount,
        player: {
          ...state.player,
          core: Math.max(0, state.player.core - amount),
          legs: Math.max(0, state.player.legs - amount),
          arms: Math.max(0, state.player.arms - amount),
        }
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

      // プロフィールを決めたら、そのままチュートリアルを始める
      completeProfile: () => set((state) => ({
        flags: { ...state.flags, profileCompleted: true },
        tutorial: { id: 'start', step: nextStepIndex('start', -1, state) },
      })),

      // --- チュートリアル ---
      startTutorial: (id) => set((state) => {
        const step = nextStepIndex(id, -1, state)
        return step === null ? state : { tutorial: { id, step } }
      }),

      // メニューから最初（オープニング）から見直す
      replayTutorial: () => set((state) => ({
        flags: { ...state.flags, introCompleted: false },
        tutorial: { id: 'start', step: nextStepIndex('start', -1, state) },
      })),

      // 次のステップへ。最後まで来たら終了して、もらえた報酬ptを返す
      advanceTutorial: () => {
        const t = get().tutorial
        if (!t) return 0
        const next = nextStepIndex(t.id, t.step, get())
        if (next === null) return get().endTutorial(true)
        set({ tutorial: { ...t, step: next } })
        return 0
      },

      // 画面側の出来事（トレーニング完了など）を待っているステップを進める
      tutorialEvent: (name) => {
        const t = get().tutorial
        if (!t || TUTORIALS[t.id].steps[t.step]?.waitFor !== name) return
        get().advanceTutorial()
      },

      // completed=false はスキップ。報酬は最後まで進めた初回だけ
      endTutorial: (completed) => {
        const t = get().tutorial
        if (!t) return 0
        const reward = completed && !get().tutorialSeen[t.id] ? TUTORIALS[t.id].reward : 0
        set((state) => ({
          tutorial: null,
          tutorialSeen: { ...state.tutorialSeen, [t.id]: true },
          player: { ...state.player, points: state.player.points + reward },
        }))
        // 案内中に登山が解禁されていたら、続けて登山編を出す
        const s = get()
        if (t.id === 'start' && s.flags.climbingUnlocked && !s.tutorialSeen.climb) s.startTutorial('climb')
        return reward
      },

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

      // 図鑑に登録（重複は無視）
      discover: (id) => set((state) => (
        state.discovered.includes(id) ? state : { discovered: [...state.discovered, id] }
      )),

      setExploreLevel: (lv) => set({ exploreLevel: lv }),

      // お土産を買うとご利益が付く（既にある場合は強い方を残す）
      grantBlessing: (mountainId, name, pct) => set((state) => (
        state.blessing && state.blessing.pct >= pct
          ? state
          : { blessing: { mountainId, name, pct } }
      )),

      // 登山に使うと消える
      consumeBlessing: () => set({ blessing: null }),

      addAlbumEntry: (entry) => set((state) => ({
        album: [...state.album, { ...entry, date: new Date().toISOString() }]
      })),

      // 整備作業を開始する。durationMin 分が実時間で経過するまで完了しない
      startMaintenance: (mountainId, activityId, durationMin) => set((state) => ({
        mountains: {
          ...state.mountains,
          [mountainId]: {
            ...state.mountains[mountainId],
            workingActivity: activityId,
            workingUntil: new Date(Date.now() + durationMin * 60000).toISOString(),
          }
        }
      })),

      // 作業完了を受け取って整備度に反映する
      collectMaintenance: (mountainId, restoreAmount) => set((state) => ({
        mountains: {
          ...state.mountains,
          [mountainId]: {
            ...state.mountains[mountainId],
            maintenanceLevel: Math.min(100, state.mountains[mountainId].maintenanceLevel + restoreAmount),
            lastMaintainedAt: new Date().toISOString(),
            workingActivity: null,
            workingUntil: null,
          }
        }
      })),

      // 残り時間をポイントで短縮する（1分あたり10pt）
      rushMaintenance: (mountainId) => {
        const m = get().mountains[mountainId]
        if (!m?.workingUntil) return false
        const leftMin = Math.max(0, Math.ceil((new Date(m.workingUntil).getTime() - Date.now()) / 60000))
        const cost = leftMin * 10
        if (get().player.points < cost) return false
        set((state) => ({
          player: { ...state.player, points: state.player.points - cost },
          mountains: {
            ...state.mountains,
            [mountainId]: { ...state.mountains[mountainId], workingUntil: new Date().toISOString() }
          }
        }))
        return true
      },

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
