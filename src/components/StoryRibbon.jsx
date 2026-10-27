import { Cake, Mail, PartyPopper } from 'lucide-react';
import { useInView } from '../hooks/useInView';
import './Sections.css';

const STEPS = [
  { id: 'cake', label: 'The cake', hint: 'Make a wish', icon: Cake },
  { id: 'letter', label: 'The letter', hint: 'Written in gold', icon: Mail },
  { id: 'party', label: 'The party', hint: 'Confetti time', icon: PartyPopper },
];

export default function StoryRibbon({ onNavigate }) {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section id="story" className={`section story${inView ? ' is-in' : ''}`} aria-labelledby="story-heading">
      <div className="story__card card card--glass" ref={ref}>
        <p className="story__eyebrow">✨ surprise unlocked ✨</p>
        <h2 className="story__title" id="story-heading">
          Welcome in, birthday girl
        </h2>
        <p className="story__sub">Three little moments, all put together for you.</p>

        <ol className="story__steps">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li className="story__step" key={step.id}>
                <button type="button" onClick={() => onNavigate(step.id)} className="story__step-btn">
                  <span className="story__step-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={2.2} />
                  </span>
                  <span className="story__step-text">
                    <span className="story__step-label">
                      <span className="story__step-num" aria-hidden="true">
                        {index + 1}
                      </span>
                      {step.label}
                    </span>
                    <span className="story__step-hint">{step.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
