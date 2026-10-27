import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { nextId, pick, rand } from '../lib/random';
import './ConfettiBursts.css';

const CONFETTI_COLORS = [
  '#ff5aa6',
  '#ff9ecb',
  '#c9a7ff',
  '#a98bf5',
  '#ffc08a',
  '#a5d8ff',
  '#f6d47f',
  '#ffffff',
  '#ff7fbb',
];

const SHAPES = ['square', 'circle', 'star', 'ribbon'];
const MAX_BURSTS = 6;

const BurstContext = createContext(null);

function makeParticle(spread) {
  const angle = rand(0, Math.PI * 2);
  const distance = rand(38, 118) * spread;
  return {
    id: nextId('p'),
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance - rand(10, 46),
    size: rand(5, 11),
    color: pick(CONFETTI_COLORS),
    rotate: rand(-320, 320),
    delay: rand(0, 0.06),
    duration: rand(0.62, 1.05),
    shape: pick(SHAPES),
  };
}

/**
 * A single fixed layer that renders short-lived confetti bursts.
 * Bursts are capped and clean themselves up so celebrations can never
 * pile up on slower phones.
 */
export function BurstProvider({ children }) {
  const [bursts, setBursts] = useState([]);
  const timers = useRef(new Set());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  const burst = useCallback((x, y, options = {}) => {
    const { count = 16, spread = 1, kind = 'soft' } = options;
    const particles = Array.from({ length: count }, () => makeParticle(spread));
    const entry = { id: nextId('burst'), x, y, particles, kind };

    setBursts((prev) => {
      if (prev.length >= MAX_BURSTS) return prev;
      return [...prev, entry];
    });

    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setBursts((prev) => prev.filter((b) => b.id !== entry.id));
    }, 1500);
    timers.current.add(timer);
  }, []);

  const value = useMemo(() => ({ burst }), [burst]);

  return (
    <BurstContext.Provider value={value}>
      {children}
      <div className="burst-layer" aria-hidden="true">
        {bursts.map((entry) => (
          <div
            key={entry.id}
            className={`burst burst--${entry.kind}`}
            style={{ left: `${entry.x}px`, top: `${entry.y}px` }}
          >
            <span className="burst__ring" />
            {entry.particles.map((p) => (
              <span
                key={p.id}
                className={`burst__p burst__p--${p.shape}`}
                style={{
                  '--dx': `${p.dx.toFixed(1)}px`,
                  '--dy': `${p.dy.toFixed(1)}px`,
                  '--size': `${p.size.toFixed(1)}px`,
                  '--color': p.color,
                  '--rot': `${p.rotate.toFixed(0)}deg`,
                  '--delay': `${p.delay.toFixed(2)}s`,
                  '--duration': `${p.duration.toFixed(2)}s`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </BurstContext.Provider>
  );
}

export function useBurst() {
  const ctx = useContext(BurstContext);
  if (!ctx) throw new Error('useBurst must be used inside <BurstProvider>');
  return ctx;
}

/** Convenience: burst from the centre of an element. */
export function burstFromElement(burst, element, options) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  burst(rect.left + rect.width / 2, rect.top + rect.height / 2, options);
}
