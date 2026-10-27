import { useCallback, useEffect, useRef, useState } from 'react';
import { BalloonArt, BALLOON_PALETTES } from './Balloon';
import { useBurst } from './ConfettiBursts';
import { useAudio } from '../audio/AudioProvider';
import { nextId, rand, randInt } from '../lib/random';
import './FloatingBalloons.css';

const MAX_BALLOONS = 7;

function makeBalloon(overrides = {}) {
  const size = randInt(48, 76);
  return {
    id: nextId('balloon'),
    palette: randInt(0, BALLOON_PALETTES.length - 1),
    left: rand(3, 88),
    size,
    duration: rand(13, 21),
    delay: 0,
    drift: rand(-34, 34),
    swayDuration: rand(2.6, 4.4),
    popped: false,
    ...overrides,
  };
}

/** Static, gently placed balloons used when the user prefers reduced motion. */
const STATIC_BALLOONS = [
  { left: 4, bottom: 16, size: 58, palette: 0 },
  { left: 80, bottom: 26, size: 48, palette: 2 },
  { left: 14, bottom: 62, size: 44, palette: 3 },
  { left: 84, bottom: 66, size: 52, palette: 1 },
];

export default function FloatingBalloons({ active }) {
  const [balloons, setBalloons] = useState([]);
  const [reduced, setReduced] = useState(false);
  const timers = useRef(new Set());
  const { burst } = useBurst();
  const { playSfx } = useAudio();

  // read the preference once for the decorative layer
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (event) => setReduced(event.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const schedule = useRef((fn, ms) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  });

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current.clear();
    };
  }, []);

  const spawn = useCallback(() => {
    setBalloons((prev) => {
      if (prev.length >= MAX_BALLOONS) return prev;
      return [...prev, makeBalloon({ delay: 0 })];
    });
  }, []);

  useEffect(() => {
    if (!active) {
      setBalloons([]);
      return undefined;
    }

    if (reduced) {
      setBalloons(
        STATIC_BALLOONS.map((b, index) =>
          makeBalloon({ ...b, palette: b.palette, id: nextId(`static-${index}`), duration: 0 })
        )
      );
      return undefined;
    }

    const startTimers = [120, 900, 1750];
    startTimers.forEach((delay) => schedule.current(spawn, delay));

    const interval = window.setInterval(() => {
      if (document.hidden) return;
      spawn();
    }, 2300);

    return () => {
      window.clearInterval(interval);
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current.clear();
    };
  }, [active, reduced, spawn]);

  const remove = useCallback((id, delay = 0) => {
    schedule.current(() => {
      setBalloons((prev) => prev.filter((b) => b.id !== id));
    }, delay);
  }, []);

  const pop = useCallback(
    (event, balloon) => {
      if (balloon.popped) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height * 0.4;
      burst(x, y, { count: 16, kind: 'pop' });
      playSfx('pop');
      setBalloons((prev) =>
        prev.map((b) => (b.id === balloon.id ? { ...b, popped: true } : b))
      );
      remove(balloon.id, 260);
    },
    [burst, playSfx, remove]
  );

  return (
    <div className="balloon-layer" aria-hidden="false">
      {balloons.map((balloon) => (
        <button
          key={balloon.id}
          type="button"
          className={`balloon${balloon.popped ? ' is-popped' : ''}${
            reduced ? ' is-static' : ''
          }`}
          style={{
            '--left': `${balloon.left}%`,
            '--size': `${balloon.size}px`,
            '--dur': `${balloon.duration}s`,
            '--delay': `${balloon.delay}s`,
            '--drift': `${balloon.drift}px`,
            '--sway-dur': `${balloon.swayDuration}s`,
            bottom: balloon.bottom !== undefined ? `${balloon.bottom}vh` : undefined,
            top: balloon.bottom !== undefined ? 'auto' : undefined,
          }}
          onClick={(event) => pop(event, balloon)}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && event.animationName === 'balloon-rise') {
              remove(balloon.id);
            }
          }}
          aria-label="Pop this birthday balloon"
        >
          <span className="balloon__sway">
            <BalloonArt paletteIndex={balloon.palette} id={balloon.id} className="balloon__art" />
            <span className="balloon__pop-ring" />
          </span>
        </button>
      ))}
    </div>
  );
}
