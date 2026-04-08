import { IMG, mediaTitle, mediaYear } from '../api/tmdb';
import type { MediaItem } from '../api/tmdb';

interface PosterCardProps {
  item: MediaItem;
  type?: 'movie' | 'tv';
  onPlay: (item: MediaItem, type: 'movie' | 'tv') => void;
  onHover?: (src: string | null) => void;
  animationDelay?: number;
}

export function PosterCard({ item, type, onPlay, onHover, animationDelay = 0 }: PosterCardProps) {
  const mediaType = type ?? (item.media_type === 'tv' ? 'tv' : 'movie');

  function handleMouseEnter() {
    if (onHover && item.poster_path) {
      onHover(IMG(item.poster_path, 'w342'));
    }
  }

  function handleMouseLeave() {
    onHover?.(null);
  }

  return (
    <div
      className="card"
      style={animationDelay ? { animationDelay: `${Math.min(animationDelay, 245)}ms` } : undefined}
      onClick={() => onPlay(item, mediaType)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-poster">
        {item.poster_path ? (
          <img
            className="card-img"
            src={IMG(item.poster_path, 'w342')}
            alt={mediaTitle(item)}
            loading="lazy"
          />
        ) : (
          <div className="card-no-poster">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="card-overlay">
          <div className="card-play-btn">
            <svg width="14" height="14" viewBox="0 0 15 15" fill="white">
              <path d="M3 2.5a.5.5 0 0 1 .757-.429l10 5.5a.5.5 0 0 1 0 .858l-10 5.5A.5.5 0 0 1 3 13.5v-11Z"/>
            </svg>
          </div>

          {/* Info panel slides up from bottom */}
          <div className="card-info-panel">
            <div className="card-panel-title">{mediaTitle(item)}</div>
            <div className="card-panel-meta">
              {mediaYear(item) && <span>{mediaYear(item)}</span>}
              {item.vote_average > 0 && (
                <span className="card-panel-rating">★ {item.vote_average.toFixed(1)}</span>
              )}
              <span className="card-panel-type">{mediaType === 'tv' ? 'Series' : 'Film'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
