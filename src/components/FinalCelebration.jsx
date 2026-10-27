import { useCallback, useMemo, useRef, useState } from 'react';
import { Mail, PartyPopper, Sparkles } from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';
import { useBurst } from './ConfettiBursts';
import { BalloonArt } from './Balloon';
import { useInView } from '../hooks/useInView';
import { pick, rand } from '../lib/random';
import './FinalCelebration.css';

const TITLE_WORDS = ['HAPPY', '17TH', 'BIRTHDAY,', 'VANSHITA!'];

const CONFETTI_COLORS = [
  '#ff5aa6',
  '#ffb0d4',
  '#c9a7ff',
  '#a98bf5',
  '#ffc08a',
  '#a5d8ff',
  '#f6d47f',
  '#ffffff',
];

const BALLOON_SET = [
  { left: 4, size: 52, palette: 0, delay: 0, duration: 13 },
  { left: 17, size: 38, palette: 2, delay: 3.4, duration: 16 },
  { left: 31, size: 46, palette: 3, delay: 1.6, duration: 14.5 },
  { left: 47, size: 34, palette: 1, delay: 5, duration: 17 },
  { left: 62, size: 50, palette: 4, delay: 2.4, duration: 15 },
  { left: 76, size: 40, palette: 5, delay: 6.4, duration: 18 },
  { left: 89, size: 46, palette: 0, delay: 4.2, duration: 15.5 },
];

const SPARKS = [
  { left: '9%', top: '18%', size: 16, delay: 0 },
  { left: '88%', top: '12%', size: 20, delay: 0.6 },
  { left: '76%', top: '34%', size: 12, delay: 1.2 },
  { left: '15%', top: '44%', size: 14, delay: 0.35 },
  { left: '92%', top: '58%', size: 15, delay: 0.9 },
  { left: '6%', top: '68%', size: 13, delay: 1.5 },
  { left: '64%', top: '78%', size: 17, delay: 0.2 },
  { left: '34%', top: '88%', size: 12, delay: 1.1 },
];

const HEARTS = [
  { left: '12%', delay: 0, duration: 11, size: 18 },
  { left: '27%', delay: 3, duration: 13, size: 13 },
  { left: '52%', delay: 6, duration: 12, size: 22 },
  { left: '71%', delay: 1.5, duration: 14, size: 15 },
  { left: '85%', delay: 7.5, duration: 12.5, size: 19 },
];

function HeartShape({ size }) {
  return (
    <svg viewBox="0 0 24 22" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M12 21S1.5 14.6 1.5 7.9C1.5 4.2 4.3 1.5 7.6 1.5c2 0 3.5 1 4.4 2.3.9-1.3 2.4-2.3 4.4-2.3 3.3 0 6.1 2.7 6.1 6.4C22.5 14.6 12 21 12 21Z"
        fill="url(#party-heart)"
      />
      <defs>
        <linearGradient id="party-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc2dd" />
          <stop offset="100%" stopColor="#ff6fb5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SparkleStar({ size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <path
        d="M12 1c1.2 6 3.8 8.6 9.8 9.8-6 1.2-8.6 3.8-9.8 9.8-1.2-6-3.8-8.6-9.8-9.8C8.2 9.6 10.8 7 12 1Z"
        fill="url(#party-star)"
      />
      <defs>
        <linearGradient id="party-star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7dc" />
          <stop offset="100%" stopColor="#eec264" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ConfettiRain({ replayKey }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: `${replayKey}-${index}`,
        left: rand(0, 100),
        delay: -rand(0, 9),
        duration: rand(6, 11),
        drift: rand(-60, 60),
        rot: rand(180, 1080) * (Math.random() > 0.5 ? 1 : -1),
        size: rand(6, 11),
        color: pick(CONFETTI_COLORS),
        shape: pick(['sq', 'ci', 'ri']),
      })),
    [replayKey]
  );

  return (
    <div className="confetti-rain">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={`confetti-rain__p is-${piece.shape}`}
          style={{
            left: `${piece.left}%`,
            '--size': `${piece.size.toFixed(1)}px`,
            '--color': piece.color,
            '--drift': `${piece.drift.toFixed(0)}px`,
            '--rot': `${piece.rot.toFixed(0)}deg`,
            '--dur': `${piece.duration.toFixed(2)}s`,
            '--delay': `${piece.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function FinalCelebration({ unlocked, onGoToLetter, reduced }) {
  const [sectionRef, inView] = useInView({ threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  const [replayKey, setReplayKey] = useState(0);
  const replayButton = useRef(null);
  const { playSfx } = useAudio();
  const { burst } = useBurst();

  const replay = useCallback(() => {
    setReplayKey((key) => key + 1);
    playSfx('whoosh');
    playSfx('chime');
    const node = replayButton.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
        count: 26,
        spread: 1.5,
      });
    }
  }, [burst, playSfx]);

  return (
    <section
      id="party"
      ref={sectionRef}
      className={`party${inView ? ' is-in' : ''}${unlocked ? ' is-unlocked' : ''}`}
      aria-labelledby="party-heading"
    >
      <div className="party__bg" aria-hidden="true">
        <span className="party__glow" />
        {inView && !reduced && <ConfettiRain replayKey={replayKey} />}
        {SPARKS.map((spark, index) => (
          <span
            key={`spark-${index}`}
            className="party__spark"
            style={{
              left: spark.left,
              top: spark.top,
              animationDelay: `${spark.delay}s`,
            }}
          >
            <SparkleStar size={spark.size} />
          </span>
        ))}
        {BALLOON_SET.map((balloon, index) => (
          <span
            key={`balloon-${index}`}
            className="party__balloon"
            style={{
              left: `${balloon.left}%`,
              width: balloon.size,
              animationDelay: `${balloon.delay}s`,
              animationDuration: `${balloon.duration}s`,
            }}
          >
            <BalloonArt paletteIndex={balloon.palette} id={`party-${index}`} />
          </span>
        ))}
        {HEARTS.map((heart, index) => (
          <span
            key={`heart-${index}`}
            className="party__heart"
            style={{
              left: heart.left,
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
            }}
          >
            <HeartShape size={heart.size} />
          </span>
        ))}
      </div>

      <div className="party__content">
        <span className="chip party__chip">
          <Sparkles size={13} aria-hidden="true" /> the big day
        </span>

        {unlocked ? (
          <>
            <h2 id="party-heading" className="party__title" key={`title-${replayKey}`}>
              {TITLE_WORDS.map((word, index) => (
                <span className="party__word" style={{ '--i': index }} key={`${word}-${index}`}>
                  {word}{' '}
                </span>
              ))}
              <span className="party__emoji">🎂💗</span>
            </h2>

            <p className="party__sub">
              Seventeen looks wonderful on you, Vanshita. Here&apos;s to a year of big laughs, tiny
              joys and every wish coming true. 🎀
            </p>

            <div className="party__actions">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={replay}
                ref={replayButton}
              >
                CELEBRATE AGAIN! 🎉
              </button>
              <button type="button" className="btn btn--soft" onClick={onGoToLetter}>
                <Mail size={17} aria-hidden="true" /> Revisit your letter
              </button>
            </div>

            <p className="party__footer">
              <PartyPopper size={15} aria-hidden="true" /> Made with 💗 by Ayush · for Vanshita&apos;s
              17th
            </p>
          </>
        ) : (
          <div className="party__locked card">
            <span className="party__locked-icon" aria-hidden="true">
              ✨
            </span>
            <h2 className="party__locked-title" id="party-heading">
              One more surprise is hiding here
            </h2>
            <p className="party__locked-text">
              Your letter unlocks the finale. Open the envelope, read the golden ink, then come
              back for the confetti.
            </p>
            <button type="button" className="btn btn--gold" onClick={onGoToLetter}>
              Go to your letter 💌
            </button>
            <p className="party__footer">
              <PartyPopper size={15} aria-hidden="true" /> Made with 💗 by Ayush · for Vanshita&apos;s
              17th
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
