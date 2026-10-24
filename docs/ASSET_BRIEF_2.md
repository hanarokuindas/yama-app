# 画像アセット制作指示書 その2（横画面版・2026年10月の修正指示より）

修正指示PDF（全29ページ）をもとに、新しく必要になった **背景・部品・アイコン・登山ルート図** の一覧と、画像生成用のプロンプトです。
キャラクター（八ヶ岳・箱根など）はデータがあるので、ここには入れていません。文章（説明文など）も今回は保留です。

プロンプトは、画像生成AIが正確に描きやすい英語にしています。そのままコピーして使ってください。

---

## 0. 共通のルール

| 項目 | 指定 |
|---|---|
| ファイル名 | 表のファイル名どおり（連番や「のコピー」を付けない） |
| 形式 | PNG |
| 背景（セクション1） | 横長 16:9、1920×1080px |
| 部品・アイコン（セクション2・3） | 白い背景に1つだけ描く。背景の切り抜きはこちらで行います |
| 文字 | 画像の中に文字・数字・ロゴを入れない（文字はアプリ側で重ねます） |

### いま作らなくてよいもの（アプリ側で用意します）
- 山探索トップ・登山トップ・山整備トップ・メニュー・今日のミッションの背景：ホームの背景にベージュの膜をかけて使います
- トレーニング中の背景（白・ピンク・灰青の無地）
- 正方形のベージュの枠、ボタン類
- 日本地図（無料で使える国土地理院のデータから作ります）
- 登山のコース選択の背景：実写の写真を使うので、写真をご用意ください

---

## 1. 背景（13枚＋季節版3枚）

いまの背景はすべて縦長（896×1200）なので、横長で作り直します。
いまの絵と同じ「やわらかい水彩・アニメ調」でそろえます。

| # | ファイル名 | 使う画面 | 内容 |
|---|---|---|---|
| 1-1 | `bg_home.png` | ホーム | 青々とした新緑の里山の全景。いまより濃く鮮やかに |
| 1-2 | `bg_intro.png` | オープニング | 夜明けの雄大な山並み |
| 1-3 | `bg_shop.png` | 山ショップ | 山の道具屋さんの店内（いまの絵の横長版） |
| 1-4 | `bg_myroom.png` | マイアイテム | ジブリっぽい木の部屋 |
| 1-5 | `bg_training.png` | トレーニング一覧 | 朝の、体を動かしたくなる爽やかな山（白っぽい色調） |
| 1-6 | `bg_explore_rock.png` | 山探索ゲーム（岩場） | 岩場 |
| 1-7 | `bg_explore_trail.png` | 山探索ゲーム（登山道） | 森の中の登山道 |
| 1-8 | `bg_explore_meadow.png` | 山探索ゲーム（草原） | 高原の草原 |
| 1-9 | `bg_onsen.png` | 温泉 | 山あいの露天風呂 |
| 1-10 | `bg_forest_good.png` | 山整備（良好） | 木漏れ日が差す明るい広葉樹の森 |
| 1-11 | `bg_forest_bad.png` | 山整備（悪化） | 1-10 と同じ場所が荒れた様子 |
| 1-12 | `bg_album_book.png` | アルバム（目次・詳細） | 開いた古いアルバムの見開き（中は白紙） |
| 1-13 | `bg_album_paper.png` | アルバム（一覧・マップ） | 古い紙の質感（全面） |
| 1-14〜16 | `bg_home_sakura.png` ほか | ホーム（季節） | 春・秋・冬版。**後回しでOK** |

### 1-1 ホーム `bg_home.png`
画面の中央にキャラが立ち、右側にアイコンが縦に並び、上に看板が並びます。中央と上の帯はすっきりさせます。
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A bird's-eye view of a peaceful Japanese satoyama valley in early summer: lush, vivid, deep fresh green forests and rice fields, a winding river with a small wooden bridge, a few thatched-roof farmhouses, gentle green mountains layered into the distance under a clear light blue sky. Rich saturated greens, bright and cheerful. Keep the center of the picture calm and open (a grassy area where a character can stand), and keep the top 15% simple (sky and distant mountains). No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-2 オープニング `bg_intro.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A majestic panorama of Japanese mountain ranges at dawn: layered ridges fading into soft morning mist, a golden sunrise glow behind the peaks, a sea of clouds in the valleys, deep green forests in the foreground. Calm, hopeful, and grand. Keep the lower third simple because a text box will sit there. No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-3 山ショップ `bg_shop.png`
右側3分の1にアイテムの説明が重なります。中央は棚の正面で、ごちゃごちゃさせません。
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. The cozy interior of a small mountain outdoor-gear shop in a Japanese mountain village: warm wooden walls and floor, wooden shelves with neatly arranged backpacks, hiking boots, jackets, ropes and lanterns, a wooden counter, soft afternoon sunlight through a window. Warm natural beige and wood tones, slightly soft and low contrast so that items placed on top stand out. No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-4 マイアイテム `bg_myroom.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A cozy wooden bedroom of a young hiker in a mountain cottage: wooden floor and walls, a bed with a yellow blanket, a small desk, shelves with plants and small hiking items, a framed mountain picture, a big window with soft curtains and warm morning light. Natural beige and warm wood tones, soft and low contrast. No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-5 トレーニング一覧 `bg_training.png`
左側に先輩の全身、右側にトレーニングのマスが並びます。
```
Soft hand-painted watercolor illustration in a warm Japanese anime style. A bright, refreshing morning in the Japanese Alps: an open alpine meadow with scattered white rocks in the foreground, rugged grey rocky peaks and green slopes in the background, a pale clear sky with thin clouds. Airy, open and energizing — a place where you want to stretch and move. Light greyish-white and pale blue-green color palette, soft and slightly hazy. Keep the left third simple. No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-6〜1-8 山探索ゲーム
標本がたくさん重なるので、背景は少し淡く、中央にこまかい模様を入れません。
3枚とも同じ書き出しにして、雰囲気をそろえてください。

`bg_explore_rock.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A rocky mountain slope above the tree line in Japan: grey boulders and gravel, a few small alpine plants, distant peaks and blue sky. Soft, slightly hazy and low contrast, with no strong details in the center, because many small game items will be placed on top. No people, no animals, no text, no logos. Wide 16:9 landscape, 1920x1080.
```
`bg_explore_trail.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A mountain trail through a Japanese forest: tall trees, sunlight filtering through leaves, ferns and moss, a small stream beside a dirt path. Soft, slightly hazy and low contrast, with no strong details in the center, because many small game items will be placed on top. No people, no animals, no text, no logos. Wide 16:9 landscape, 1920x1080.
```
`bg_explore_meadow.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A high-altitude flower meadow in the Japanese mountains: gentle grassy slopes with small wildflowers, a few clouds, distant mountains. Soft, slightly hazy and low contrast, with no strong details in the center, because many small game items will be placed on top. No people, no animals, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-9 温泉 `bg_onsen.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. An open-air hot spring (rotenburo) surrounded by natural rocks in the Japanese mountains at dusk: gentle steam rising from the water, a small wooden bucket on a rock, maple and pine trees, warm lantern light, mountains in a soft orange-purple evening sky. Relaxing and warm. Keep the center calm. No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-10・1-11 山整備（良好・悪化）
左側に山神のミニキャラ、右側に作業のアイコンが並びます。
**1-11 は、1-10 の画像を参考画像として付けて、同じ構図で作ってください。**

`bg_forest_good.png`
```
Soft hand-painted watercolor illustration in a warm Japanese anime style, like a Studio Ghibli background. A healthy, bright broadleaf forest in the Japanese mountains: sunlight streaming through fresh green leaves (komorebi) with sparkling light, a well-kept dirt trail going into the distance, lush undergrowth, small flowers. It feels safe and full of life, a place where plants grow well and animals live happily. Keep the left third and right edge simple. No people, no animals, no text, no logos. Wide 16:9 landscape, 1920x1080.
```
`bg_forest_bad.png`
```
Use the attached image as reference and keep exactly the same viewpoint and composition. The same forest, now neglected and damaged: fallen and broken trees lying across the trail, the path muddy and hard to walk, withered brown plants and bare branches, scattered debris, dim dusty light, dull desaturated brown and grey colors. It feels hard to climb and empty of animals. Soft hand-painted watercolor illustration in a warm Japanese anime style. No people, no animals, no text, no logos. Wide 16:9 landscape, 1920x1080.
```

### 1-12 アルバムの見開き `bg_album_book.png`
目次と、アイテムの詳細ページに使います。ページの中は白紙にしてください（文字や写真はアプリで重ねます）。
```
A top-down view of an old, handmade photo album (scrapbook) lying open on a wooden desk, filling almost the whole frame. Two blank pages of thick cream-colored craft paper with a slightly aged, warm texture and soft edges, a dark brown leather cover visible around the pages, a gentle shadow along the center spine. Warm, cozy, handmade feeling. The pages must be completely empty: no text, no photos, no drawings. Wide 16:9 landscape, 1920x1080.
```

### 1-13 アルバムの紙 `bg_album_paper.png`
```
A seamless texture of old parchment paper filling the whole frame: warm light beige with soft brown stains toward the edges, subtle fibers, evenly lit, flat and front-facing. Very plain so that text and icons on top are easy to read. No text, no drawings, no folds. Wide 16:9 landscape, 1920x1080.
```

### 1-14〜1-16 ホームの季節版（後回しでOK）
1-1 の画像を参考画像として付け、同じ構図で作ってください。
```
Use the attached image as reference and keep exactly the same viewpoint and composition. Change the season to spring: cherry blossom trees in full bloom along the river and around the village, soft pink petals, fresh light green fields. Soft hand-painted watercolor illustration in a warm Japanese anime style. No people, no text, no logos. Wide 16:9 landscape, 1920x1080.
```
秋：`Change the season to autumn: red and orange maple leaves covering the mountains, golden rice fields.`
冬：`Change the season to winter: everything covered in soft white snow, silver frosty trees, a pale clear sky.`
（上の「Change the season to spring: …」の文を置きかえて使ってください。ファイル名は `bg_home_sakura.png` `bg_home_autumn.png` `bg_home_winter.png`）

---

## 2. 部品（7枚）

木の看板などの部品です。白い背景に1つだけ描いてください。

| # | ファイル名 | 使う場所 |
|---|---|---|
| 2-1 | `ui_plank_short.png` | 「ホーム」「メニュー」などの短い看板 |
| 2-2 | `ui_plank_long.png` | 名前・ポイントなどの長い看板 |
| 2-3 | `ui_signboard.png` | ログインボーナスの大きな木の看板 |
| 2-4 | `ui_log_round.png` | ホームのアイコンをのせる丸太の輪切り |
| 2-5 | `ui_photo_frame.png` | 山探索のトレイ（写真フレーム） |
| 2-6 | `ui_ribbon.png` | 「探索成功！」の帯 |
| 2-7 | `ui_label_frame.png` | アルバム目次の見出し（「山探索」「登った山」）の飾り枠 |

### 2-1 短い看板 `ui_plank_short.png`
```
A single small horizontal wooden signboard for a game user interface: one rectangular plank of warm brown wood with visible grain, slightly rounded corners, a soft hand-painted look, seen straight from the front. Aspect ratio about 3:1. Blank surface with no text. Centered on a plain white background. 1024x1024.
```

### 2-2 長い看板 `ui_plank_long.png`
```
A single long horizontal wooden signboard for a game user interface: one long rectangular plank of warm brown wood with visible grain, slightly rounded corners, a soft hand-painted look, seen straight from the front. Aspect ratio about 6:1. Blank surface with no text. Centered on a plain white background. 1536x1024.
```

### 2-3 大きな木の看板 `ui_signboard.png`
```
A large wooden notice board for a game user interface, made of four horizontal weathered wood planks joined together, warm orange-brown wood with visible grain and soft worn edges, a soft hand-painted look, seen straight from the front. Aspect ratio about 16:10. Blank surface with no text. Centered on a plain white background. 1536x1024.
```

### 2-4 丸太の輪切り `ui_log_round.png`
```
A single round slice of a tree log for a game user interface, seen straight from the front: light beige wood with soft tree rings in the center and a thin brown bark edge, a soft hand-painted look with gentle shading. Perfect circle, blank surface. Centered on a plain white background. 1024x1024.
```

### 2-5 写真フレーム `ui_photo_frame.png`
```
A single empty instant photo (polaroid) frame for a game user interface, seen straight from the front: a thick white paper border with a slightly wider bottom edge, and a plain dark charcoal-grey empty photo area in the middle, a subtle soft shadow. Square overall shape. No picture inside, no text. Centered on a plain white background. 1024x1024.
```

### 2-6 帯 `ui_ribbon.png`
```
A single wide decorative ribbon banner for a game user interface, like a celebration title banner: soft golden-beige paper ribbon with gently curled ends and folded tails, a soft hand-painted watercolor look, slightly tilted upward to the right. Blank surface with no text. Centered on a plain white background. 1536x1024.
```

### 2-7 見出しの飾り枠 `ui_label_frame.png`
```
A single decorative label frame for a handmade scrapbook: a horizontal rectangle with an ornate vintage border drawn in thin dark brown ink lines, small curly flourishes on the left and right sides, cream paper inside. Hand-drawn, slightly rustic look. Blank inside with no text. Centered on a plain white background. 1536x1024.
```

---

## 3. アイコン（25枚）

いまのアイコン78枚と同じ「かわいいステッカー調・白フチあり」でそろえます。
見本：`docs/reference/style_icons.jpg`（可能なら参考画像として付けてください）。

| # | ファイル名 | 描くもの | 使う場所 |
|---|---|---|---|
| 3-1 | `dumbbell.png` | 赤いダンベル2つ | ホーム「トレーニング」・ミッション |
| 3-2 | `hikinggear.png` | 登山帽とリュック | ホーム「登山」・ミッション |
| 3-3 | `chainsaw.png` | オレンジのチェーンソー | ホーム「山整備」・ミッション・作業「間伐」 |
| 3-4 | `albumbook.png` | 緑の表紙のアルバム | ホーム「アルバム」 |
| 3-5 | `trekkingshoes.png` | 茶色の登山靴一足 | ホーム「装備」 |
| 3-6 | `pcoin.png` | 「P」の金色コイン | ポイントの記号 |
| 3-7 | `flame.png` | 顔のある小さな炎 | 炎の数字（労力など） |
| 3-8 | `speaker.png` | スピーカー | メニュー「サウンド」 |
| 3-9 | `profile.png` | 登山者の顔 | メニュー「マイプロフィール」 |
| 3-10 | `area_rock.png` | 積み重なった岩 | 山探索・アルバムの岩場エリア |
| 3-11 | `area_trees.png` | 広葉樹の木々 | 山探索・アルバムの登山道エリア |
| 3-12 | `area_flowers.png` | 草花の茂み | 山探索・アルバムの草原エリア |
| 3-13 | `fuji.png` | 富士山 | 日本地図 |
| 3-14 | `mappin.png` | 赤い地図ピン | 日本地図 |
| 3-15 | `event_thunder.png` | 雷雲と落雷 | 登山の出来事 |
| 3-16 | `event_fallentree.png` | 道をふさぐ倒木 | 登山の出来事 |
| 3-17 | `event_sickfriend.png` | 座り込む登山者 | 登山の出来事 |
| 3-18 | `event_flood.png` | 増水した川 | 登山の出来事 |
| 3-19 | `event_blessing.png` | 金色に光るお守り | 登山の出来事（ご利益） |
| 3-20 | `binoculars.png` | 双眼鏡 | 山整備「巡回」 |
| 3-21 | `trashbag.png` | 黒いゴミ袋 | 山整備「ゴミ拾い」 |
| 3-22 | `brushcutter.png` | 草刈り機 | 山整備「草刈り」 |
| 3-23 | `pruningsaw.png` | 剪定のこぎり | 山整備「枝切り」 |
| 3-24 | `logs.png` | 積んだ丸太 | 山整備「登山道整備」 |
| 3-25 | `sapling.png` | 苗木 | 山整備「植栽」 |

※ 山探索（虫眼鏡）・ミッション（赤い旗）・ガイド（本）・SNS（スマホ）・利用規約（クリップボード）・シャッターチャンス（カメラ）・鍵は、いまあるアイコンを使います。

どのプロンプトも、最初の行だけがちがいます（描くもの）。2行目以降は共通です。

`dumbbell.png`
```
A pair of small red dumbbells with black grips, crossed slightly.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`hikinggear.png`
```
A beige bucket hiking hat resting on top of a light blue hiking backpack.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`chainsaw.png`
```
An orange and grey chainsaw seen from the side.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`albumbook.png`
```
A closed photo album with a green cloth cover and a small leaf decoration, slightly tilted.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`trekkingshoes.png`
```
A pair of brown leather trekking shoes (hiking boots) with orange laces, seen from the side.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`pcoin.png`
```
A shiny round gold coin with a bold capital letter P embossed in the center.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no other text, 1024x1024.
```
`flame.png`
```
A small cute orange flame character with a happy face, like a little fire spirit.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`speaker.png`
```
A small wooden speaker box with a black speaker cone, and two small music notes floating beside it.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`profile.png`
```
The smiling face and shoulders of a friendly young hiker wearing a knit beanie, simple and gender-neutral.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`area_rock.png`
```
A small pile of grey and brown mountain rocks and boulders.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`area_trees.png`
```
A small group of two or three round green broadleaf trees standing together.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`area_flowers.png`
```
A small clump of meadow grass with colorful wildflowers (yellow, pink and white).
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`fuji.png`
```
Mount Fuji with a white snow cap and a blue body, a simple iconic shape.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`mappin.png`
```
A red map location pin with a small white circle in the head, standing upright.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`event_thunder.png`
```
A dark grey storm cloud with a bright yellow lightning bolt striking down.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`event_fallentree.png`
```
A big fallen tree trunk lying across a small dirt mountain trail, with broken branches.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`event_sickfriend.png`
```
A tired hiker with a backpack sitting on a rock, holding their stomach, looking unwell, simple and gender-neutral.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`event_flood.png`
```
A swollen muddy brown mountain stream overflowing its banks with strong splashing waves.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`event_blessing.png`
```
A small Japanese shrine amulet (omamori) glowing with warm golden light and sparkles.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`binoculars.png`
```
A pair of dark green binoculars.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`trashbag.png`
```
A tied black garbage bag, full and round.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`brushcutter.png`
```
A grass trimmer (brush cutter) with a long silver shaft, a red engine and a round cutting blade, shown diagonally.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`pruningsaw.png`
```
A Japanese pruning saw with a curved silver blade and a red wooden handle, shown diagonally.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`logs.png`
```
A neat stack of cut wooden logs, showing their round light-colored ends.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```
`sapling.png`
```
A young tree sapling with a few fresh green leaves, planted in a small mound of brown soil.
Cute sticker-style game icon, soft 3D cartoon shading, rounded friendly shapes, clean dark outline with a thick white sticker border, a single object centered with 10% margin, bright vivid colors, plain white background, no text, 1024x1024.
```

---

## 4. 登山ルート図（1枚）

ファイル名：`route_map.png`（横長 16:9、1920×1080）

全山・全コースで同じ絵を使います。登っている位置（ピン）、「9合目」などの文字、出来事のアイコンは、アプリ側で上に重ねます。そのため、**絵の中にはピン・文字・数字を入れない** でください。
道は、ふもとから山頂まで途切れずにはっきり見えるようにしてください（その道に沿ってピンを動かします）。

```
An illustrated hiking route map like the ones in a Japanese mountain guidebook. One big green mountain seen from the side at a slight angle, built from layered ridges in several shades of green separated by thin white contour lines, a light blue sky above. A single winding beige footpath, clearly visible and continuous from start to end, starts at the foot of the mountain in the lower right corner, zigzags up the slope, and ends at the summit near the top center, where a small yellow-orange flag stands. Along the path, in this order from bottom to top: a broadleaf forest, a small grey rocky area, a little waterfall beside the trail, a blank wooden signpost, and an alpine meadow with small flowers just below the summit. Flat vector illustration with soft shading, clean simple shapes, bright and friendly. No people, no text, no numbers, no map pins, no watermark. Wide 16:9 landscape, 1920x1080.
```

---

## 納品前チェック
- [ ] ファイル名が表どおり
- [ ] 画像の中に文字・数字・ロゴ・透かし（ウォーターマーク）がない
- [ ] 背景は横長 16:9
- [ ] 山整備の「悪化」（1-11）は「良好」（1-10）と同じ構図
- [ ] 登山ルート図の道が、ふもとから山頂までつながっている
