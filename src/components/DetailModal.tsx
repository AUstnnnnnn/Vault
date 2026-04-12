import { useEffect, useState } from 'react';
import { IMG, mediaTitle, mediaYear, getTVDetails } from '../api/tmdb';
import type { MediaItem, Season } from '../api/tmdb';
import { isInWatchlist, isSeen, toggleWatchlist, toggleSeen } from '../lib/library';

interface DetailModalProps {
  item: MediaItem;
  type: 'movie' | 'tv';
  onClose: () => void;
  onPlay: (item: MediaItem, type: 'movie' | 'tv', season?: number, episode?: number) => void;
}

export function DetailModal({ item, type, onClose, onPlay }: DetailModalProps) {
  const [visible, setVisible] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [seen, setSeen] = useState(false);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  useEffect(() => {
    setWatchlisted(isInWatchlist(item.id));
    setSeen(isSeen(item.id));
    requestAnimationFrame(() => setVisible(true));

    if (item.backdrop_path) {
      const img = new Image();
      img.src = IMG(item.backdrop_path, 'w1280');
      img.onload = () => setBackdropLoaded(true);
    }

    if (type === 'tv') {
      getTVDetails(item.id).then(data => {
        const filtered: Season[] = (data.seasons ?? []).filter(
          (s: Season) => s.season_number > 0
        );
        setSeasons(filtered);
        if (filtered.length) setSeason(filtered[0].season_number);
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function handleWatchlist() {
    const added = toggleWatchlist(item, type);
    setWatchlisted(added);
  }

  function handleSeen() {
    const added = toggleSeen(item, type);
    setSeen(added);
  }

  function handlePlay() {
    close();
    setTimeout(() => {
      if (type === 'tv') {
        onPlay(item, type, season, episode);
      } else {
        onPlay(item, type);
      }
    }, 260);
  }

  function handleSeasonChange(s: number) {
    setSeason(s);
    setEpisode(1);
  }

  const currentSeason = seasons.find(s => s.season_number === season);
  const episodeCount = currentSeason?.episode_count ?? 24;
  const label = type === 'tv' ? 'Series' : 'Film';

  return (
    <div
      className={`detail-backdrop ${visible ? 'visible' : ''}`}
      onClick={close}
    >
      <div
        className={`detail-modal ${visible ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="detail-hero">
          {item.backdrop_path && (
            <div
              className={`detail-hero-img ${backdropLoaded ? 'loaded' : ''}`}
              style={{ backgroundImage: `url(${IMG(item.backdrop_path, 'w1280')})` }}
            />
          )}
          <div className="detail-hero-fade" />

          <button className="detail-close" onClick={close} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <path d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5l3.469-3.468Z"/>
            </svg>
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-label">{label}</div>
          <h2 className="detail-title">{mediaTitle(item)}</h2>

          <div className="detail-meta">
            {item.vote_average > 0 && (
              <span className="detail-rating">★ {item.vote_average.toFixed(1)}</span>
            )}
            {mediaYear(item) && <span className="detail-year">{mediaYear(item)}</span>}
            {type === 'tv' && item.number_of_seasons && (
              <span className="detail-year">{item.number_of_seasons} season{item.number_of_seasons > 1 ? 's' : ''}</span>
            )}
          </div>

          {item.overview && (
            <p className="detail-overview">{item.overview}</p>
          )}

          {type === 'tv' && seasons.length > 0 && (
            <>
            <div className="detail-divider" />
            <div className="detail-section-label">Select Episode</div>
            <div className="detail-tv-selectors">
              <select
                className="detail-select"
                value={season}
                onChange={e => handleSeasonChange(Number(e.target.value))}
              >
                {seasons.map(s => (
                  <option key={s.season_number} value={s.season_number}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                className="detail-select"
                value={episode}
                onChange={e => setEpisode(Number(e.target.value))}
              >
                {Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                  <option key={ep} value={ep}>Episode {ep}</option>
                ))}
              </select>
            </div>
            </>
          )}

          {type === 'movie' && <div className="detail-divider" />}

          <div className="detail-actions">
            <button className="btn-primary" onClick={handlePlay}>
              <svg width="12" height="12" viewBox="0 0 15 15" fill="currentColor">
                <path d="M3 2.5a.5.5 0 0 1 .757-.429l10 5.5a.5.5 0 0 1 0 .858l-10 5.5A.5.5 0 0 1 3 13.5v-11Z"/>
              </svg>
              {type === 'tv' ? `Play S${season} E${episode}` : 'Watch'}
            </button>

            <button
              className={`detail-btn ${watchlisted ? 'active' : ''}`}
              onClick={handleWatchlist}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {watchlisted ? (
                  <path d="M20 6L9 17l-5-5"/>
                ) : (
                  <>
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </>
                )}
              </svg>
              {watchlisted ? 'Watchlist ✓' : 'Watchlist'}
            </button>

            <button
              className={`detail-btn ${seen ? 'active' : ''}`}
              onClick={handleSeen}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {seen ? 'Seen ✓' : 'Seen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
