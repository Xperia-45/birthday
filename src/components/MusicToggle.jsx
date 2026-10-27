import { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';
import './MusicToggle.css';

export default function MusicToggle() {
  const { playing, muted, volume, needsTap, supported, toggleMusic, toggleMute, changeVolume } =
    useAudio();
  const [open, setOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const wrapRef = useRef(null);
  const hintTimer = useRef(null);

  // a friendly nudge towards the music, shown briefly on arrival
  useEffect(() => {
    setHintVisible(true);
    hintTimer.current = window.setTimeout(() => setHintVisible(false), 11000);
    return () => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, []);

  useEffect(() => {
    if (playing || open) setHintVisible(false);
  }, [playing, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleTrigger = useCallback(() => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && !playing && !muted) {
      // starting from a tap keeps mobile browsers happy
      toggleMusic();
    }
  }, [muted, open, playing, toggleMusic]);

  if (!supported) return null;

  const showHint = hintVisible && !open && !playing && !muted;

  return (
    <div className="music" ref={wrapRef}>
      {showHint && (
        <span className="music__hint" aria-hidden="true">
          music? 🎵
        </span>
      )}

      <button
        type="button"
        className={`music__btn${playing ? ' is-playing' : ''}${muted ? ' is-muted' : ''}${
          needsTap ? ' needs-tap' : ''
        }`}
        onClick={handleTrigger}
        aria-label={
          playing ? 'Music settings — music is playing' : 'Open music settings to start the music'
        }
        aria-expanded={open}
        aria-controls="music-panel"
      >
        {muted ? (
          <VolumeX size={20} strokeWidth={2.3} aria-hidden="true" />
        ) : playing ? (
          <span className="music__bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        ) : (
          <Music size={20} strokeWidth={2.2} aria-hidden="true" />
        )}
        {!muted && (
          <span className="music__note" aria-hidden="true">
            ♪
          </span>
        )}
      </button>

      {open && (
        <div className="music__panel" id="music-panel" role="group" aria-label="Music controls">
          <div className="music__panel-head">
            <div>
              <p className="music__title">Birthday music box</p>
              <p className="music__subtitle">
                {muted ? 'All sound is muted' : playing ? 'Playing softly 🎵' : 'Tap play whenever you like'}
              </p>
            </div>
            <button
              type="button"
              className="music__close"
              onClick={() => setOpen(false)}
              aria-label="Close music settings"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="music__row">
            <button
              type="button"
              className={`music__action${playing ? ' is-on' : ''}`}
              onClick={toggleMusic}
              aria-pressed={playing}
            >
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className={`music__action${muted ? ' is-on' : ''}`}
              onClick={toggleMute}
              aria-pressed={muted}
            >
              {muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
              {muted ? 'Unmute' : 'Mute'}
            </button>
          </div>

          <label className="music__volume">
            <span className="sr-only">Music volume</span>
            <Volume2 size={15} aria-hidden="true" />
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={Math.round(volume * 100)}
              onChange={(event) => changeVolume(Number(event.target.value) / 100)}
              className="music__range"
            />
            <span className="music__value" aria-hidden="true">
              {Math.round(volume * 100)}%
            </span>
          </label>

          <p className="music__note-text">
            {needsTap
              ? 'Your browser blocked autoplay — tap Play to start the tune.'
              : 'A gentle music-box melody, made right here in the page.'}
          </p>
        </div>
      )}
    </div>
  );
}
