import { useEffect, useRef, useState } from 'react';
import { IMG, mediaTitle, mediaYear } from '../api/tmdb';
import type { MediaItem } from '../api/tmdb';

interface HeroProps {
  item: MediaItem | null;
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
}

export function Hero({ item, onSelect, onPlay }: HeroProps) {
  const [loaded, setLoaded] = useState(false);
  const [transform, setTransform] = useState('scale(1.06)');
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef<number>(0);

  // Spring-lerp parallax loop
  useEffect(() => {
    function tick() {
      currentX.current += (targetX.current - currentX.current) * 0.035;
      currentY.current += (targetY.current - currentY.current) * 0.035;
      setTransform(
        `scale(1.06) translate(${currentX.current.toFixed(2)}px, ${currentY.current.toFixed(2)}px)`
      );
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current!);
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      targetX.current = ((e.clientX / window.innerWidth) - 0.5) * 22;
      targetY.current = ((e.clientY / window.innerHeight) - 0.5) * 14;
    }
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    setLoaded(false);
    if (!item?.backdrop_path) return;
    const img = new Image();
    img.src = IMG(item.backdrop_path, 'original');
    img.onload = () => setLoaded(true);
  }, [item?.id]);

  if (!item) {
    return (
      <div className="hero">
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
      </div>
    );
  }

  const type = item.media_type === 'tv' ? 'Series' : 'Film';

  return (
    <div className="hero">
      {item.backdrop_path && (
        <div
          className={`hero-backdrop ${loaded ? 'loaded' : ''}`}
          style={{
            backgroundImage: `url(${IMG(item.backdrop_path, 'original')})`,
            transform,
          }}
        />
      )}

      {/* Vignette layers */}
      <div className="hero-vignette-side" />
      <div className="hero-vignette-bottom" />

      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          {type}
        </div>

        <h1 className="hero-title">{mediaTitle(item)}</h1>

        <div className="hero-meta">
          {item.vote_average > 0 && (
            <span className="hero-rating">★ {item.vote_average.toFixed(1)}</span>
          )}
          {mediaYear(item) && <span className="hero-year">{mediaYear(item)}</span>}
        </div>

        {item.overview && (
          <p className="hero-overview">{item.overview}</p>
        )}

        <div className="hero-actions">
          <button className="btn-primary" onClick={() => onPlay(item)}>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="currentColor">
              <path d="M3 2.5a.5.5 0 0 1 .757-.429l10 5.5a.5.5 0 0 1 0 .858l-10 5.5A.5.5 0 0 1 3 13.5v-11Z"/>
            </svg>
            Watch
          </button>
          <button className="detail-btn" onClick={() => onSelect(item)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Info
          </button>
        </div>
      </div>
    </div>
  );
}
