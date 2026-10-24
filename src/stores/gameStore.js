import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TUTORIALS, nextStepIndex } from '../data/tutorial'
import { itemUses } from '../data/equipment'
import { pickMissionMountain, todayString } from '../data/missions'

const DEFAULT_MOUNTAINS = {
  // 架空の練習用の山。登山解禁（総合体力20）から高尾山（推奨100）までの間を埋める
  satoyama: {
    unlocked: true,
    firstAccessed: false,
    summitedCourses: [],
    maintenanceLevel: 100,
    lastMaintainedAt: null,
    workingActivity: null,
    workingUntil: null,
  },
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

const DAY_MS = 24 * 60 * 60 * 1000
const DECAY_PER_DAY = 5 // 整備度は1日に5%ずつ下がる

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

      // 所持アイテム。usesLeft はあと何回の登山で消耗するか（null は消耗しない）
      inventory: [],
      // 登山で消耗して消えた装備。マイアイテムで「消耗しました！」を見せたら消す
      wornOut: [],   // [{ id, name, icon }]

      // 音の設定（効果音と環境音を別々に）。環境音は素材が届くまで鳴らない
      settings: { sfxOn: true, sfxVol: 0.8, ambientOn: true, ambientVol: 0.6 },

      // デイリー（ログインボーナス・ミッション）
      daily: {
        lastLoginDate: null, // 'YYYY-MM-DD'
        streak: 0,
        missionDate: null,
        missionProgress: {}, // { train: 1, explore: 0, ... }
        missionClaimed: [],  // ['train', ...]
        missionMountain: null, // 今日の「〇〇に出かけよう」の山
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
        const today = todayString()
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
            missionMountain: sameDay && state.daily.missionMountain
              ? state.daily.missionMountain : pickMissionMountain(today, state.mountains),
          },
        }))
        return { streak, bonus }
      },

      // --- デイリーミッション ---
      // climb は今日の山（missionMountain）に登ったときだけ数える
      recordMission: (type, mountainId) => set((state) => {
        const today = todayString()
        const d = state.daily
        const sameDay = d.missionDate === today
        const missionMountain = sameDay && d.missionMountain
          ? d.missionMountain : pickMissionMountain(today, state.mountains)
        if (type === 'climb' && mountainId !== missionMountain) {
          return sameDay ? state : { daily: { ...d, missionDate: today, missionProgress: {}, missionClaimed: [], missionMountain } }
        }
        const progress = sameDay ? { ...d.missionProgress } : {}
        progress[type] = (progress[type] || 0) + 1
        return {
          daily: {
            ...d,
            missionDate: today,
            missionProgress: progress,
            missionClaimed: sameDay ? d.missionClaimed : [],
            missionMountain,
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
        inventory: [...state.inventory, { ...item, usesLeft: itemUses(item), purchasedAt: new Date().toISOString() }]
      })),

      // 登山1回ぶん、持って行った装備を使う。使い切ったものは持ち物から消えて wornOut に入る
      spendClimbGear: (itemIds) => {
        const worn = []
        set((state) => {
          const inventory = []
          state.inventory.forEach((it) => {
            if (!itemIds.includes(it.id) || it.usesLeft == null) { inventory.push(it); return }
            const usesLeft = it.usesLeft - 1
            if (usesLeft > 0) inventory.push({ ...it, usesLeft })
            else worn.push({ id: it.id, name: it.name, icon: it.icon })
          })
          return { inventory, wornOut: [...state.wornOut.filter((w) => !worn.some((x) => x.id === w.id)), ...worn] }
        })
        return worn
      },

      clearWornOut: () => set({ wornOut: [] }),

      setSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

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

      // 初めて訪れた時点から、荒廃の時計を動かしはじめる
      setMountainAccessed: (mountainId) => set((state) => ({
        mountains: {
          ...state.mountains,
          [mountainId]: {
            ...state.mountains[mountainId],
            firstAccessed: true,
            lastMaintainedAt: state.mountains[mountainId].lastMaintainedAt ?? new Date().toISOString(),
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

      // 時間経過による山の荒廃（呼び出し時に計算）。1日ごとに DECAY_PER_DAY ずつ下がる。
      // 訪れたことのある山だけが対象。端数の時間は次回に持ち越す
      applyMountainDecay: () => set((state) => {
        const now = Date.now()
        const updated = { ...state.mountains }
        Object.keys(updated).forEach((key) => {
          const m = updated[key]
          if (!m.firstAccessed && !m.lastMaintainedAt) return
          // 以前のデータで、訪れたのに時計が動いていない山は今から数える
          if (!m.lastMaintainedAt) {
            updated[key] = { ...m, lastMaintainedAt: new Date(now).toISOString() }
            return
          }
          const from = new Date(m.lastMaintainedAt).getTime()
          const decay = Math.floor(((now - from) / DAY_MS) * DECAY_PER_DAY)
          if (decay > 0) {
            updated[key] = {
              ...m,
              maintenanceLevel: Math.max(0, m.maintenanceLevel - decay),
              lastMaintainedAt: new Date(from + (decay / DECAY_PER_DAY) * DAY_MS).toISOString(),
            }
          }
        })
        return { mountains: updated }
      }),
    }),
    {
      name: 'yama-app-storage',
      // 保存データの山の一覧は丸ごと置き換わるので、あとから増えた山（ふもとの里山など）を足す
      // 以前の保存データの装備には消耗の回数が無いので、買ったばかりとして数えはじめる
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        mountains: { ...current.mountains, ...(persisted?.mountains || {}) },
        settings: { ...current.settings, ...(persisted?.settings || {}) },
        inventory: (persisted?.inventory || current.inventory).map((it) => (
          it.usesLeft === undefined ? { ...it, usesLeft: itemUses(it) } : it
        )),
      }),
    }
  )
)
