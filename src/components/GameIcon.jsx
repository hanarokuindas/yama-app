/* ゲーム用SVGアイコンセット（絵文字の置き換え・フラットデザイン統一） */

const ICONS = {
  /* ─── ナビ・システム ─── */
  home: (
    <g>
      <path d="M3 11.5 12 4l9 7.5" fill="none" stroke="#e8894a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10.5V20h13v-9.5" fill="#f5a35e" stroke="#e8894a" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="10" y="14" width="4" height="6" rx="1" fill="#8a5a30" />
    </g>
  ),
  mountain: (
    <g>
      <path d="M2 20 9 6l4 7 3-4.5L22 20Z" fill="#5b8bd0" stroke="#3a66a8" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 6l2.2 3.8-1.4-.6-1.3 1.2-1.4-.9-1 .8Z" fill="#fff" />
      <path d="M16 8.5l1.7 2.7-1.1-.5-1 .9-1-.7Z" fill="#fff" />
    </g>
  ),
  volcano: (
    <g>
      <path d="M3 20 9 8h6l6 12Z" fill="#b0623a" stroke="#8a4526" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 8c1 1.5 2 1.5 3 0 1 1.5 2 1.5 3 0" fill="none" stroke="#e84a2a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="5" r="1.4" fill="#ffb03a" />
    </g>
  ),
  forest: (
    <g>
      <path d="M7 3 3 10h2.4L2.6 15h3.6V20h1.6v-5h3.6L8.6 10H11Z" fill="#3d8a35" />
      <path d="M17 6l-3.4 6h2L13 17h3.2v4h1.6v-4H21l-2.6-5h2Z" fill="#2d6e28" />
    </g>
  ),
  search: (
    <g>
      <circle cx="10.5" cy="10.5" r="6" fill="#cfe8ff" stroke="#4a7ab8" strokeWidth="2.2" />
      <line x1="15" y1="15" x2="20.5" y2="20.5" stroke="#4a7ab8" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  muscle: (
    <g>
      <path d="M6 4c3 0 5 1.5 5.5 4.5C14 8 17 9 18.5 12c1.6 3.2-.5 7-4.5 7.5C9 20 5 17 4.5 12 4.2 8.5 4.5 5.5 6 4Z" fill="#f5b26a" stroke="#d88a3a" strokeWidth="1.4" />
      <path d="M11.5 8.5C13 10 13.5 12 12.5 14" fill="none" stroke="#d88a3a" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  saw: (
    <g>
      <rect x="3" y="10" width="12" height="4.6" rx="1" fill="#c8ccd4" stroke="#8a909c" strokeWidth="1.2" transform="rotate(-18 9 12)" />
      <path d="M3.4 15.6l1.6 1.2 1.4-1 1.5 1 1.4-1 1.5 1 1.4-1" fill="none" stroke="#8a909c" strokeWidth="1.2" transform="rotate(-18 9 12)" />
      <rect x="14.5" y="6.8" width="6" height="3.4" rx="1.6" fill="#a06a3a" transform="rotate(-18 17.5 8.5)" />
    </g>
  ),
  picture: (
    <g>
      <rect x="3" y="4.5" width="18" height="15" rx="2" fill="#fdf3dc" stroke="#c8a44a" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.8" fill="#f0c040" />
      <path d="M5 17.5 10 12l3.5 3.5L16 13l3 4.5Z" fill="#6aa84f" />
    </g>
  ),
  camera: (
    <g>
      <rect x="3" y="7" width="18" height="13" rx="2.5" fill="#4a5568" stroke="#2d3748" strokeWidth="1.4" />
      <rect x="8.5" y="4.5" width="7" height="4" rx="1.5" fill="#4a5568" />
      <circle cx="12" cy="13.5" r="4.2" fill="#8fc8e8" stroke="#2d3748" strokeWidth="1.4" />
      <circle cx="12" cy="13.5" r="1.8" fill="#2d3748" />
      <circle cx="18" cy="9.5" r="0.9" fill="#f0c040" />
    </g>
  ),
  phone: (
    <g>
      <rect x="7" y="2.5" width="10" height="19" rx="2.4" fill="#e8ecf4" stroke="#5a6478" strokeWidth="1.8" />
      <rect x="8.6" y="5" width="6.8" height="12" fill="#8fc8e8" />
      <circle cx="12" cy="19" r="1.1" fill="#5a6478" />
    </g>
  ),
  cart: (
    <g>
      <path d="M3 4h2.5l2.2 10.5h10.4L20.5 7H7" fill="none" stroke="#4a7ab8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="19" r="1.8" fill="#4a7ab8" />
      <circle cx="16.5" cy="19" r="1.8" fill="#4a7ab8" />
    </g>
  ),
  lock: (
    <g>
      <rect x="5.5" y="10" width="13" height="10" rx="2.2" fill="#f0c040" stroke="#c89a2a" strokeWidth="1.4" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" fill="none" stroke="#8a909c" strokeWidth="2.2" />
      <circle cx="12" cy="14.5" r="1.5" fill="#8a6a10" />
      <rect x="11.3" y="15" width="1.4" height="2.6" rx="0.7" fill="#8a6a10" />
    </g>
  ),
  star: (
    <path d="M12 2.5l2.8 5.9 6.2.8-4.6 4.4 1.2 6.3L12 16.8l-5.6 3.1 1.2-6.3L3 9.2l6.2-.8Z" fill="#f5c842" stroke="#d8a420" strokeWidth="1.2" strokeLinejoin="round" />
  ),
  heart: (
    <path d="M12 20.5C6 16 3 12.6 3 9a4.6 4.6 0 0 1 8-3.1L12 7l1-1.1A4.6 4.6 0 0 1 21 9c0 3.6-3 7-9 11.5Z" fill="#e85a6a" stroke="#c23a4a" strokeWidth="1.2" />
  ),
  gift: (
    <g>
      <rect x="4" y="9" width="16" height="11" rx="1.6" fill="#e85a6a" />
      <rect x="4" y="9" width="16" height="3.4" fill="#c23a4a" />
      <rect x="10.6" y="6" width="2.8" height="14" fill="#f5c842" />
      <path d="M12 6C10 2.5 5.5 3.5 7 6.5 8 8.2 12 6 12 6Zm0 0c2-3.5 6.5-2.5 5 .5-1 1.7-5-.5-5-.5Z" fill="#f5c842" stroke="#d8a420" strokeWidth="0.8" />
    </g>
  ),
  clipboard: (
    <g>
      <rect x="5" y="4" width="14" height="17" rx="2" fill="#fdf3dc" stroke="#a08a5a" strokeWidth="1.6" />
      <rect x="8.5" y="2.5" width="7" height="3.6" rx="1.2" fill="#8a909c" />
      <line x1="8" y1="10" x2="16" y2="10" stroke="#a08a5a" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="13.5" x2="16" y2="13.5" stroke="#a08a5a" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8" y1="17" x2="13" y2="17" stroke="#a08a5a" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
  book: (
    <g>
      <path d="M4 4.5h7v15H5.5A1.5 1.5 0 0 1 4 18Z" fill="#5b8bd0" />
      <path d="M20 4.5h-7v15h5.5A1.5 1.5 0 0 0 20 18Z" fill="#4a7ab8" />
      <line x1="12" y1="4.5" x2="12" y2="19.5" stroke="#fff" strokeWidth="1.2" />
    </g>
  ),
  doc: (
    <g>
      <path d="M6 2.5h8l4 4V21H6Z" fill="#f4f6fa" stroke="#8a909c" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2.5v4h4" fill="none" stroke="#8a909c" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="9" y1="11" x2="15" y2="11" stroke="#8a909c" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="9" y1="14.5" x2="15" y2="14.5" stroke="#8a909c" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  ),
  sound: (
    <g>
      <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5Z" fill="#5b8bd0" />
      <path d="M15 9c1.6 1.6 1.6 4.4 0 6M17.5 6.5c3 3 3 8 0 11" fill="none" stroke="#5b8bd0" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  user: (
    <g>
      <circle cx="12" cy="8" r="4.4" fill="#f5b26a" stroke="#d88a3a" strokeWidth="1.2" />
      <path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5Z" fill="#5b8bd0" stroke="#3a66a8" strokeWidth="1.2" />
    </g>
  ),
  backpack: (
    <g>
      <rect x="5.5" y="7" width="13" height="13.5" rx="3" fill="#e8894a" stroke="#c26a2e" strokeWidth="1.4" />
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" fill="none" stroke="#c26a2e" strokeWidth="2" />
      <rect x="8" y="13" width="8" height="5.5" rx="1.5" fill="#fdf3dc" stroke="#c26a2e" strokeWidth="1.2" />
      <line x1="12" y1="9.5" x2="12" y2="12" stroke="#c26a2e" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  sparkle: (
    <g>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" fill="#f5c842" />
      <path d="M18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z" fill="#ffe98a" />
    </g>
  ),
  trophy: (
    <g>
      <path d="M7 4h10v6a5 5 0 0 1-10 0Z" fill="#f5c842" stroke="#d8a420" strokeWidth="1.4" />
      <path d="M7 5.5H4.5a3 3 0 0 0 3 4M17 5.5h2.5a3 3 0 0 1-3 4" fill="none" stroke="#d8a420" strokeWidth="1.6" />
      <rect x="10.5" y="14.5" width="3" height="3.5" fill="#d8a420" />
      <rect x="7.5" y="18" width="9" height="2.5" rx="1" fill="#a06a3a" />
    </g>
  ),
  box: (
    <g>
      <rect x="4" y="8" width="16" height="12" rx="1.4" fill="#d8a86a" stroke="#a87a42" strokeWidth="1.4" />
      <path d="M4 8l2-4h12l2 4" fill="#c8985a" stroke="#a87a42" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="12" y1="4" x2="12" y2="20" stroke="#a87a42" strokeWidth="1.2" />
    </g>
  ),
  onsen: (
    <g>
      <ellipse cx="12" cy="16.5" rx="9" ry="4.5" fill="#8fc8e8" stroke="#4a7ab8" strokeWidth="1.4" />
      <path d="M8 11c-1-2 1-3 0-5M12 11c-1-2 1-3 0-5M16 11c-1-2 1-3 0-5" fill="none" stroke="#c8ccd4" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
  warn: (
    <g>
      <path d="M12 3 22 20H2Z" fill="#f5c842" stroke="#d8a420" strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="14.5" stroke="#7a5a10" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="1.3" fill="#7a5a10" />
    </g>
  ),
  check: (
    <g>
      <circle cx="12" cy="12" r="9.5" fill="#4ac878" />
      <path d="M7 12.5l3.5 3.5L17 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  cross: (
    <g>
      <circle cx="12" cy="12" r="9.5" fill="#e85a6a" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  ),
  dango: (
    <g>
      <line x1="12" y1="3" x2="12" y2="21" stroke="#a87a42" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="6.5" r="3" fill="#f0a8b8" />
      <circle cx="12" cy="12" r="3" fill="#fdf3dc" />
      <circle cx="12" cy="17.5" r="3" fill="#9ac86a" />
    </g>
  ),
  beer: (
    <g>
      <rect x="6" y="7" width="10" height="13" rx="1.8" fill="#f5c842" stroke="#d8a420" strokeWidth="1.4" />
      <path d="M16 10h3a1.4 1.4 0 0 1 1.4 1.4v4A1.4 1.4 0 0 1 19 16.8h-3" fill="none" stroke="#d8a420" strokeWidth="1.6" />
      <path d="M6 8c0-2 2-3.5 5-3.5s5 1.5 5 3.5c0 1-1 1.8-2.2 1.5.2 1-.8 1.8-1.8 1.4-.3.8-1.5 1-2.2.4C8.5 12 7 11.2 7.2 10 6.4 9.6 6 8.8 6 8Z" fill="#fff" />
    </g>
  ),
  sunrise: (
    <g>
      <circle cx="12" cy="13" r="4.5" fill="#ffb03a" />
      <path d="M12 4v2.5M4 13H1.5M22.5 13H20M5.6 6.6l1.8 1.8M18.4 6.6l-1.8 1.8" stroke="#ffb03a" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 17h20l-3 4H5Z" fill="#5b8bd0" />
    </g>
  ),
  flagGoal: (
    <g>
      <line x1="6" y1="3" x2="6" y2="21" stroke="#8a909c" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4h12l-3 4 3 4H6Z" fill="#e85a6a" stroke="#c23a4a" strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  ),
  menu: (
    <g>
      <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  climber: (
    <g>
      <circle cx="14" cy="5" r="2.4" fill="#f5b26a" />
      <path d="M14 8c-2.5 0-4 1.5-4.5 4L8 17l2.2.8 1.3-4 2.5 2v5h2.4v-6l-2.4-2.5.6-2.3c1 1.3 2.4 2 4.4 2V9.6c-1.6 0-2.8-.6-3.6-1.6Z" fill="#e8894a" />
      <path d="M6 3v18" stroke="#a87a42" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),

  /* ─── トレーニング ─── */
  yoga: (
    <g>
      <circle cx="12" cy="5.5" r="2.6" fill="#f5b26a" />
      <path d="M12 9c-2 0-3.4 1.2-3.8 3.2L7.5 15c-2 .6-3.5 1.6-3.5 2.8h16c0-1.2-1.5-2.2-3.5-2.8l-.7-2.8C15.4 10.2 14 9 12 9Z" fill="#9a6ad0" />
      <path d="M4 17.8c2-2 5-3 8-3s6 1 8 3" fill="none" stroke="#7a4ab0" strokeWidth="1.4" />
    </g>
  ),
  fire: (
    <g>
      <path d="M12 2.5c1 3-3.5 5-3.5 9a5.5 5.5 0 0 0 11 0c0-2.4-1.2-4-2.5-5.5.2 1.6-.4 2.6-1.5 3C16 6.5 14.5 4 12 2.5Z" fill="#f57a3a" stroke="#d85a20" strokeWidth="1.2" />
      <path d="M12 20a3 3 0 0 1-3-3c0-1.8 1.6-2.6 3-4.5 1.4 1.9 3 2.7 3 4.5a3 3 0 0 1-3 3Z" fill="#ffd35c" />
    </g>
  ),
  lift: (
    <g>
      <line x1="3" y1="8.5" x2="21" y2="8.5" stroke="#5a6478" strokeWidth="2" strokeLinecap="round" />
      <rect x="3" y="5.5" width="2.6" height="6" rx="1" fill="#5a6478" />
      <rect x="18.4" y="5.5" width="2.6" height="6" rx="1" fill="#5a6478" />
      <circle cx="12" cy="13" r="2.2" fill="#f5b26a" />
      <path d="M9 8.5v2.5c0 1 .6 1.7 1.4 2l-1 5.5h1.8l1-4.5h-.4l1 4.5h1.8l-1-5.5c.8-.3 1.4-1 1.4-2V8.5" fill="none" stroke="#e8894a" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
  walk: (
    <g>
      <circle cx="13" cy="4.5" r="2.2" fill="#f5b26a" />
      <path d="M13 7.5c-1.8 0-3 1-3.5 2.6l-1 3.4h2l.8-3 .9 4-2.4 6h2.2l2-5 1.6 2v3h2v-4l-2-2.6.5-2.8c.9 1 2 1.6 3.4 1.6v-2c-1.4 0-2.4-.7-3-1.8-.8-1-1.7-1.4-3.5-1.4Z" fill="#4a9a5a" />
    </g>
  ),
  leg: (
    <g>
      <path d="M10 3v7l-3 8h2.5l3-7.5V3Z" fill="#f5b26a" stroke="#d88a3a" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12.5 10.5 14 18h5v-2h-3.2l-1-5.5Z" fill="#f5b26a" stroke="#d88a3a" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="8" y="18" width="5.5" height="2.6" rx="1.3" fill="#8a5a30" />
    </g>
  ),
  stretch: (
    <g>
      <circle cx="7" cy="5" r="2.2" fill="#f5b26a" />
      <path d="M7 8C5.5 8 4.6 9 4.3 10.4L3 17h2l1.2-5.4L9 14l6 1.6 5-1v-2.2l-4.8 1-5.6-1.6-.8-2.4C8.4 8.5 7.8 8 7 8Z" fill="#4a9ad0" />
    </g>
  ),
  breath: (
    <g>
      <circle cx="12" cy="8" r="4" fill="#f5b26a" stroke="#d88a3a" strokeWidth="1.2" />
      <path d="M10.4 7.4a.9.9 0 1 1 0 .1M13.4 7.4a.9.9 0 1 1 0 .1" fill="#5a4430" />
      <path d="M10.8 10.2c.8.6 1.6.6 2.4 0" fill="none" stroke="#5a4430" strokeWidth="1" strokeLinecap="round" />
      <path d="M17 7c2 .5 3 1.5 3.5 3M17.5 10c1.2.3 2 .9 2.5 2" fill="none" stroke="#8fc8e8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 13.5c-2 1.5-3 4-2.5 7h13c.5-3-.5-5.5-2.5-7" fill="#4a9ad0" />
    </g>
  ),

  /* ─── ゲームアイテム（岩場） ─── */
  rock: (
    <path d="M5 18 4 13l4-5 6-1.5L20 10l.5 5-3 4H7Z" fill="#a8a89a" stroke="#7a7a6e" strokeWidth="1.4" strokeLinejoin="round" />
  ),
  gem: (
    <g>
      <path d="M7 4h10l4 5-9 11L3 9Z" fill="#6ad0e8" stroke="#3a9ab8" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7 4 12 9l5-5M3 9h18M12 9v11" fill="none" stroke="#3a9ab8" strokeWidth="1.1" />
    </g>
  ),
  pickaxe: (
    <g>
      <path d="M4 8C7 4.5 12 3.5 16.5 5 12.5 5 9 6.5 6.5 9.5Z" fill="#8a909c" />
      <line x1="6.5" y1="7" x2="18.5" y2="19.5" stroke="#a87a42" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  ),
  bat: (
    <g>
      <path d="M2.5 8C5 10.5 7 10.6 8.5 9.6c.3 1.3 1 2 2 2.3L12 15l1.5-3.1c1-.3 1.7-1 2-2.3 1.5 1 3.5.9 6-1.6-1 3.8-3 6-5.5 6.6L12 20l-4-5.4C5.5 14 3.5 11.8 2.5 8Z" fill="#5a4a78" stroke="#3d3155" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="10.6" cy="10.4" r="0.7" fill="#ffd35c" />
      <circle cx="13.4" cy="10.4" r="0.7" fill="#ffd35c" />
    </g>
  ),
  orb: (
    <g>
      <circle cx="12" cy="11" r="7" fill="#b08ae8" stroke="#7a5ab8" strokeWidth="1.4" />
      <ellipse cx="9.5" cy="8.5" rx="2.2" ry="1.4" fill="#e0ccff" transform="rotate(-30 9.5 8.5)" />
      <path d="M7 19.5h10l-1.5-2.6h-7Z" fill="#8a6a3a" />
    </g>
  ),

  /* ─── ゲームアイテム（登山道） ─── */
  herb: (
    <g>
      <path d="M12 21c0-6 0-10 4.5-14C17 11 15 15 12 16.5" fill="none" stroke="#3d8a35" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18c-.5-4-2-6.5-5.5-8 .5 4.5 2.5 7 5.5 8Z" fill="#4a9a40" />
      <path d="M16.5 7C14 9.5 13 12 12.8 15c2.7-1.3 4-4 3.7-8Z" fill="#5aaa4a" />
    </g>
  ),
  mushroom: (
    <g>
      <path d="M4 11c0-4.5 3.6-7.5 8-7.5s8 3 8 7.5c0 1-.8 1.5-1.8 1.5H5.8C4.8 12.5 4 12 4 11Z" fill="#e85a4a" stroke="#c23a2e" strokeWidth="1.2" />
      <circle cx="9" cy="7.5" r="1.4" fill="#ffe8e0" />
      <circle cx="14.5" cy="9" r="1.1" fill="#ffe8e0" />
      <path d="M9 12.5h6l-.8 6.5a2.2 2.2 0 0 1-4.4 0Z" fill="#fdf3dc" stroke="#d8c4a0" strokeWidth="1.1" />
    </g>
  ),
  butterfly: (
    <g>
      <path d="M11 11C8 6.5 4.5 5.5 3 7.5s0 6 3.5 6.5c-2.5 1.5-2 4.5 0 5s4-1.5 4.5-4Z" fill="#6ab0e8" stroke="#4a88c0" strokeWidth="1" />
      <path d="M13 11c3-4.5 6.5-5.5 8-3.5s0 6-3.5 6.5c2.5 1.5 2 4.5 0 5s-4-1.5-4.5-4Z" fill="#8fc8f5" stroke="#4a88c0" strokeWidth="1" />
      <path d="M12 8.5v9" stroke="#4a4458" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.2 8 9.8 5.5M12.8 8l1.4-2.5" stroke="#4a4458" strokeWidth="1" strokeLinecap="round" />
    </g>
  ),
  paw: (
    <g>
      <ellipse cx="6.5" cy="9" rx="2" ry="2.6" fill="#a87a52" />
      <ellipse cx="11" cy="6.5" rx="2" ry="2.7" fill="#a87a52" />
      <ellipse cx="15.5" cy="7.5" rx="1.9" ry="2.5" fill="#a87a52" />
      <ellipse cx="18.5" cy="11.5" rx="1.7" ry="2.2" fill="#a87a52" />
      <path d="M12.5 11c3.5 0 6 2.4 6 5 0 2-1.4 3-3 3-1.2 0-2-.6-3-.6s-1.8.6-3 .6c-1.6 0-3-1-3-3 0-2.6 2.5-5 6-5Z" fill="#c29a6a" />
    </g>
  ),
  blossom: (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="12" cy="6.8" rx="2.6" ry="3.6" fill="#f5a8c0" stroke="#e07898" strokeWidth="0.8" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.2" fill="#ffd35c" />
    </g>
  ),

  /* ─── ゲームアイテム（草原） ─── */
  daisy: (
    <g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="12" cy="6.5" rx="1.8" ry="3.4" fill="#fff" stroke="#e0e0d0" strokeWidth="0.6" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.6" fill="#f5c842" />
    </g>
  ),
  cricket: (
    <g>
      <ellipse cx="11" cy="13" rx="7" ry="4" fill="#6aa84f" stroke="#4a8838" strokeWidth="1.2" />
      <circle cx="18" cy="11.5" r="2.6" fill="#7ab85f" stroke="#4a8838" strokeWidth="1.2" />
      <circle cx="19" cy="10.8" r="0.7" fill="#2d3748" />
      <path d="M7 15.5 4.5 20M11 16l-1 4M19.5 9c1-1.5 1-3 .2-4.5" fill="none" stroke="#4a8838" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
  hibiscus: (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M12 12C10 8.5 10 5.5 12 3.5c2 2 2 5 0 8.5Z" fill="#f56a8a" stroke="#d84868" strokeWidth="0.8" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="1.8" fill="#ffd35c" />
      <line x1="12" y1="12" x2="15" y2="17.5" stroke="#d84868" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  ),
  clover: (
    <g>
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d="M12 11.5C9.5 9 9.5 6 12 4.5 14.5 6 14.5 9 12 11.5Z" fill="#4a9a40" stroke="#357a2c" strokeWidth="0.8" transform={`rotate(${a} 12 11.5)`} />
      ))}
      <path d="M12 12c-.5 3-.2 5.5 1.5 8" fill="none" stroke="#357a2c" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
  sunflower: (
    <g>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <ellipse key={a} cx="12" cy="6" rx="1.7" ry="3.2" fill="#f5c030" stroke="#d8a420" strokeWidth="0.5" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.6" fill="#8a5a30" />
      <circle cx="12" cy="12" r="2" fill="#6a4220" />
    </g>
  ),
  lizard: (
    <g>
      <path d="M6 5c2.5 0 4 1.5 4.5 3.5L12 13l3.5 2c2 1 2.5 3 1.5 4.5-2 0-3.5-.8-4.5-2.5l-2.8-2.2C7.5 13.5 6.2 11.5 6 9Z" fill="#5aaa4a" stroke="#3d8a35" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="2.4" fill="#6ab858" stroke="#3d8a35" strokeWidth="1.2" />
      <circle cx="6.4" cy="6.4" r="0.6" fill="#2d3748" />
      <path d="M16.5 18.5c2 .5 3.5 2 4 4" fill="none" stroke="#3d8a35" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 11.5 6.5 13M12.5 14.5l-1.5 2.5" stroke="#3d8a35" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  ),
  squirrel: (
    <g>
      <path d="M16 4c3.5 1 5 4.5 3.5 8-1 2.4-3 3.5-5 3.2" fill="#c26a2e" stroke="#a04e1e" strokeWidth="1.2" />
      <ellipse cx="10" cy="14" rx="5.5" ry="5" fill="#e8894a" stroke="#c26a2e" strokeWidth="1.2" />
      <circle cx="7.5" cy="9" r="3" fill="#e8894a" stroke="#c26a2e" strokeWidth="1.2" />
      <circle cx="6.6" cy="8.4" r="0.7" fill="#2d3748" />
      <path d="M6 6.5 5.2 4.5 7.4 5.5" fill="#c26a2e" />
      <ellipse cx="9" cy="16.5" rx="2" ry="1.2" fill="#ffe0c0" />
    </g>
  ),
  moon: (
    <path d="M15 3a9 9 0 1 0 6 15.5A9.5 9.5 0 0 1 15 3Z" fill="#8a90b8" stroke="#5a6088" strokeWidth="1.4" />
  ),

  /* ─── ショップ装備 ─── */
  cap: (
    <g>
      <path d="M4 13a8 8 0 0 1 16 0v1.5H4Z" fill="#e85a4a" stroke="#c23a2e" strokeWidth="1.3" />
      <path d="M4 14.5h16c2 0 3 .8 3 2H4Z" fill="#c23a2e" />
      <circle cx="12" cy="5.5" r="1" fill="#c23a2e" />
    </g>
  ),
  shirt: (
    <g>
      <path d="M8 4 4 7l2 3.5 2-1V20h8v-10.5l2 1L20 7l-4-3-1.5 1.5h-5Z" fill="#5b8bd0" stroke="#3a66a8" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9.5 4c.5 1.5 1.4 2.2 2.5 2.2S14 5.5 14.5 4" fill="none" stroke="#3a66a8" strokeWidth="1.3" />
    </g>
  ),
  pants: (
    <g>
      <path d="M7 3h10l1.5 18h-4.5L12 11l-2 10H5.5Z" fill="#4a5568" stroke="#2d3748" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="7" y1="6.5" x2="17" y2="6.5" stroke="#2d3748" strokeWidth="1.2" />
    </g>
  ),
  jacket: (
    <g>
      <path d="M8 3.5 3.5 6.5 5 11l2-.8V20.5h10V10.2l2 .8 1.5-4.5-4.5-3-2 2h-3Z" fill="#4a9a5a" stroke="#357a44" strokeWidth="1.3" strokeLinejoin="round" />
      <line x1="12" y1="6" x2="12" y2="20.5" stroke="#357a44" strokeWidth="1.4" />
      <circle cx="12" cy="10" r="0.7" fill="#ffe066" />
      <circle cx="12" cy="14" r="0.7" fill="#ffe066" />
    </g>
  ),
  shoes: (
    <g>
      <path d="M3 16c0-2 1-6 2-8l3 1.5c1.5.8 3 .8 4 0l1.5 3.5c2.5.5 5.5 1.2 7 2.8.8.8.5 2.2-.8 2.2H4.2C3.4 18 3 17.2 3 16Z" fill="#5b8bd0" stroke="#3a66a8" strokeWidth="1.3" />
      <path d="M3 18h18v1.6H3Z" fill="#2d3748" />
      <path d="M9 9.5 8 12M11.5 10.5l-1 2.5" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  ),
  boots: (
    <g>
      <path d="M6 3h7v9c3 .5 6 2 7.5 4.5.6 1-.1 2-1.2 2H6Z" fill="#a06a3a" stroke="#7a4e28" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 18.5h14.5V20H6Z" fill="#5a3a1e" />
      <line x1="8.5" y1="5.5" x2="11" y2="5.5" stroke="#7a4e28" strokeWidth="1.1" strokeLinecap="round" />
      <line x1="8.5" y1="8" x2="11" y2="8" stroke="#7a4e28" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  ),
  socks: (
    <g>
      <path d="M9 3h7v9.5l-4 5A3.6 3.6 0 0 1 6.4 14L9 11Z" fill="#e8ecf4" stroke="#8a909c" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 3h7v3.5H9Z" fill="#e85a6a" />
    </g>
  ),
  gloves: (
    <g>
      <path d="M8 21V10l-2.5-3C4.5 5.5 6 4 7.3 5L9.5 8V3.5a1.2 1.2 0 0 1 2.4 0V8h1V3a1.2 1.2 0 0 1 2.4 0v5h1V4a1.1 1.1 0 0 1 2.2 0v5.5c0 1.5-.4 2.6-1 3.8V21Z" fill="#e8894a" stroke="#c26a2e" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="8" y1="17.5" x2="17.5" y2="17.5" stroke="#c26a2e" strokeWidth="1.2" />
    </g>
  ),
  map: (
    <g>
      <path d="M3 5.5 9 3.5l6 2 6-2v15l-6 2-6-2-6 2Z" fill="#fdf3dc" stroke="#a08a5a" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 3.5v15M15 5.5v15" stroke="#a08a5a" strokeWidth="1" strokeDasharray="2.5 2" />
      <path d="M5.5 10c2-1.5 4 1 6 0s4 .5 6-1" fill="none" stroke="#e85a4a" strokeWidth="1.3" strokeDasharray="2 1.6" />
    </g>
  ),
  flashlight: (
    <g>
      <path d="M7 3h10l-2.5 6v12h-5V9Z" fill="#5a6478" stroke="#3d4658" strokeWidth="1.3" strokeLinejoin="round" transform="rotate(30 12 12)" />
      <path d="M9.5 5.5h5" stroke="#ffd35c" strokeWidth="2.4" strokeLinecap="round" transform="rotate(30 12 12)" />
      <path d="M4 2.5 2 1M3.2 6H1M5.8 4.2 3.5 2" stroke="#ffd35c" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
  battery: (
    <g>
      <rect x="7" y="4.5" width="10" height="17" rx="2" fill="#4ac878" stroke="#2e9e58" strokeWidth="1.4" />
      <rect x="10" y="2.5" width="4" height="3" rx="1" fill="#2e9e58" />
      <path d="M13 8.5 9.8 13.5h2.2l-1 4 3.4-5h-2.4Z" fill="#fff" />
    </g>
  ),
  water: (
    <g>
      <path d="M12 3C8.5 8 6 11 6 14.5a6 6 0 0 0 12 0C18 11 15.5 8 12 3Z" fill="#6ab8e8" stroke="#3a88c0" strokeWidth="1.4" />
      <path d="M9.5 14.5a3.4 3.4 0 0 0 2 3.2" fill="none" stroke="#c8e8ff" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  onigiri: (
    <g>
      <path d="M12 4c3 0 8 5.5 8 10 0 2.5-1.6 4-4 4H8c-2.4 0-4-1.5-4-4 0-4.5 5-10 8-10Z" fill="#fdf8ec" stroke="#d8ccb0" strokeWidth="1.4" />
      <rect x="9.5" y="12" width="5" height="6" rx="0.8" fill="#3d5540" />
    </g>
  ),
  raincoat: (
    <g>
      <path d="M12 3a7 7 0 0 1 7 7v10.5H5V10a7 7 0 0 1 7-7Z" fill="#f5c030" stroke="#d8a420" strokeWidth="1.4" />
      <path d="M12 3v17.5M8.5 10.5v10M15.5 10.5v10" stroke="#d8a420" strokeWidth="1.1" />
      <path d="M9 6.5a4 4 0 0 1 6 0" fill="none" stroke="#d8a420" strokeWidth="1.2" />
    </g>
  ),
  bandage: (
    <g>
      <rect x="2.5" y="9" width="19" height="6.5" rx="3.2" fill="#f5c8a0" stroke="#d8a878" strokeWidth="1.2" transform="rotate(-25 12 12)" />
      <rect x="9" y="9.8" width="6" height="4.8" rx="1" fill="#fdf0e0" transform="rotate(-25 12 12)" />
      <circle cx="11" cy="11.4" r="0.45" fill="#d8a878" transform="rotate(-25 12 12)" />
      <circle cx="13" cy="11.4" r="0.45" fill="#d8a878" transform="rotate(-25 12 12)" />
      <circle cx="12" cy="12.8" r="0.45" fill="#d8a878" transform="rotate(-25 12 12)" />
    </g>
  ),
  wear: (
    <g>
      <path d="M9 3.5 5 6l1.5 3 1.5-.8v12h8V8.2l1.5.8L19 6l-4-2.5c-.8 1-1.8 1.5-3 1.5s-2.2-.5-3-1.5Z" fill="#3d4658" stroke="#252c3a" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10 12h4M10 15h4" stroke="#5a88c0" strokeWidth="1.1" strokeLinecap="round" />
    </g>
  ),
  card: (
    <g>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="#5b8bd0" stroke="#3a66a8" strokeWidth="1.4" />
      <rect x="2.5" y="8.5" width="19" height="3" fill="#2d4a80" />
      <rect x="5" y="14" width="7" height="1.8" rx="0.9" fill="#c8dcf5" />
    </g>
  ),
  coin: (
    <g>
      <circle cx="12" cy="12" r="9" fill="#f5c842" stroke="#d8a420" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#d8a420" strokeWidth="1.1" />
      <path d="M12 8v8M9.5 10h5M9.5 14h5" stroke="#a87c10" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),

  /* ─── 山整備 ─── */
  trash: (
    <g>
      <path d="M6 7h12l-1.2 13a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6Z" fill="#8a909c" stroke="#5a6478" strokeWidth="1.3" />
      <rect x="4.5" y="4.5" width="15" height="2.4" rx="1.2" fill="#5a6478" />
      <rect x="9.8" y="2.8" width="4.4" height="2.4" rx="1" fill="#5a6478" />
      <path d="M9.5 10v8M12 10v8M14.5 10v8" stroke="#e8ecf4" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  ),
  scissors: (
    <g>
      <circle cx="6" cy="17.5" r="2.6" fill="none" stroke="#e85a6a" strokeWidth="1.8" />
      <circle cx="6" cy="6.5" r="2.6" fill="none" stroke="#e85a6a" strokeWidth="1.8" />
      <path d="M8 8.5 19.5 17M8 15.5 19.5 7" stroke="#8a909c" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  grass: (
    <g>
      <path d="M4 21c0-5 0-9 -1.5-12C6 10 7 14 7 21Z" fill="#5aaa4a" />
      <path d="M8.5 21c0-6.5.5-11-1-15 4 3 4.5 9 4 15Z" fill="#4a9a40" />
      <path d="M13.5 21c-.5-6 0-10 2.5-13.5.5 4.5-.5 9-.5 13.5Z" fill="#5aaa4a" />
      <path d="M18 21c0-4.5.5-7.5 3-10-.5 4-1 7-1 10Z" fill="#4a9a40" />
    </g>
  ),
  footsteps: (
    <g>
      <ellipse cx="8" cy="7" rx="2.8" ry="4.2" fill="#a87a52" transform="rotate(-12 8 7)" />
      <ellipse cx="7" cy="13.5" rx="1.6" ry="1.1" fill="#a87a52" transform="rotate(-12 7 13.5)" />
      <ellipse cx="16" cy="12" rx="2.8" ry="4.2" fill="#c29a6a" transform="rotate(12 16 12)" />
      <ellipse cx="17" cy="18.5" rx="1.6" ry="1.1" fill="#c29a6a" transform="rotate(12 17 18.5)" />
    </g>
  ),
  tools: (
    <g>
      <path d="M5 3l4.5 4.5-2 2L3 5c-.5-1 .8-2.5 2-2Z" fill="#8a909c" />
      <path d="M8 9.5 18.5 20a1.8 1.8 0 0 0 2.5-2.5L10.5 7Z" fill="#a87a42" stroke="#7a5a2e" strokeWidth="1.1" />
      <path d="M20 4.5a4 4 0 0 0-5.4 4.6L4.8 18.9a1.9 1.9 0 0 0 2.7 2.7l9.8-9.8A4 4 0 0 0 21.5 6l-2.6 2.4-2.2-2.2Z" fill="#5a6478" opacity="0.92" />
    </g>
  ),
  sprout: (
    <g>
      <path d="M12 21v-8" stroke="#4a9a40" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13C12 8.5 9 6 4.5 6 5 10.5 8 13 12 13Z" fill="#5aaa4a" stroke="#3d8a35" strokeWidth="1.1" />
      <path d="M12 11c0-3.5 2.5-5.5 6-5.5-.5 3.5-2.8 5.5-6 5.5Z" fill="#6ab858" stroke="#3d8a35" strokeWidth="1.1" />
    </g>
  ),
  log: (
    <g>
      <rect x="3" y="8" width="15" height="8" rx="1" fill="#c29a6a" stroke="#a87a42" strokeWidth="1.2" />
      <ellipse cx="18" cy="12" rx="3" ry="4" fill="#e0c8a0" stroke="#a87a42" strokeWidth="1.2" />
      <ellipse cx="18" cy="12" rx="1.4" ry="2" fill="none" stroke="#a87a42" strokeWidth="0.9" />
      <path d="M5 10.5h8M6 13.5h7" stroke="#a87a42" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  ),

  /* ─── その他 ─── */
  ruler: (
    <g>
      <rect x="2.5" y="9" width="19" height="6" rx="1" fill="#f5c842" stroke="#d8a420" strokeWidth="1.3" />
      <path d="M6 9v3M9.5 9v2.2M13 9v3M16.5 9v2.2M20 9v3" stroke="#a87c10" strokeWidth="1.1" />
    </g>
  ),
  chart: (
    <g>
      <path d="M3.5 3.5v17h17" fill="none" stroke="#5a6478" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="6.5" y="12" width="3" height="6" rx="0.6" fill="#5b8bd0" />
      <rect x="11" y="8" width="3" height="10" rx="0.6" fill="#4ac878" />
      <rect x="15.5" y="5" width="3" height="13" rx="0.6" fill="#f5c842" />
    </g>
  ),
  timer: (
    <g>
      <circle cx="12" cy="13.5" r="7.5" fill="#e8ecf4" stroke="#5a6478" strokeWidth="1.8" />
      <path d="M12 9v4.5l3 2" fill="none" stroke="#5a6478" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 3h4M12 3v2.5" stroke="#5a6478" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
}

/* 外部生成画像による差し替え:
   src/assets/icons/<name>.png または .webp を置くと自動的にSVGより優先して使われる */
const IMAGE_OVERRIDES = {
  ...import.meta.glob('../assets/icons/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/icons/*.webp', { eager: true, query: '?url', import: 'default' }),
}
function overrideUrl(name) {
  return IMAGE_OVERRIDES[`../assets/icons/${name}.png`] || IMAGE_OVERRIDES[`../assets/icons/${name}.webp`] || null
}

export function iconImageUrl(name) {
  return overrideUrl(name)
}

export default function GameIcon({ name, size = 24, style }) {
  const img = overrideUrl(name)
  if (img) {
    return (
      <img src={img} width={size} height={size} alt=""
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, objectFit: 'contain', ...style }}
        draggable={false} />
    )
  }
  const icon = ICONS[name]
  if (!icon) return null
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} aria-hidden>
      {icon}
    </svg>
  )
}
