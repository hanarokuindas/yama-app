/* ちびキャラ立ち絵（手描きSVG）— 登山ウェアの少年キャラ */
export default function CharacterSprite({ size = 110 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" aria-hidden>
      <defs>
        <linearGradient id="chHair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b8c8e8" />
          <stop offset="100%" stopColor="#8ea4d0" />
        </linearGradient>
        <linearGradient id="chJacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ec888" />
          <stop offset="100%" stopColor="#2a9860" />
        </linearGradient>
      </defs>

      {/* 影 */}
      <ellipse cx="50" cy="110" rx="26" ry="5" fill="rgba(0,0,0,0.25)" />

      {/* バックパック */}
      <rect x="24" y="52" width="16" height="26" rx="7" fill="#e07840" />
      <rect x="27" y="56" width="10" height="8" rx="3" fill="#c05828" />

      {/* 脚 */}
      <rect x="40" y="86" width="8" height="18" rx="4" fill="#5a6a80" />
      <rect x="53" y="86" width="8" height="18" rx="4" fill="#5a6a80" />
      {/* ブーツ */}
      <rect x="38" y="100" width="12" height="8" rx="3" fill="#7a5030" />
      <rect x="51" y="100" width="12" height="8" rx="3" fill="#7a5030" />

      {/* 体（ジャケット） */}
      <rect x="34" y="54" width="33" height="36" rx="12" fill="url(#chJacket)" />
      <line x1="50.5" y1="58" x2="50.5" y2="88" stroke="#1e7a48" strokeWidth="2" />
      <circle cx="50.5" cy="64" r="1.4" fill="#ffe066" />
      <circle cx="50.5" cy="72" r="1.4" fill="#ffe066" />

      {/* 腕 */}
      <rect x="28" y="56" width="9" height="24" rx="4.5" fill="#3cb474" />
      <rect x="63" y="56" width="9" height="24" rx="4.5" fill="#3cb474" />
      {/* 手 */}
      <circle cx="32.5" cy="82" r="4" fill="#ffd9b8" />
      <circle cx="67.5" cy="82" r="4" fill="#ffd9b8" />

      {/* トレッキングポール */}
      <line x1="70" y1="80" x2="76" y2="108" stroke="#a08050" strokeWidth="3" strokeLinecap="round" />
      <circle cx="69.5" cy="79" r="2.5" fill="#807060" />

      {/* 頭 */}
      <circle cx="50" cy="34" r="22" fill="#ffe2c4" />
      {/* 髪 */}
      <path d="M28,32 Q28,10 50,10 Q72,10 72,32 Q72,26 66,22 Q64,30 58,24 Q54,32 46,25 Q42,32 36,26 Q31,28 28,32 Z" fill="url(#chHair)" />
      <path d="M30,28 Q26,40 30,46 Q32,38 33,32 Z" fill="url(#chHair)" />
      <path d="M70,28 Q74,40 70,46 Q68,38 67,32 Z" fill="url(#chHair)" />

      {/* 目 */}
      <ellipse cx="42" cy="36" rx="3" ry="4.2" fill="#3a4460" />
      <ellipse cx="58" cy="36" rx="3" ry="4.2" fill="#3a4460" />
      <circle cx="43" cy="34.5" r="1.2" fill="#fff" />
      <circle cx="59" cy="34.5" r="1.2" fill="#fff" />
      {/* 眉 */}
      <path d="M38,29 Q42,27 45,29" stroke="#8ea4d0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M55,29 Q58,27 62,29" stroke="#8ea4d0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* 口 */}
      <path d="M46,44 Q50,48 54,44" stroke="#c86850" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* ほほ */}
      <circle cx="36" cy="41" r="3" fill="#ffb8a0" opacity="0.55" />
      <circle cx="64" cy="41" r="3" fill="#ffb8a0" opacity="0.55" />
    </svg>
  )
}
