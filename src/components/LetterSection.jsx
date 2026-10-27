import BirthdayLetter from './BirthdayLetter';
import './Sections.css';

export default function LetterSection({ reduced, onOpened, onRead, onGoToParty }) {
  return (
    <section id="letter" className="section letter-section" aria-labelledby="letter-heading">
      <div className="letter-section__wash" aria-hidden="true" />

      <div className="section__head">
        <span className="chip">💌 a letter for you</span>
        <h2 className="section__title" id="letter-heading">
          Something I wrote for you
        </h2>
        <p className="section__sub">
          A short birthday note, sealed with gold — open it whenever you&apos;re ready.
        </p>
      </div>

      <BirthdayLetter
        reduced={reduced}
        onOpened={onOpened}
        onRead={onRead}
        onGoToParty={onGoToParty}
      />
    </section>
  );
}
