import { motion } from 'framer-motion';
import './OpeningScreen.css';

export default function OpeningScreen({ phase, onEnter, reduced }) {
  const leaving = phase === 'leaving';

  return (
    <div className={`opening${leaving ? ' is-leaving' : ''}`} data-reduced={reduced ? 'true' : 'false'}>
      <div className="opening__inner">
        <p className="opening__from">
          <span aria-hidden="true">🎀</span> A little surprise for you
        </p>

        <div className="opening__badge" aria-hidden="true">
          <span className="opening__badge-ring" />
          <span className="opening__num">17</span>
          <span className="opening__badge-cake">🎂</span>
        </div>
        <span className="opening__badge-label">years of magic</span>

        <h1 className="opening__title">
          Vanshita, your special day is <span className="script opening__almost">almost</span> here!{' '}
          <span aria-hidden="true">🎀</span>
        </h1>

        <p className="opening__sub">
          There are balloons to pop, a cake to blow out and a golden letter waiting inside.
        </p>

        <motion.button
          type="button"
          className="btn btn--primary btn--lg opening__cta"
          onClick={onEnter}
          whileTap={reduced ? undefined : { scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        >
          <span className="opening__cta-label">OPEN YOUR BIRTHDAY SURPRISE</span>
          <span className="btn__spark opening__cta-spark" aria-hidden="true">
            ✨
          </span>
        </motion.button>

        <p className="opening__hint">
          <span aria-hidden="true">🎈</span> Tap to begin · pop the balloons too
        </p>
      </div>
    </div>
  );
}
