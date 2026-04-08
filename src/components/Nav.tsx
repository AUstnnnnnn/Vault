import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavProps {
  onSpotlight: () => void;
}

export function Nav({ onSpotlight }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const shortcut = isMac ? '⌘K' : 'Ctrl K';

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="nav-logo">The Vault</Link>

      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          Home
        </Link>
        <Link to="/movies" className={`nav-link ${location.pathname === '/movies' ? 'active' : ''}`}>
          Movies
        </Link>
        <Link to="/tv" className={`nav-link ${location.pathname === '/tv' ? 'active' : ''}`}>
          TV
        </Link>
      </div>

      <button className="nav-search-btn" onClick={onSpotlight} aria-label="Open search">
        <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
          <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM9.5 10.207l3.146 3.147-.707.707L8.793 10.9A4.5 4.5 0 1 1 9.5 10.207Z" fillRule="evenodd" clipRule="evenodd"/>
        </svg>
        <span>Search</span>
        <kbd className="nav-shortcut">{shortcut}</kbd>
      </button>
    </nav>
  );
}
