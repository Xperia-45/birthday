import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';
import './BirthdayLetter.css';

const LETTER_HEADING = 'Happy 17th Birthday, Vanshita! 🎂';
const LETTER_BODY =
  'Wishing you a beautiful year filled with happiness, laughter, amazing memories, and countless reasons to smile. May this new chapter bring you wonderful surprises and everything that makes you happy. Have the most amazing birthday!';
const SIGNATURE = 'Ayush';

const STAGGER_MS = 11;
const SIGNATURE_PAUSE = 44; // in characters, about half a second

const isEmoji = (ch) => {
  const code = ch.codePointAt(0);
  return code > 0x2100;
};

function countChars(words) {
  return words.reduce((total, word) => total + word.chars.length, 0);
}

function buildWords(text, startIndex) {
  let index = startIndex;
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const chars = Array.from(word).map((ch) => ({ ch, index: index++ }));
      return { id: `${startIndex}-${index}`, chars };
    });
}

const HEADING_WORDS = buildWords(LETTER_HEADING, 0);
const BODY_START = countChars(HEADING_WORDS) + 8;
const BODY_WORDS = buildWords(LETTER_BODY, BODY_START);
const SIG_START = BODY_START + countChars(BODY_WORDS) + SIGNATURE_PAUSE;
const SIG_WORDS = buildWords(SIGNATURE, SIG_START);
const TOTAL_CHARS = SIG_START + SIGNATURE.length;
const REVEAL_MS = TOTAL_CHARS * STAGGER_MS + 950;

function InkWords({ words }) {
  return words.map((word) => (
    <Fragment key={word.id}>
      <span className="word">
        {word.chars.map((c) => (
          <span
            className={`ink-char${isEmoji(c.ch) ? ' ink-emoji' : ''}`}
            style={{ '--i': c.index }}
            key={`${word.id}-${c.index}`}
          >
            {c.ch}
          </span>
        ))}
      </span>{' '}
    </Fragment>
  ));
}

export default function BirthdayLetter({ reduced, onOpened, onRead, onGoToParty }) {
  const [phase, setPhase] = useState('closed'); // closed | opening | open
  const [skipped, setSkipped] = useState(false);
  const [done, setDone] = useState(false);

  const paperRef = useRef(null);
  const timers = useRef(new Set());
  const doneRef = useRef(false);
  const { playSfx } = useAudio();

  const schedule = useCallback((fn, ms) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    onRead?.();
  }, [onRead]);

  const openLetter = useCallback(() => {
    if (phase !== 'closed') return;
    playSfx('whoosh');
    setPhase('opening');

    schedule(() => {
      setPhase('open');
      playSfx('chime');
      onOpened?.();
      // keep the top of the note in view, even while its entrance animation runs
      const settle = (smooth) => {
        const node = paperRef.current;
        if (!node) return;
        const target = 58; // clears the floating music button
        const top = node.getBoundingClientRect().top;
        if (Math.abs(top - target) < 16) return;
        window.scrollBy({ top: top - target, behavior: smooth && !reduced ? 'smooth' : 'auto' });
      };
      schedule(() => settle(true), 180);
      schedule(() => settle(false), 950);
    }, 860);
  }, [onOpened, phase, playSfx, reduced, schedule]);

  // reveal timing (CSS drives the actual animation for performance)
  useEffect(() => {
    if (phase !== 'open' || doneRef.current) return;
    if (reduced) {
      finish();
      return;
    }
    schedule(finish, REVEAL_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  const skip = useCallback(() => {
    if (doneRef.current || phase !== 'open') return;
    setSkipped(true);
    finish();
  }, [finish, phase]);

  const writing = phase === 'open' && !skipped && !reduced && !done;

  const paper = useMemo(
    () => (
      <>
        <p className="letter__kicker">
          <span className="letter__kicker-line" aria-hidden="true" />
          for Vanshita · on her 17th
          <span className="letter__kicker-line" aria-hidden="true" />
        </p>

        <div className="letter__ink gold-ink">
          <p className="letter__heading">
            <InkWords words={HEADING_WORDS} />
          </p>
          <p className="letter__body">
            <InkWords words={BODY_WORDS} />
          </p>
        </div>

        <div className="letter__sign">
          <svg
            className="letter__sign-flourish"
            viewBox="0 0 120 18"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2 12c14-9 26-9 34-2 6 5-4 9-6 4-2-6 12-9 26-8 12 1 22 5 32 2"
              fill="none"
              stroke="url(#letter-gold-line)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path d="M62 3.2c1.5 2.6 2.6 3.7 5.2 5.2-2.6 1.5-3.7 2.6-5.2 5.2-1.5-2.6-2.6-3.7-5.2-5.2 2.6-1.5 3.7-2.6 5.2-5.2Z" fill="#c99a1f" />
            <defs>
              <linearGradient id="letter-gold-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d9b252" stopOpacity="0" />
                <stop offset="35%" stopColor="#c99a1f" />
                <stop offset="75%" stopColor="#e0bf68" />
                <stop offset="100%" stopColor="#d9b252" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <p className="letter__signature gold-ink">
            <InkWords words={SIG_WORDS} />
          </p>
        </div>

        {/* a complete copy for screen readers */}
        <p className="sr-only">
          {LETTER_HEADING}. {LETTER_BODY} Signed, {SIGNATURE}.
        </p>
      </>
    ),
    []
  );

  return (
    <div className="letter-block">
      {phase !== 'open' && (
        <div className={`envelope-stage${phase === 'opening' ? ' is-opening' : ''}`}>
          <span className="envelope-stage__glow" aria-hidden="true" />

          <div className="envelope" role="img" aria-label="A sealed pink envelope addressed to Vanshita">
            <span className="envelope__sparkle envelope__sparkle--1" aria-hidden="true">✦</span>
            <span className="envelope__sparkle envelope__sparkle--2" aria-hidden="true">✧</span>
            <span className="envelope__sparkle envelope__sparkle--3" aria-hidden="true">✦</span>

            <div className="envelope__back" />
            <div className="envelope__sheet" />
            <div className="envelope__pocket" />
            <div className="envelope__to">For Vanshita</div>
            <div className="envelope__flap">
              <span className="envelope__flap-inner" />
            </div>
            <div className="envelope__seal" aria-hidden="true">
              <span>K</span>
            </div>
          </div>
        </div>
      )}

      {phase === 'closed' && (
        <div className="letter-cta">
          <button type="button" className="btn btn--gold btn--lg btn--block" onClick={openLetter}>
            <span>OPEN YOUR LETTER</span>
            <span className="letter-cta__emoji" aria-hidden="true">💌</span>
          </button>
          <p className="letter-cta__hint">A little note, written in golden ink ✨</p>
        </div>
      )}

      {phase === 'open' && writing && (
        <span className="letter__skip-hint" aria-hidden="true">
          <Sparkles size={13} /> tap the letter to reveal it all
        </span>
      )}

      {phase === 'open' && (
        <article
          className={`letter-paper${writing ? ' is-writing' : ' is-complete'}${
            skipped ? ' was-skipped' : ''
          }`}
          ref={paperRef}
          onClick={skip}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              skip();
            }
          }}
          tabIndex={writing ? 0 : -1}
          role={writing ? 'button' : undefined}
          aria-label={writing ? 'Birthday letter. Tap to reveal the whole message at once.' : undefined}
        >
          <span className="letter-paper__tape" aria-hidden="true" />
          <span className="letter-paper__shine" aria-hidden="true" />
          {paper}

        </article>
      )}

      {phase === 'open' && done && (
        <div className="letter-after">
          <button type="button" className="btn btn--primary btn--block" onClick={onGoToParty}>
            <span>One last surprise 🎉</span>
          </button>
          <p className="letter-after__note">Tap to jump to your birthday finale</p>
        </div>
      )}
    </div>
  );
}
