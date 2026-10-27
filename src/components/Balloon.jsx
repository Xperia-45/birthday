const PALETTES = [
  { light: '#ffd3e8', base: '#ff8fc0', deep: '#e2649c' },
  { light: '#ffe6d3', base: '#ffb98c', deep: '#e88c5f' },
  { light: '#e9dcff', base: '#b79cf7', deep: '#8f70e0' },
  { light: '#d8edff', base: '#8fc9f7', deep: '#619ed6' },
  { light: '#f8dbff', base: '#dd9bf0', deep: '#b96fd0' },
  { light: '#ffe2ea', base: '#ff9db4', deep: '#e0708c' },
];

export const BALLOON_PALETTES = PALETTES;

/** A single dimensional balloon illustration (no external images). */
export function BalloonArt({ paletteIndex = 0, id = 'b', className }) {
  const c = PALETTES[paletteIndex % PALETTES.length];
  const gid = `bg-${id}`;
  return (
    <svg
      className={className}
      viewBox="0 0 60 96"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={gid} cx="34%" cy="24%" r="82%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="50%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.deep} />
        </radialGradient>
        <linearGradient id={`${gid}-k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.deep} />
        </linearGradient>
      </defs>
      <path
        d="M30 3c15.7 0 27.5 11.8 27.5 27.2C57.5 47.6 44 60.4 30 67 16 60.4 2.5 47.6 2.5 30.2 2.5 14.8 14.3 3 30 3Z"
        fill={`url(#${gid})`}
      />
      <ellipse
        cx="21"
        cy="21"
        rx="7"
        ry="11.5"
        fill="#fff"
        opacity="0.34"
        transform="rotate(-20 21 21)"
      />
      <ellipse
        cx="39.5"
        cy="45"
        rx="8"
        ry="5.5"
        fill="#fff"
        opacity="0.13"
        transform="rotate(28 39.5 45)"
      />
      <path d="M26.3 66.6h7.4L30 73z" fill={`url(#${gid}-k)`} />
      <path
        d="M30 73c7 4.5-6.5 8-1 13.5S25 91 25 92.5"
        stroke="rgba(126,72,108,0.32)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
