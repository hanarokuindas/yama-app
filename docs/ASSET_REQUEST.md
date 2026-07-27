# 画像アセット依頼リスト（山アプリ）

外部AI（Midjourney / DALL-E / Stable Diffusion 等）で生成する画像の一覧です。

## 組み込み方法（重要）

**アイコン**: 下記の「ファイル名」どおりに `src/assets/icons/` へ置くだけで、コード変更なしで自動的に反映されます（現在のSVG仮アイコンより優先されます）。

```
src/assets/icons/mountain.png   ← このように配置するだけ
```

- 形式: **透過PNG**（またはWebP）
- サイズ: **512×512px**（正方形・被写体は中央に余白1割程度）
- 背景: 完全透過
- スタイル統一の推奨キーワード: `game icon, cute, rounded, soft shading, vibrant colors, mobile game UI style, sticker-like white outline (optional), no text, no background`

**背景・キャラ等の大型画像**: `src/assets/backgrounds/` 等へ配置後、コード側で組み込み対応します（ファイル名だけ守ってください）。

---

## 1. UIナビゲーション・システムアイコン（優先度：高）

| ファイル名 | 内容 | 使用箇所 |
|---|---|---|
| `home.png` | 家・ホーム | 下部ナビ |
| `mountain.png` | 雪冠のある青い山 | ナビ/マップ/ミッション |
| `volcano.png` | 噴煙のある火山（箱根） | 山選択 |
| `forest.png` | 針葉樹の森（高尾） | 山選択 |
| `search.png` | 虫めがね | ナビ/マップ「山探索」 |
| `muscle.png` | 力こぶの腕 | ナビ/マップ「トレーニング」 |
| `saw.png` | ノコギリ | マップ「山整備」 |
| `picture.png` | 額縁入り風景画 | マップ「アルバム」 |
| `camera.png` | カメラ | マップ「AR撮影」 |
| `phone.png` | スマートフォン | メニュー「SNS」 |
| `cart.png` | ショッピングカート | メニュー「ショップ」 |
| `lock.png` | 南京錠（金色） | 未解禁表示 |
| `star.png` | 金色の星 | ポイント表示 |
| `heart.png` | 赤いハート | スタミナ表示 |
| `gift.png` | リボン付きプレゼント箱 | ログインボーナス |
| `clipboard.png` | チェックリストのクリップボード | ミッションボタン |
| `book.png` | 開いた本 | メニュー「ガイドブック」 |
| `doc.png` | 書類 | メニュー「利用規約」 |
| `sound.png` | スピーカー | メニュー「サウンド」 |
| `user.png` | 人物シルエットアバター | メニュー「プロフィール」 |
| `backpack.png` | 登山用バックパック（オレンジ） | 装備メニュー |
| `sparkle.png` | キラキラ星の輝き | 祝福演出 |
| `trophy.png` | 金のトロフィー | クリア・登頂演出 |
| `box.png` | 段ボール箱 | 装備の汎用アイコン |
| `onsen.png` | 温泉マーク（湯気）または露天風呂 | 登山後の温泉 |
| `warn.png` | 黄色い警告三角 | 山の荒廃警告 |
| `check.png` | 緑の丸チェックマーク | 購入済/装備OK |
| `cross.png` | 赤の丸バツマーク | 装備不足 |
| `menu.png` | ハンバーガーメニュー（3本線） | Menuボタン |
| `climber.png` | 登山者のちびキャラ風シルエット | メニューのアバター |
| `sunrise.png` | 山から昇る朝日 | イントロ画面 |
| `flagGoal.png` | 山頂の赤い登頂旗 | 登頂済みコース表示 |
| `timer.png` | ストップウォッチ | トレーニング時間 |
| `ruler.png` | 定規/距離 | コース距離表示 |
| `chart.png` | 棒グラフ | ステージ数表示 |

## 2. トレーニングメニューアイコン（優先度：高）

| ファイル名 | 内容 | 使用箇所 |
|---|---|---|
| `yoga.png` | プランク/瞑想ポーズの人 | プランク・ストレッチ |
| `fire.png` | 炎（かわいい系） | 腹筋 |
| `lift.png` | バーベルを持ち上げる人 | スクワット |
| `walk.png` | 歩く人 | ウォーキング |
| `leg.png` | 脚・太もも | ランジ |
| `stretch.png` | 前屈ストレッチする人 | 腿裏ストレッチ |
| `breath.png` | 深呼吸する顔（リラックス） | 首ストレッチ |

## 3. ミニゲーム収集アイテム（優先度：高）
### 岩場ステージ
| ファイル名 | 内容 |
|---|---|
| `rock.png` | ゴツゴツした灰色の岩 |
| `gem.png` | 水色に輝くダイヤ型宝石 |
| `pickaxe.png` | ツルハシ |
| `bat.png` | かわいいコウモリ |
| `orb.png` | 紫の水晶玉 |
| `moon.png` | 三日月 |

### 登山道ステージ
| ファイル名 | 内容 |
|---|---|
| `herb.png` | 山菜・薬草の葉 |
| `mushroom.png` | 赤傘のキノコ |
| `butterfly.png` | 青い蝶 |
| `paw.png` | 動物の足あと |
| `blossom.png` | 桜の花 |
| `squirrel.png` | かわいいリス |

### 草原ステージ
| ファイル名 | 内容 |
|---|---|
| `daisy.png` | 白いマーガレット |
| `cricket.png` | 緑のバッタ |
| `hibiscus.png` | ピンクのハイビスカス風の花 |
| `clover.png` | 四つ葉のクローバー |
| `sunflower.png` | ヒマワリ |
| `lizard.png` | 緑のトカゲ |

## 4. ショップ装備アイテム（優先度：中）

| ファイル名 | 内容 |
|---|---|
| `cap.png` | 登山帽（赤系） |
| `shirt.png` | 半袖Tシャツ |
| `wear.png` | 長袖インナー（濃色） |
| `jacket.png` | 登山ジャケット（緑） |
| `pants.png` | 登山パンツ |
| `shoes.png` | トレッキングシューズ |
| `boots.png` | 冬用登山ブーツ（茶） |
| `socks.png` | 登山用ソックス |
| `gloves.png` | 登山グローブ |
| `map.png` | 折りたたみ地図 |
| `flashlight.png` | ヘッドライト/懐中電灯 |
| `battery.png` | モバイルバッテリー |
| `water.png` | 水筒または水滴 |
| `onigiri.png` | おにぎり |
| `raincoat.png` | 黄色いレインウェア |
| `bandage.png` | 絆創膏・救急セット |
| `card.png` | 保険証/カード |
| `coin.png` | 金貨 |

## 5. お土産（優先度：低）

| ファイル名 | 内容 |
|---|---|
| `dango.png` | 三色団子（高尾まんじゅう用） |
| `beer.png` | 地ビールのジョッキ |

## 6. 背景画像（優先度：最高）— `src/assets/backgrounds/` へ

| ファイル名 | サイズ | 内容 |
|---|---|---|
| `bg_home_map.png` | 1200×2000 縦長 | ホームのワールドマップ。緑豊かな山岳パノラマを上空斜めから見たRPG風マップ。奥に雪冠の主峰、手前に草原・森・蛇行する川・登山道。ジブリ風の温かい水彩タッチ |
| `bg_stage_rocky.png` | 800×1100 | 岩場ステージ背景。洞窟/岩壁、薄暗く神秘的、鉱石がきらめく |
| `bg_stage_trail.png` | 800×1100 | 登山道ステージ背景。木漏れ日の森の道 |
| `bg_stage_meadow.png` | 800×1100 | 草原ステージ背景。明るい高原、花畑と青空 |
| `bg_onsen.png` | 800×1100 | 山の露天温泉。岩風呂、湯気、夕暮れ |
| `bg_shop.png` | 800×1100 | 山小屋風の登山ショップ内装 |
| `bg_training.png` | 800×1100 | 朝の高原トレーニング場 |
| `bg_intro.png` | 800×1400 | イントロ用。朝焼けの山脈シルエット |

## 7. キャラクター（優先度：高）— `src/assets/characters/<名前>/` へ

既存: 先輩（full×2, mini×10）、高尾（AR×2, full×3, mini×4）→ **入手済み**

| ファイル名 | 内容 |
|---|---|
| `yatsugatake/yatsugatake_full_01〜03.png` | 八ヶ岳の山神キャラ全身（3000×4000透過、既存キャラとタッチ統一） |
| `yatsugatake/yatsugatake_mini_01〜04.png` | 同ミニキャラ（表情差分：笑顔/すまし/目閉じ/驚き） |
| `hakone/hakone_full_01〜03.png` | 箱根の山神キャラ全身 |
| `hakone/hakone_mini_01〜04.png` | 同ミニキャラ |

## 8. その他（優先度：低）

| ファイル名 | 内容 |
|---|---|
| `app_icon.png`（512×512、透過不要） | アプリアイコン。山＋キャラのシンボル |
| `ogp.png`（1200×630） | SNSシェア用画像 |

---

## 生成時の共通スタイル指定（コピペ用）

```
cute mobile game asset, warm colors, soft cel shading, clean silhouette,
Ghibli-inspired, consistent art style across set, no text, no watermark
アイコンは: transparent background, centered, 512x512
背景は: painterly, layered depth, vibrant but soft palette
```

## 反映の仕組み（開発メモ）

- `src/components/GameIcon.jsx` が `src/assets/icons/*.png|webp` を自動検出し、同名アイコンをSVG仮アイコンより優先表示する
- Phaserゲーム内（山探索）も同じ仕組みで自動反映（`src/utils/iconTexture.jsx`）
- 背景・キャラは配置後にコード側で1行ずつ差し替え（依頼者側の作業不要）
