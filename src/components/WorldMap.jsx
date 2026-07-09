/* 世界マップ背景（手描きSVG）— 企画書のRPG風マップを再現 */
export default function WorldMap() {
  return (
    <svg
      viewBox="0 0 390 700"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ec8f0" />
          <stop offset="45%" stopColor="#aadcf5" />
          <stop offset="100%" stopColor="#e8f5e0" />
        </linearGradient>
        <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b0c8e0" />
          <stop offset="100%" stopColor="#8aa8c8" />
        </linearGradient>
        <linearGradient id="fuji" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8098c0" />
          <stop offset="100%" stopColor="#5878a8" />
        </linearGradient>
        <linearGradient id="mtnMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7ab060" />
          <stop offset="100%" stopColor="#4a8040" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8cc866" />
          <stop offset="100%" stopColor="#5aa040" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7abc55" />
          <stop offset="100%" stopColor="#488530" />
        </linearGradient>
        <linearGradient id="meadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#90cc60" />
          <stop offset="100%" stopColor="#4d8c2c" />
        </linearGradient>
        <linearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#68b8e8" />
          <stop offset="50%" stopColor="#8fd0f5" />
          <stop offset="100%" stopColor="#58a8dc" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8d0" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#ffe890" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffe890" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 空 */}
      <rect width="390" height="700" fill="url(#sky)" />
      {/* 太陽 */}
      <circle cx="320" cy="70" r="80" fill="url(#sun)" />
      <circle cx="320" cy="70" r="22" fill="#fff6c8" opacity="0.9" />

      {/* 雲 */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="80" cy="60" rx="42" ry="14" />
        <ellipse cx="110" cy="52" rx="30" ry="12" />
        <ellipse cx="55" cy="52" rx="24" ry="10" />
      </g>
      <g fill="#ffffff" opacity="0.7">
        <ellipse cx="250" cy="110" rx="34" ry="11" />
        <ellipse cx="275" cy="103" rx="22" ry="9" />
      </g>

      {/* 遠景の山なみ */}
      <path d="M0,240 L40,180 L75,225 L120,150 L165,215 L200,170 L235,210 L270,160 L310,205 L350,175 L390,220 L390,320 L0,320 Z" fill="url(#mtnFar)" opacity="0.75" />

      {/* 富士山型の主峰（雪冠） */}
      <g>
        <path d="M195,120 L120,265 L280,265 Z" fill="url(#fuji)" />
        <path d="M195,120 L168,172 L178,164 L188,175 L200,162 L212,174 L222,166 L 195,120 Z" fill="#ffffff" />
      </g>

      {/* 中景の緑山 */}
      <path d="M0,330 L35,265 L80,315 L130,250 L185,310 L230,262 L285,312 L330,270 L390,318 L390,420 L0,420 Z" fill="url(#mtnMid)" />

      {/* 丘（後列） */}
      <path d="M0,420 Q60,345 140,395 Q220,440 300,380 Q350,350 390,395 L390,520 L0,520 Z" fill="url(#hill1)" />

      {/* 川（蛇行） */}
      <path d="M390,360 Q300,395 260,440 Q220,485 250,530 Q280,572 230,620 Q195,652 210,700 L262,700 Q240,655 280,618 Q330,572 298,522 Q272,482 310,445 Q348,410 390,398 Z" fill="url(#river)" opacity="0.9" />
      <path d="M366,382 Q310,408 278,448 Q252,484 272,520" stroke="#c8ecff" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />

      {/* 丘（前列） */}
      <path d="M0,530 Q80,455 170,505 Q250,548 320,500 Q360,475 390,505 L390,700 L0,700 Z" fill="url(#hill2)" />

      {/* 草地（最前面） */}
      <path d="M0,600 Q100,555 200,585 Q300,615 390,575 L390,700 L0,700 Z" fill="url(#meadow)" />

      {/* 山道 */}
      <path d="M185,700 Q175,640 200,600 Q225,560 205,510 Q190,472 215,430" stroke="#d8bc88" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M185,700 Q175,640 200,600 Q225,560 205,510 Q190,472 215,430" stroke="#c0a068" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.3" strokeDasharray="2 14" />

      {/* 木々 */}
      <Trees x={30} y={470} scale={1} />
      <Trees x={95} y={500} scale={0.8} />
      <Trees x={310} y={455} scale={0.9} />
      <Trees x={345} y={545} scale={1.1} />
      <Trees x={55} y={615} scale={1.2} />
      <Trees x={130} y={578} scale={0.7} />
      <Trees x={290} y={640} scale={1} />

      {/* 岩 */}
      <g fill="#9a9a8a">
        <ellipse cx="255" cy="592" rx="14" ry="8" />
        <ellipse cx="268" cy="596" rx="9" ry="6" fill="#b0b0a0" />
      </g>

      {/* 花 */}
      <g>
        <Flower x={80} y={660} c="#ff8fb0" />
        <Flower x={120} y={640} c="#ffd35c" />
        <Flower x={280} y={665} c="#ff8fb0" />
        <Flower x={320} y={630} c="#c890f0" />
        <Flower x={45} y={585} c="#ffd35c" />
      </g>
    </svg>
  )
}

function Trees({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x="-3" y="18" width="6" height="12" fill="#8a6440" rx="2" />
      <path d="M0,-18 L-16,10 L16,10 Z" fill="#2d7a28" />
      <path d="M0,-8 L-19,20 L19,20 Z" fill="#3d9032" />
      <rect x="21" y="14" width="5" height="10" fill="#8a6440" rx="2" />
      <path d="M23,-10 L10,12 L36,12 Z" fill="#357a2c" />
      <path d="M23,-2 L8,18 L38,18 Z" fill="#48963a" />
    </g>
  )
}

function Flower({ x, y, c }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx="-4" cy="0" r="3" fill={c} />
      <circle cx="4" cy="0" r="3" fill={c} />
      <circle cx="0" cy="-4" r="3" fill={c} />
      <circle cx="0" cy="4" r="3" fill={c} />
      <circle cx="0" cy="0" r="2.4" fill="#fff8d0" />
    </g>
  )
}
