# Vanshita's 17th Birthday 🎂

A mobile-first, interactive birthday surprise made by **Ayush** for **Vanshita**.
Built with React + Vite, CSS, self-hosted fonts and a synthesised music box — no backend, no external assets, no tracking.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the build on http://localhost:4173
```

---

## The experience

1. **Opening screen** — pastel animated sky, floating balloons that can be tapped and popped, a pulsing “OPEN YOUR BIRTHDAY SURPRISE ✨” button that also starts the music (inside the tap, so mobile autoplay policies are satisfied).
2. **Cake section** — a hand-built SVG three-tier cake with five individually tappable candles. Each flame flickers, blows out, puffs a little smoke, and leaves the candle unlit. A counter tracks what is still lit, and a “Relight” link resets the sequence.
3. **All candles out** — exactly one celebration: a brief dim, confetti bursts, rising balloons, twinkling sugar stars, a cake bounce, and the “MAKE A WISH, VANSHITA! ✨” message with a shortcut into the letter.
4. **Golden letter** — a sealed envelope with a gold wax seal opens, the note rises out, and the message is written character-by-character in golden ink (tap the paper to reveal it instantly). The signature “Ayush” is written last and is the final word. Reduced-motion users get the complete letter immediately.
5. **Final celebration** — unlocked once the letter has been read: “HAPPY 17TH BIRTHDAY, VANSHITA! 🎂💗” with falling confetti, balloons, hearts, stars, a “CELEBRATE AGAIN! 🎉” replay (no reload) and a link back to the letter.
6. **Floating dock** — Home / Cake / Letter / Party, with the active section highlighted. The letter itself is still reachable from the dock and the party section, so nothing can soft-lock.

## Music & sound

`src/audio/musicEngine.js` synthesises everything live with the Web Audio API:

- **Background music** — a gentle music-box arrangement of the *Happy Birthday to You* melody (the melody is public domain; no recordings are redistributed) over soft chords and arpeggios. It loops seamlessly because the loop is generated, not sampled.
- **Sound effects** — balloon pop, candle blow-out, a chime for the reveal and a gentle whoosh.

Why synthesise instead of shipping an MP3? Nothing copyrighted is redistributed, there are zero audio network requests, no missing-asset failure mode, and the loop is seamless by construction.

Controls live in the floating music button (top-right): play/pause, mute (mutes music **and** effects), and a volume slider. Nothing ever autoplays; the first attempt happens only from the opening tap, and if a browser refuses, the button shows a friendly hint and works manually. All audio calls are wrapped in `try/catch`, so the website is fully functional with audio disabled or unsupported.

> Want a real track instead? Drop a licensed file in `public/audio/` and swap `play()`/`pause()` in `musicEngine.js` for an `<audio>` element — the UI only talks to `AudioProvider`.

## Project structure

```
public/
  fonts/            self-hosted woff2 (Baloo 2, Nunito, Dancing Script, Great Vibes)
  favicon.svg
src/
  App.jsx           screen phases, scroll navigation, dock, music mount
  audio/
    musicEngine.js  Web Audio synth (music box + effects)
    AudioProvider.jsx  play/pause/mute/volume/sfx context
  components/
    SkyDecor.jsx        fixed gradient sky, blobs, stars, hearts
    FloatingBalloons.jsx / Balloon.jsx  capped balloon spawner + tappable SVG balloons
    ConfettiBursts.jsx  shared, capped confetti burst layer
    OpeningScreen.jsx
    StoryRibbon.jsx     “welcome in” card with shortcuts
    CakeSection.jsx / BirthdayCake.jsx   the SVG cake, candles, celebration
    LetterSection.jsx / BirthdayLetter.jsx  envelope + golden-ink note
    FinalCelebration.jsx
    Dock.jsx
    MusicToggle.jsx
  hooks/            useReducedMotion, useInView / useActiveSection
  styles are co-located per component; tokens live in src/index.css
```

## Mobile notes

- Designed and tested at 320, 375, 390 and 430 px, plus landscape (740×360) — no horizontal scrolling at any width.
- Safe-area insets are respected (`env(safe-area-inset-*)`), `100svh` is used with a `100vh` fallback.
- Candle tap targets are ~37×98 px on a 390 px screen (invisible, but surrounding the visible candle) — every interaction works by tapping, nothing relies on hover.
- Particle counts are capped (≤7 balloons, ≤6 burst groups, ≤24 confetti pieces) and all continuous motion is transform/opacity based.
- `prefers-reduced-motion` is honoured everywhere: no float/pop/confetti loops, the letter types instantly, celebrations show statically.
- Keyboard support: real `<button>`s throughout, visible focus rings, candle buttons announce their state (“Blow out candle 3 of 5”).

## Deploy to Vercel

The repo is build-ready; it has **not** been deployed from here.

**Option A — dashboard:** push this folder to GitHub → “Add New Project” → import the repo → framework preset **Vite** → build `npm run build`, output `dist` → Deploy.

**Option B — CLI:**

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production
```

`vercel.json` already pins the framework, build command, `dist` output directory, an SPA rewrite and long-lived caching for the fonts.
