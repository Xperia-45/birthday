import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { musicEngine } from './musicEngine';

const AudioContextValue = createContext(null);

/**
 * Owns the music state so every control stays in sync.
 * Nothing ever starts automatically: `startMusic` is only called from taps.
 */
export function AudioProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [needsTap, setNeedsTap] = useState(false);
  const supported = musicEngine.supported;

  const startMusic = useCallback(async () => {
    if (!supported) return false;
    const ok = await musicEngine.play();
    setPlaying(ok);
    setNeedsTap(!ok);
    return ok;
  }, [supported]);

  const toggleMusic = useCallback(async () => {
    if (playing) {
      musicEngine.pause();
      setPlaying(false);
      setNeedsTap(false);
      return;
    }
    if (muted) {
      setMuted(false);
      musicEngine.setMuted(false);
    }
    await startMusic();
  }, [muted, playing, startMusic]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      musicEngine.setMuted(next);
      return next;
    });
  }, []);

  const changeVolume = useCallback((value) => {
    const next = Math.min(1, Math.max(0, value));
    setVolume(next);
    musicEngine.setVolume(next);
    if (next > 0 && musicEngine.muted) {
      musicEngine.setMuted(false);
      setMuted(false);
    }
  }, []);

  /** Fire-and-forget effects (pop, blow, chime). Safe if audio is unavailable. */
  const playSfx = useCallback((name) => {
    musicEngine.sfx(name);
  }, []);

  // Attempt a silent unlock on the first real tap anywhere, so the small
  // in-page sound effects work even before the music is started.
  useEffect(() => {
    if (!supported) return undefined;
    const unlock = () => {
      musicEngine.unlock();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [supported]);

  // Pause while the tab is hidden, resume when it comes back (if intended).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) musicEngine.suspend();
      else musicEngine.resumeIfNeeded();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const value = useMemo(
    () => ({
      playing,
      muted,
      volume,
      needsTap,
      supported,
      startMusic,
      toggleMusic,
      toggleMute,
      changeVolume,
      playSfx,
    }),
    [
      playing,
      muted,
      volume,
      needsTap,
      supported,
      startMusic,
      toggleMusic,
      toggleMute,
      changeVolume,
      playSfx,
    ]
  );

  return <AudioContextValue.Provider value={value}>{children}</AudioContextValue.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioContextValue);
  if (!ctx) {
    throw new Error('useAudio must be used inside <AudioProvider>');
  }
  return ctx;
}
