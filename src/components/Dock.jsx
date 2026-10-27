import { Cake, Home, Mail, PartyPopper } from 'lucide-react';
import './Dock.css';

const ITEMS = [
  { id: 'story', label: 'Home', icon: Home },
  { id: 'cake', label: 'Cake', icon: Cake },
  { id: 'letter', label: 'Letter', icon: Mail },
  { id: 'party', label: 'Party', icon: PartyPopper },
];

export default function Dock({ active, onNavigate, partyReady }) {
  return (
    <nav className="dock" aria-label="Birthday sections">
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            className={`dock__btn${isActive ? ' is-active' : ''}`}
            onClick={() => onNavigate(id)}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="dock__icon">
              <Icon size={18} strokeWidth={2.3} aria-hidden="true" />
              {id === 'party' && !partyReady && <span className="dock__dot" aria-hidden="true" />}
            </span>
            <span className="dock__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
