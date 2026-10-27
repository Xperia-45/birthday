import BirthdayCake from './BirthdayCake';
import './Sections.css';

export default function CakeSection({ onGoToLetter }) {
  return (
    <section id="cake" className="section cake-section" aria-labelledby="cake-heading">
      <div className="section__head">
        <span className="chip">🎂 make a wish</span>
        <h2 className="section__title" id="cake-heading">
          Your birthday cake is ready
        </h2>
        <p className="section__sub">
          Make a wish and tap the candles to blow them out! 🕯️
        </p>
      </div>

      <div className="cake-section__stage">
        <span className="cake-section__halo" aria-hidden="true" />
        <BirthdayCake onGoToLetter={onGoToLetter} />
      </div>
    </section>
  );
}
