import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AudioProvider, useAudio } from './audio/AudioProvider';
import { BurstProvider } from './components/ConfettiBursts';
import SkyDecor from './components/SkyDecor';
import FloatingBalloons from './components/FloatingBalloons';
import OpeningScreen from './components/OpeningScreen';
import StoryRibbon from './components/StoryRibbon';
import CakeSection from './components/CakeSection';
import LetterSection from './components/LetterSection';
import FinalCelebration from './components/FinalCelebration';
import Dock from './components/Dock';
import MusicToggle from './components/MusicToggle';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useActiveSection } from './hooks/useInView';
import './App.css';

const SECTION_IDS = ['story', 'cake', 'letter', 'party'];

// the dock highlights `letter` for the un-opened envelope area too
const DOCK_IDS = ['story', 'cake', 'letter', 'party'];

function Experience() {
  const reduced = useReducedMotion();
  const { startMusic, playSfx } = useAudio();

  const [phase, setPhase] = useState('intro'); // intro | leaving | explore
  const [letterDone, setLetterDone] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const phaseRef = useRef('intro');
  const timers = useRef(new Set());
  const active = useActiveSection(DOCK_IDS);

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

  /* lock scrolling while the opening screen is up */
  useEffect(() => {
    document.body.classList.toggle('is-locked', phase !== 'explore');
    return () => document.body.classList.remove('is-locked');
  }, [phase]);

  /* a gentle "scroll" cue once the surprise is open */
  useEffect(() => {
    if (phase !== 'explore') return undefined;
    setShowScrollHint(true);
    const hideTimer = window.setTimeout(() => setShowScrollHint(false), 6000);
    const onScroll = () => {
      if (window.scrollY > 26) setShowScrollHint(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [phase]);

  const enter = useCallback(() => {
    if (phaseRef.current !== 'intro') return;
    phaseRef.current = 'leaving';
    setPhase('leaving');

    // called directly inside the tap: iOS/Android autoplay policies are happy
    startMusic();
    playSfx('whoosh');

    schedule(() => {
      phaseRef.current = 'explore';
      setPhase('explore');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, reduced ? 140 : 640);
  }, [playSfx, reduced, schedule, startMusic]);

  const goTo = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    },
    [reduced]
  );

  const markLetterRead = useCallback(() => setLetterDone(true), []);

  return (
    <>
      <SkyDecor />
      <FloatingBalloons active />

      {phase !== 'explore' && (
        <OpeningScreen phase={phase} onEnter={enter} reduced={reduced} />
      )}

      <main className={`experience${phase === 'explore' ? ' is-in' : ''}`} id="experience">
        <StoryRibbon onNavigate={goTo} />

        <CakeSection onGoToLetter={() => goTo('letter')} />

        <LetterSection
          reduced={reduced}
          onOpened={() => {}}
          onRead={markLetterRead}
          onGoToParty={() => goTo('party')}
        />

        <FinalCelebration
          unlocked={letterDone}
          onGoToLetter={() => goTo('letter')}
          reduced={reduced}
        />
      </main>

      {phase !== 'intro' && (
        <>
          <Dock active={active} onNavigate={goTo} partyReady={letterDone} />
          <MusicToggle />
        </>
      )}

      {showScrollHint && (
        <button
          type="button"
          className="scroll-hint"
          onClick={() => {
            setShowScrollHint(false);
            goTo('cake');
          }}
        >
          <span>scroll for your cake</span>
          <ChevronDown size={15} strokeWidth={2.6} aria-hidden="true" />
        </button>
      )}
    </>
  );
}

export default function BirthdayApp() {
  return (
    <AudioProvider>
      <BurstProvider>
        <div className="app">
          <Experience />
        </div>
      </BurstProvider>
    </AudioProvider>
  );
}
