import { useRef } from 'react';
import type { MediaItem } from '../api/tmdb';
import { PosterCard } from './PosterCard';

interface RowProps {
  title: string;
  items: MediaItem[];
  type?: 'movie' | 'tv';
  onPlay: (item: MediaItem, type: 'movie' | 'tv') => void;
  onHover?: (src: string | null) => void;
}

export function Row({ title, items, type, onPlay, onHover }: RowProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    if (!trackRef.current) return;
    const amount = trackRef.current.clientWidth * 0.7;
    trackRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  }

  if (!items.length) return null;

  return (
    <div className="row">
      <div className="row-header">
        <h2 className="row-title">{title}</h2>
      </div>

      <div className="row-scroll-container">
        <div className="row-arrow left">
          <button className="row-arrow-btn" onClick={() => scroll('left')} aria-label="Scroll left">
            <svg width="13" height="13" viewBox="0 0 15 15" fill="currentColor">
              <path d="M8.842 3.135a.5.5 0 0 1 .023.707L5.435 7.5l3.43 3.658a.5.5 0 0 1-.73.684l-3.75-4a.5.5 0 0 1 0-.684l3.75-4a.5.5 0 0 1 .707-.023Z"/>
            </svg>
          </button>
        </div>

        <div className="row-track" ref={trackRef}>
          {items.map((item, i) => (
            <PosterCard
              key={item.id}
              item={item}
              type={type}
              onPlay={onPlay}
              onHover={onHover}
              animationDelay={i * 35}
            />
          ))}
        </div>

        <div className="row-arrow right">
          <button className="row-arrow-btn" onClick={() => scroll('right')} aria-label="Scroll right">
            <svg width="13" height="13" viewBox="0 0 15 15" fill="currentColor">
              <path d="M6.158 3.135a.5.5 0 0 0-.023.707L9.565 7.5l-3.43 3.658a.5.5 0 0 0 .73.684l3.75-4a.5.5 0 0 0 0-.684l-3.75-4a.5.5 0 0 0-.684.023Z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
