import './SkyDecor.css';

const STARS = [
  { left: '8%', top: '12%', size: 16, delay: 0 },
  { left: '86%', top: '8%', size: 22, delay: 1.1 },
  { left: '76%', top: '32%', size: 12, delay: 2.2 },
  { left: '12%', top: '46%', size: 13, delay: 0.6 },
  { left: '92%', top: '58%', size: 15, delay: 1.6 },
  { left: '22%', top: '76%', size: 18, delay: 2.8 },
  { left: '66%', top: '88%', size: 11, delay: 0.3 },
];

const HEARTS = [
  { left: '18%', delay: 0, duration: 26, size: 18, opacity: 0.5 },
  { left: '72%', delay: 9, duration: 31, size: 13, opacity: 0.4 },
  { left: '44%', delay: 17, duration: 24, size: 15, opacity: 0.35 },
];

function Star({ size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M12 1c1.2 6 3.8 8.6 9.8 9.8-6 1.2-8.6 3.8-9.8 9.8-1.2-6-3.8-8.6-9.8-9.8C8.2 9.6 10.8 7 12 1Z"
        fill="url(#sky-star)"
      />
      <defs>
        <linearGradient id="sky-star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="100%" stopColor="#f0c96a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Heart({ size }) {
  return (
    <svg viewBox="0 0 24 22" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M12 21S1.5 14.6 1.5 7.9C1.5 4.2 4.3 1.5 7.6 1.5c2 0 3.5 1 4.4 2.3.9-1.3 2.4-2.3 4.4-2.3 3.3 0 6.1 2.7 6.1 6.4C22.5 14.6 12 21 12 21Z"
        fill="url(#sky-heart)"
      />
      <defs>
        <linearGradient id="sky-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb3d5" />
          <stop offset="100%" stopColor="#ff7fbb" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Fixed, decorative sky. Pure CSS/SVG, no images. */
export default function SkyDecor() {
  return (
    <>
      <div className="sky" aria-hidden="true">
        <span className="sky__blob sky__blob--1" />
        <span className="sky__blob sky__blob--2" />
        <span className="sky__blob sky__blob--3" />
        <span className="sky__blob sky__blob--4" />
        <span className="sky__dots" />
        <span className="sky__vignette" />
      </div>
      <div className="ambient" aria-hidden="true">
        {STARS.map((star, index) => (
          <span
            key={`star-${index}`}
            className="ambient__star"
            style={{
              left: star.left,
              top: star.top,
              animationDelay: `${star.delay}s`,
            }}
          >
            <Star size={star.size} />
          </span>
        ))}
        {HEARTS.map((heart, index) => (
          <span
            key={`heart-${index}`}
            className="ambient__heart"
            style={{
              left: heart.left,
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
              opacity: heart.opacity,
            }}
          >
            <Heart size={heart.size} />
          </span>
        ))}
      </div>
    </>
  );
}
