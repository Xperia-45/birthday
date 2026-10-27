import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Mail, RotateCcw, Sparkles } from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';
import { useBurst } from './ConfettiBursts';
import { BalloonArt } from './Balloon';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './BirthdayCake.css';

const CAKE_W = 360;
const CAKE_H = 400;

const CANDLES = [
  { cx: 104, base: '#ff6fb5', light: '#ffc4de' },
  { cx: 142, base: '#a98bf5', light: '#ddd0ff' },
  { cx: 180, base: '#ff9f6b', light: '#ffd6b8' },
  { cx: 218, base: '#6fbcf0', light: '#c6e8ff' },
  { cx: 256, base: '#f46a9b', light: '#ffc0d5' },
];

const TIERS = [
  {
    id: 'bottom',
    x: 46,
    y: 250,
    w: 268,
    h: 106,
    rx: 20,
    fill: 'url(#cake-tier-1)',
    drips: 11,
    depth: 30,
    sprinkles: 26,
    seed: 7,
    beads: 24,
  },
  {
    id: 'middle',
    x: 74,
    y: 174,
    w: 212,
    h: 86,
    rx: 18,
    fill: 'url(#cake-tier-2)',
    drips: 9,
    depth: 26,
    sprinkles: 19,
    seed: 21,
    beads: 19,
  },
  {
    id: 'top',
    x: 96,
    y: 110,
    w: 168,
    h: 74,
    rx: 16,
    fill: 'url(#cake-tier-3)',
    drips: 7,
    depth: 22,
    sprinkles: 12,
    seed: 42,
    beads: 15,
  },
];

const SPRINKLE_COLORS = ['#ffffff', '#ff8fc0', '#b79cf7', '#8fc9f7', '#f6d47f', '#ffb98c', '#f65ba4'];
const SPRINKLE_DEPTHS = [0.98, 0.55, 0.8, 0.42, 1, 0.68, 0.5, 0.88, 0.62, 0.94, 0.48];

/* deterministic pseudo-random so the cake looks identical on every render */
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scalloped frosting that hangs over the top edge of a tier. */
function frostingPath(x, y, w, drips, depth) {
  const step = w / drips;
  let d = `M${x} ${y} H${x + w} V${y + 9}`;
  let cursor = x + w;
  for (let i = 0; i < drips; i += 1) {
    const nextX = cursor - step;
    const dip = y + 9 + depth * SPRINKLE_DEPTHS[i % SPRINKLE_DEPTHS.length];
    d += ` C${(cursor - step * 0.18).toFixed(1)} ${dip.toFixed(1)}, ${(nextX + step * 0.18).toFixed(
      1
    )} ${dip.toFixed(1)}, ${nextX.toFixed(1)} ${y + 9}`;
    cursor = nextX;
  }
  return `${d} Z`;
}

function buildSprinkles(tier) {
  const rnd = mulberry32(tier.seed);
  return Array.from({ length: tier.sprinkles }, (_, i) => {
    const x = tier.x + 14 + rnd() * (tier.w - 28);
    const y = tier.y + 38 + rnd() * (tier.h - 54);
    return {
      id: `${tier.id}-sp-${i}`,
      x,
      y,
      stick: rnd() > 0.45,
      len: 5 + rnd() * 5,
      rot: rnd() * 180,
      color: SPRINKLE_COLORS[Math.floor(rnd() * SPRINKLE_COLORS.length)],
    };
  });
}

function buildBeads(tier) {
  const inset = 14;
  const span = tier.w - inset * 2;
  const count = Math.max(8, tier.beads);
  return Array.from({ length: count }, (_, i) => ({
    id: `${tier.id}-bd-${i}`,
    cx: tier.x + inset + (span / (count - 1)) * i,
    cy: tier.y + tier.h - 7,
  }));
}

const SPRINKLES_BY_TIER = TIERS.map(buildSprinkles);
const BEADS_BY_TIER = TIERS.map(buildBeads);

const SUGAR_SPARKLES = [
  { left: '8%', top: '12%', size: 18, delay: 0 },
  { left: '86%', top: '8%', size: 22, delay: 0.25 },
  { left: '94%', top: '38%', size: 14, delay: 0.5 },
  { left: '4%', top: '46%', size: 16, delay: 0.15 },
  { left: '16%', top: '68%', size: 12, delay: 0.6 },
  { left: '90%', top: '72%', size: 17, delay: 0.35 },
  { left: '46%', top: '2%', size: 20, delay: 0.45 },
  { left: '62%', top: '82%', size: 13, delay: 0.7 },
  { left: '30%', top: '6%', size: 12, delay: 0.2 },
  { left: '74%', top: '60%', size: 15, delay: 0.55 },
];

const RISING_BALLOONS = [
  { left: 6, size: 44, palette: 0, delay: 0.1, duration: 6.4 },
  { left: 22, size: 34, palette: 2, delay: 0.9, duration: 7.2 },
  { left: 44, size: 50, palette: 3, delay: 0.4, duration: 6 },
  { left: 62, size: 36, palette: 1, delay: 1.3, duration: 7.6 },
  { left: 78, size: 46, palette: 4, delay: 0.2, duration: 6.8 },
  { left: 90, size: 32, palette: 5, delay: 1, duration: 7.9 },
];

export default function BirthdayCake({ onGoToLetter }) {
  const reduced = useReducedMotion();
  const { playSfx } = useAudio();
  const { burst } = useBurst();

  const [blown, setBlown] = useState(() => CANDLES.map(() => false));
  const [blowing, setBlowing] = useState(() => CANDLES.map(() => false));
  const [smoking, setSmoking] = useState(() => CANDLES.map(() => false));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [celebrationId, setCelebrationId] = useState(0);
  const [showDim, setShowDim] = useState(false);

  const cakeRef = useRef(null);
  const wishRef = useRef(null);
  const timers = useRef(new Set());
  const celebratedRef = useRef(false);

  const schedule = useCallback((fn, ms) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  const litCount = blown.filter((value) => !value).length;
  const allBlown = litCount === 0;
  const celebrationOn = allBlown && celebrationId > 0;

  const blowOut = useCallback(
    (index, event) => {
      if (blown[index] || blowing[index]) return;
      setHasInteracted(true);
      setBlowing((prev) => prev.map((value, i) => (i === index ? true : value)));
      setSmoking((prev) => prev.map((value, i) => (i === index ? true : value)));
      playSfx('blow');

      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height * 0.32, {
          count: 6,
          spread: 0.34,
          kind: 'puff',
        });
      }

      schedule(() => {
        setBlown((prev) => prev.map((value, i) => (i === index ? true : value)));
        setBlowing((prev) => prev.map((value, i) => (i === index ? false : value)));
      }, 330);

      schedule(() => {
        setSmoking((prev) => prev.map((value, i) => (i === index ? false : value)));
      }, 1500);
    },
    [blown, blowing, burst, playSfx, schedule]
  );

  /* The grand candle moment — guarded so it fires exactly once. */
  useEffect(() => {
    if (litCount !== 0 || celebratedRef.current) return;
    celebratedRef.current = true;
    setCelebrationId((id) => id + 1);
    setShowDim(true);
    playSfx('whoosh');
    playSfx('chime');

    const node = cakeRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height * 0.42, {
        count: reduced ? 8 : 30,
        spread: 1.7,
      });
      schedule(() => {
        burst(rect.left + rect.width * 0.32, rect.top + rect.height * 0.3, {
          count: reduced ? 5 : 18,
          spread: 1.25,
        });
      }, 260);
      schedule(() => {
        burst(rect.left + rect.width * 0.7, rect.top + rect.height * 0.36, {
          count: reduced ? 5 : 18,
          spread: 1.25,
        });
      }, 520);
    }

    schedule(() => setShowDim(false), 3000);
    schedule(() => {
      const node = wishRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const dock = 86;
      if (rect.top > 0 && rect.bottom < window.innerHeight - dock) return;
      node.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }, 900);
  }, [litCount, burst, playSfx, reduced, schedule]);

  const relight = useCallback(() => {
    celebratedRef.current = false;
    setBlown(CANDLES.map(() => false));
    setBlowing(CANDLES.map(() => false));
    setSmoking(CANDLES.map(() => false));
    setCelebrationId(0);
    setShowDim(false);
    setHasInteracted(true);
    playSfx('pop');
  }, [playSfx]);

  const hits = useMemo(
    () =>
      CANDLES.map((candle, index) => {
        const slot = 38;
        return {
          index,
          left: `${((candle.cx - slot / 2) / CAKE_W) * 100}%`,
          width: `${(slot / CAKE_W) * 100}%`,
          top: `${(22 / CAKE_H) * 100}%`,
          height: `${(100 / CAKE_H) * 100}%`,
        };
      }),
    []
  );

  return (
    <div className="cake-block">
      <div className="cake__counter-row">
        <p className="cake__counter" aria-live="polite">
          <Flame size={16} strokeWidth={2.4} aria-hidden="true" />
          <span>
            {litCount} of {CANDLES.length} candles lit
          </span>
        </p>
        {hasInteracted && !allBlown && (
          <button type="button" className="cake__reset-link" onClick={relight}>
            <RotateCcw size={13} aria-hidden="true" /> Relight
          </button>
        )}
      </div>

      <div
        className={`cake${celebrationOn ? ' is-celebrating' : ''}`}
        ref={cakeRef}
        key={`cake-${celebrationId}`}
      >
        <span className="cake__glow" aria-hidden="true" />

        <svg
          className="cake__art"
          viewBox={`0 0 ${CAKE_W} ${CAKE_H}`}
          role="img"
          aria-label="A three tier birthday cake with five lit candles"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="cake-tier-1" cx="42%" cy="18%" r="92%">
              <stop offset="0%" stopColor="#ffd0e6" />
              <stop offset="55%" stopColor="#ffa8ce" />
              <stop offset="100%" stopColor="#f285b1" />
            </radialGradient>
            <radialGradient id="cake-tier-2" cx="38%" cy="16%" r="95%">
              <stop offset="0%" stopColor="#f2e8ff" />
              <stop offset="55%" stopColor="#d6c2fa" />
              <stop offset="100%" stopColor="#b9a0ef" />
            </radialGradient>
            <radialGradient id="cake-tier-3" cx="36%" cy="16%" r="95%">
              <stop offset="0%" stopColor="#fffaf0" />
              <stop offset="55%" stopColor="#ffedd4" />
              <stop offset="100%" stopColor="#ffd9b5" />
            </radialGradient>
            <linearGradient id="cake-frosting" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#fff8ef" />
              <stop offset="100%" stopColor="#ffecf5" />
            </linearGradient>
            <linearGradient id="cake-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff0bd" />
              <stop offset="45%" stopColor="#f3cf74" />
              <stop offset="100%" stopColor="#d9a739" />
            </linearGradient>
            <linearGradient id="cake-gold-text" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff4c9" />
              <stop offset="40%" stopColor="#efc868" />
              <stop offset="100%" stopColor="#c9971f" />
            </linearGradient>
            <radialGradient id="cake-plate" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fff2f8" />
              <stop offset="100%" stopColor="#ffdcec" />
            </radialGradient>
            <radialGradient id="cake-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(197,92,142,0.34)" />
              <stop offset="100%" stopColor="rgba(197,92,142,0)" />
            </radialGradient>
            <radialGradient id="cake-flame" cx="50%" cy="68%" r="62%">
              <stop offset="0%" stopColor="#fff8d8" />
              <stop offset="42%" stopColor="#ffe08a" />
              <stop offset="80%" stopColor="#ffac3f" />
              <stop offset="100%" stopColor="#ff8a2b" />
            </radialGradient>
            <radialGradient id="cake-flame-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,214,122,0.85)" />
              <stop offset="55%" stopColor="rgba(255,196,96,0.35)" />
              <stop offset="100%" stopColor="rgba(255,190,90,0)" />
            </radialGradient>
            <linearGradient id="cake-side-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="55%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(120,40,80,0.14)" />
            </linearGradient>
            {TIERS.map((tier) => (
              <clipPath key={tier.id} id={`cake-clip-${tier.id}`}>
                <rect x={tier.x} y={tier.y} width={tier.w} height={tier.h} rx={tier.rx} />
              </clipPath>
            ))}
            {CANDLES.map((candle, index) => (
              <clipPath key={`candle-clip-${index}`} id={`cake-candle-clip-${index}`}>
                <rect x={candle.cx - 8} y={62} width={16} height={48} rx={7} />
              </clipPath>
            ))}
          </defs>

          {/* ground + plate */}
          <ellipse cx="180" cy="374" rx="152" ry="20" fill="url(#cake-shadow)" />
          <ellipse cx="180" cy="362" rx="144" ry="19" fill="url(#cake-plate)" />
          <ellipse
            cx="180"
            cy="358"
            rx="144"
            ry="18"
            fill="none"
            stroke="url(#cake-gold)"
            strokeWidth="2.4"
            opacity="0.85"
          />
          <ellipse cx="180" cy="355" rx="118" ry="11" fill="#fff8fc" opacity="0.75" />

          {/* tiers */}
          {TIERS.map((tier, tierIndex) => (
            <g key={tier.id} clipPath={`url(#cake-clip-${tier.id})`}>
              <rect x={tier.x} y={tier.y} width={tier.w} height={tier.h} fill={tier.fill} />
              <rect
                x={tier.x}
                y={tier.y}
                width={tier.w}
                height={tier.h}
                fill="url(#cake-side-shade)"
              />
              <rect
                x={tier.x}
                y={tier.y}
                width={tier.w}
                height={tier.h}
                fill="url(#cake-side-shade)"
                opacity="0.5"
              />
              <path
                d={frostingPath(tier.x, tier.y, tier.w, tier.drips, tier.depth)}
                fill="url(#cake-frosting)"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="1"
              />
              {SPRINKLES_BY_TIER[tierIndex].map((sprinkle) =>
                sprinkle.stick ? (
                  <rect
                    key={sprinkle.id}
                    x={sprinkle.x}
                    y={sprinkle.y}
                    width={sprinkle.len}
                    height={2.8}
                    rx={1.4}
                    fill={sprinkle.color}
                    opacity="0.95"
                    transform={`rotate(${sprinkle.rot.toFixed(1)} ${sprinkle.x} ${sprinkle.y})`}
                  />
                ) : (
                  <circle
                    key={sprinkle.id}
                    cx={sprinkle.x}
                    cy={sprinkle.y}
                    r={2.1}
                    fill={sprinkle.color}
                    opacity="0.9"
                  />
                )
              )}
              {BEADS_BY_TIER[tierIndex].map((bead) => (
                <circle
                  key={bead.id}
                  cx={bead.cx}
                  cy={bead.cy}
                  r={2.5}
                  fill="url(#cake-gold)"
                  opacity="0.95"
                />
              ))}
            </g>
          ))}

          {/* 17 written on the cake */}
          <text
            x="180"
            y="326"
            textAnchor="middle"
            fontFamily="'Baloo 2', 'Trebuchet MS', sans-serif"
            fontWeight="800"
            fontSize="34"
            fill="url(#cake-gold-text)"
            stroke="#fff7ea"
            strokeWidth="3.4"
            paintOrder="stroke"
            letterSpacing="1"
          >
            17
          </text>
          <circle cx="136" cy="314" r="3" fill="url(#cake-gold)" />
          <circle cx="224" cy="314" r="3" fill="url(#cake-gold)" />

          {/* candles */}
          {CANDLES.map((candle, index) => {
            const lit = !blown[index];
            const puffing = smoking[index];
            return (
              <g key={`candle-${index}`}>
                <rect
                  x={candle.cx - 8}
                  y={64}
                  width={16}
                  height={47}
                  rx={7}
                  fill={candle.light}
                />
                <g clipPath={`url(#cake-candle-clip-${index})`}>
                  <rect x={candle.cx - 8} y={62} width="16" height="50" fill={candle.base} />
                  {[70, 82, 94].map((y) => (
                    <rect
                      key={y}
                      x={candle.cx - 9}
                      y={y}
                      width="18"
                      height="2.6"
                      fill="#ffffff"
                      opacity="0.55"
                    />
                  ))}
                  <rect
                    x={candle.cx + 3}
                    y={62}
                    width="5"
                    height="50"
                    fill="rgba(255,255,255,0.22)"
                  />
                  <rect
                    x={candle.cx + 6}
                    y={62}
                    width="3"
                    height="50"
                    fill="rgba(110,40,80,0.08)"
                  />
                </g>

                {/* wick */}
                <line
                  x1={candle.cx}
                  y1={64}
                  x2={candle.cx}
                  y2={57}
                  stroke="#7a4d5f"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {lit && (
                  <g className={`candle-flame${blowing[index] ? ' is-blowing' : ''}`}>
                    <ellipse
                      cx={candle.cx}
                      cy={47}
                      rx={13}
                      ry={17}
                      fill="url(#cake-flame-glow)"
                      opacity="0.75"
                    />
                    <path
                      d={`M${candle.cx} 33 C ${candle.cx + 7} 43, ${candle.cx + 6.4} 52, ${candle.cx} 57 C ${
                        candle.cx - 6.4
                      } 52, ${candle.cx - 7} 43, ${candle.cx} 33 Z`}
                      fill="url(#cake-flame)"
                    />
                    <path
                      d={`M${candle.cx} 41 C ${candle.cx + 3} 46, ${candle.cx + 2.8} 51, ${candle.cx} 54 C ${
                        candle.cx - 2.8
                      } 51, ${candle.cx - 3} 46, ${candle.cx} 41 Z`}
                      fill="#fffbdc"
                    />
                  </g>
                )}

                {!hasInteracted && lit && (
                  <circle
                    className="candle-halo"
                    cx={candle.cx}
                    cy={46}
                    r={16}
                    fill="none"
                    stroke="rgba(255,164,92,0.5)"
                    strokeWidth="1.6"
                    style={{ animationDelay: `${index * 0.24}s` }}
                  />
                )}

                {puffing && (
                  <g className="candle-smoke" aria-hidden="true">
                    {[0, 1, 2].map((puff) => (
                      <circle
                        key={puff}
                        cx={candle.cx + (puff === 1 ? 3 : puff === 2 ? -3 : 0)}
                        cy={54}
                        r={2.4 + puff * 0.9}
                        fill="#c9b8c6"
                        opacity="0.55"
                        style={{ animationDelay: `${puff * 0.16}s` }}
                      />
                    ))}
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* big, forgiving tap targets for tiny screens */}
        <div className="cake__hits">
          {hits.map((hit) => {
            const lit = !blown[hit.index];
            return (
              <button
                key={`hit-${hit.index}`}
                type="button"
                className={`candle-hit${lit ? '' : ' is-out'}`}
                style={{
                  left: hit.left,
                  width: hit.width,
                  top: hit.top,
                  height: hit.height,
                }}
                onClick={(event) => blowOut(hit.index, event)}
                aria-label={
                  lit
                    ? `Blow out candle ${hit.index + 1} of ${CANDLES.length}`
                    : `Candle ${hit.index + 1} is already blown out`
                }
              >
                <span className="candle-hit__label" aria-hidden="true">
                  {lit ? 'blow' : 'out'}
                </span>
              </button>
            );
          })}
        </div>

        {/* rising balloons drift up from behind the cake */}
        <div className="cake__celebration" aria-hidden="true">
          {celebrationOn &&
            RISING_BALLOONS.map((balloon, index) => (
              <span
                key={`rise-${celebrationId}-${index}`}
                className="cake-balloon"
                style={{
                  left: `${balloon.left}%`,
                  width: balloon.size,
                  animationDelay: `${balloon.delay}s`,
                  animationDuration: `${balloon.duration}s`,
                }}
              >
                <BalloonArt paletteIndex={balloon.palette} id={`cake-${celebrationId}-${index}`} />
              </span>
            ))}
        </div>

        {/* sparkles twinkle above the cake */}
        <div className="cake__celebration cake__celebration--sparkles" aria-hidden="true">
          {celebrationOn &&
            SUGAR_SPARKLES.map((sparkle, index) => (
              <span
                key={`sugar-${celebrationId}-${index}`}
                className="sugar-sparkle"
                style={{
                  left: sparkle.left,
                  top: sparkle.top,
                  width: sparkle.size,
                  height: sparkle.size,
                  animationDelay: `${sparkle.delay}s`,
                }}
              >
                <svg viewBox="0 0 24 24" width="100%" height="100%">
                  <path
                    d="M12 1c1.2 6 3.8 8.6 9.8 9.8-6 1.2-8.6 3.8-9.8 9.8-1.2-6-3.8-8.6-9.8-9.8C8.2 9.6 10.8 7 12 1Z"
                    fill="#f7d886"
                  />
                </svg>
              </span>
            ))}
        </div>
      </div>

      {showDim && <div className="cake-dim" aria-hidden="true" />}

      <div className="cake__hint-row">
        {allBlown ? (
          <p className="cake__instruction cake__instruction--done">
            All five candles are out — wish made! 🌟
          </p>
        ) : (
          <p className="cake__instruction">Tap each flame to blow it out</p>
        )}
      </div>

      {allBlown && (
        <motion.div
          ref={wishRef}
          className="cake__wish card"
          initial={reduced ? false : { opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 210, damping: 22 }}
        >
          <div className="cake__wish-glow" aria-hidden="true" />
          <p className="cake__wish-kicker">
            <Sparkles size={14} aria-hidden="true" /> wish received
          </p>
          <h3 className="cake__wish-title">
            MAKE A WISH, VANSHITA! <span className="cake__wish-emoji">✨</span>
          </h3>
          <p className="cake__wish-text">
            May your 17th year be filled with happiness, laughter, and unforgettable memories. 💗
          </p>
          <div className="cake__wish-actions">
            <button type="button" className="btn btn--soft" onClick={relight}>
              <RotateCcw size={17} aria-hidden="true" /> Relight the candles
            </button>
            <button type="button" className="btn btn--primary" onClick={onGoToLetter}>
              <Mail size={17} aria-hidden="true" /> Read your letter
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
