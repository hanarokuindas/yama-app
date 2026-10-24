/* チュートリアルの台本。
   各ステップは画面上の [data-tut="..."] 要素をスポットライトで照らし、先輩が説明する。

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
        id: 'welcome', route: '/', pose: 'smileCheer',
        text: 'ここがホームだよ！\n右のアイコンをタップすると、いろんな場所に行けるんだ',
      },
      {
        id: 'stats', route: '/', target: 'home-stats', pose: 'glassesSmile',
        text: '左上はキミのポイントと、炎の数字の総合体力。\nポイントは装備や山の整備に使って、総合体力で登れる山が決まるよ',
      },
      {
        id: 'climbLocked', route: '/', target: 'spot-climb', pose: 'armsCrossed',
        text: '登山にはまだカギがかかってるね。\n総合体力が20になると解禁されるよ',
        skipIf: (s) => s.flags.climbingUnlocked,
      },
      {
        id: 'goTraining', route: '/', target: 'spot-training', action: true, pose: 'megaphone',
        text: 'まずは体を鍛えよう！\n「トレーニング」をタップしてみて',
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
        id: 'goExplore', route: '/', target: 'spot-explore', action: true, pose: 'megaphone',
        text: '次は山探索でポイントを集めよう。\n右の「山探索」をタップしてね',
      },
      {
        id: 'pickArea', route: '/explore', target: 'explore-areas', action: true, waitFor: 'explored', pose: 'glassesWink',
        text: '同じ山の仲間を3つそろえると消えるよ。ぜんぶ消せたらクリア！\n上に重なっているものは取れないから、上から順に取ってね。好きなエリアを選んでね',
      },
      {
        id: 'explored', route: '/explore', pose: 'smileCheer',
        text: 'そろえた山の仲間はアルバムに載るよ。最初の2種は1回で、そのあとは3回そろえると載るんだ。\nレベルが上がると「お題」が出てくるよ。アルバムでいつでも見返せるよ',
      },
      {
        id: 'finish', route: '/', target: 'home-menu', pose: 'winkCheer', last: true,
        text: '基本はこれでおしまい！ 総合体力20を目指して鍛えたら、いよいよ登山だよ。\n迷ったら右上の「メニュー」のガイドを見てね',
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
        text: '登山が解禁されたね！\nまずは練習用の「ふもとの里山」から行ってみよう',
      },
      {
        id: 'gear', route: '/climbing', target: 'climb-shop', pose: 'glassesSmile',
        text: 'コースごとに必要な装備がちがうんだ。\n足りないものは「山ショップ」でそろえてから出発してね。\n食料や水は登るたびに使い切るよ',
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
