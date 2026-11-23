/* チュートリアルの台本。
   各ステップは画面上の [data-tut="..."] 要素をスポットライトで照らし、先輩（speaker が無いとき）か山神が説明する。
   speaker : 'yatsugatake' なら八ヶ岳の山神（名前つき）。pose はそのキャラのミニ絵の名前

   route   : このステップを出す画面（null ならどの画面でも）
   target  : 照らす要素の data-tut 名（なければ画面中央に吹き出しだけ出す）
   action  : true なら照らした要素を実際にタップすると次へ進む
   waitFor : 画面側から tutorialEvent(名前) が届くまで待つ（その間は要素を自由に操作できる）
   hint    : 照らす要素が今は画面にないときに、下に小さく出す案内（hintAt: 'top' なら上に出す）
   skipIf  : (state) => true ならこのステップを飛ばす */

export const TUTORIALS = {
  start: {
    title: 'はじめての山',
    reward: 1000,
    doneLabel: 'はじめよう！',
    steps: [
      {
        id: 'welcome', route: '/', speaker: 'yatsugatake', pose: 'laugh',
        text: 'ここがホームだよ。\n右のアイコンをタップすると、いろんな場所に行けるんだ',
      },
      {
        id: 'stats', route: '/', target: 'home-stats', speaker: 'yatsugatake', pose: 'smile',
        text: '左上はきみのポイントと、炎の数字の総合体力。\nポイントは装備や山整備に、総合体力は登山に要るよ',
      },
      {
        id: 'climbLocked', route: '/', target: 'spot-climb', speaker: 'yatsugatake', pose: 'eyesClosed',
        text: '登山にはまだカギがかかっているね。\n山探索Lv.3・総合体力20を目指して、山に備えよう',
        skipIf: (s) => s.flags.climbingUnlocked,
      },
      {
        id: 'goExplore', route: '/', target: 'spot-explore', action: true, speaker: 'yatsugatake', pose: 'laugh',
        text: 'まずは山探索で山に慣れ親しもう。\n「山探索」をタップしてごらん',
      },
      {
        id: 'pickArea', route: '/explore', target: 'explore-areas', action: true, waitFor: 'explored', speaker: 'yatsugatake', pose: 'smile',
        text: '山の仲間をタップすると、フィルムに収まっていくよ。\n同じものが3つそろうと消えて、フィルムがいっぱいになるとゲームオーバーだ',
      },
      {
        id: 'explored', route: '/explore', speaker: 'yatsugatake', pose: 'smileClosed',
        text: 'そろえた山の仲間はアルバムに載るよ。\nクリアしたからトレーニングも解放された。体も鍛えておこう',
      },
      {
        id: 'goTraining', route: '/', target: 'spot-training', action: true, pose: 'megaphone',
        text: 'はじめましてだよね！ ボクは一応、キミたちの先輩かな…\nトレーニングはボクが案内するよ。「トレーニング」をタップしてみて',
      },
      {
        id: 'pickTraining', route: '/training', target: 'train-plank', action: true, waitFor: 'trained', pose: 'winkCheer',
        text: '最初はプランクがおすすめ。\n30秒だけ、ひじとつま先で体をまっすぐ支えてみよう！',
        hint: 'プランクを最後までやってみよう',
        hintAt: 'top', // 画面下には「スタート！」「戻る」があるので
      },
      {
        id: 'trained', route: '/training', target: 'train-stats', pose: 'armsCrossedLaugh',
        text: 'おつかれさま！ 体幹と腕力が上がって、ポイントももらえたね。\n体幹・脚力・腕力の平均が総合体力になるよ',
      },
      {
        id: 'finish', route: '/', target: 'home-menu', speaker: 'yatsugatake', pose: 'laugh', last: true,
        text: '基本はこれでおしまい。山探索とトレーニングでレベルを上げて、登山に備えよう！\n迷ったら右上の「メニュー」のガイドを見てごらん',
      },
    ],
  },

  // 登山が解禁されたときに一度だけ流れる
  climb: {
    title: 'はじめての登山',
    reward: 0,
    doneLabel: 'いってきます！',
    steps: [
      {
        id: 'goClimb', route: '/', target: 'spot-climb', action: true, pose: 'winkCheer',
        text: '登山が解禁されたね！\nまずは高尾山から行ってみよう',
      },
      {
        id: 'gear', route: '/climbing', target: 'climb-shop', pose: 'glassesSmile',
        text: '高尾山を登るのに必要な装備をそろえよう！ 買い物付き合うよ！\nコースごとに必要な装備がちがって、食料や救急品は登るたびに使い切るよ',
      },
      {
        id: 'onsen', route: '/climbing', pose: 'armsCrossedSmile', last: true,
        text: '下山したら温泉で体力を回復できるよ。\nただし戻るのは減った分の7割まで。無理せずいこうね！',
      },
    ],
  },
}

// from の次に出すステップの位置。もう無ければ null
export function nextStepIndex(chapterId, from, state) {
  const steps = TUTORIALS[chapterId].steps
  for (let i = from + 1; i < steps.length; i++) {
    if (!steps[i].skipIf?.(state)) return i
  }
  return null
}
