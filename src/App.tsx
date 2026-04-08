import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Spotlight } from './components/Spotlight';
import { AmbientLayer } from './components/AmbientLayer';
import { Player } from './components/Player';
import { PasswordGate } from './components/PasswordGate';
import './styles/globals.css';
import type { MediaItem } from './api/tmdb';

function App() {
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [ambientSrc, setAmbientSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ item: MediaItem; type: 'movie' | 'tv' } | null>(null);

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function openPlayer(item: MediaItem, type: 'movie' | 'tv') {
    setPlaying({ item, type });
    setSpotlightOpen(false);
  }

  return (
    <PasswordGate>
    <BrowserRouter>
      <AmbientLayer src={ambientSrc} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Nav onSpotlight={() => setSpotlightOpen(true)} />

        <Routes>
          <Route path="/" element={<Home onHover={setAmbientSrc} />} />
          <Route path="/movies" element={<Home onHover={setAmbientSrc} />} />
          <Route path="/tv" element={<Home onHover={setAmbientSrc} />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>

      {spotlightOpen && (
        <Spotlight
          onClose={() => setSpotlightOpen(false)}
          onPlay={openPlayer}
        />
      )}

      {playing && (
        <Player
          item={playing.item}
          type={playing.type}
          onClose={() => setPlaying(null)}
        />
      )}
    </BrowserRouter>
    </PasswordGate>
  );
}

export default App;
