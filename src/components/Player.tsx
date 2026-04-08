import { useEffect, useState } from 'react';
import { getTVDetails, mediaTitle } from '../api/tmdb';
import type { MediaItem, Season } from '../api/tmdb';

interface PlayerProps {
  item: MediaItem;
  type: 'movie' | 'tv';
  onClose: () => void;
}

export function Player({ item, type, onClose }: PlayerProps) {
  const [visible, setVisible] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

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
    setTimeout(onClose, 360);
  }

  function handleSeasonChange(s: number) {
    setSeason(s);
    setEpisode(1);
    setIframeKey(k => k + 1);
  }

  function handleEpisodeChange(ep: number) {
    setEpisode(ep);
    setIframeKey(k => k + 1);
  }

  const embedUrl = type === 'movie'
    ? `https://www.vidking.net/embed/movie/${item.id}`
    : `https://www.vidking.net/embed/tv/${item.id}/${season}/${episode}`;

  const currentSeason = seasons.find(s => s.season_number === season);
  const episodeCount = currentSeason?.episode_count ?? 24;

  return (
    <div
      className={`player-backdrop ${visible ? 'visible' : ''}`}
      onClick={close}
    >
      <div
        className={`player-modal ${visible ? 'visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="player-header">
          <span className="player-title">{mediaTitle(item)}</span>

          {type === 'tv' && seasons.length > 0 && (
            <div className="player-selectors">
              <select
                className="player-select"
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
                className="player-select"
                value={episode}
                onChange={e => handleEpisodeChange(Number(e.target.value))}
              >
                {Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                  <option key={ep} value={ep}>Episode {ep}</option>
                ))}
              </select>
            </div>
          )}

          <button className="player-close" onClick={close} aria-label="Close player">
            <svg width="14" height="14" viewBox="0 0 15 15" fill="currentColor">
              <path d="M11.782 4.032a.575.575 0 1 0-.813-.814L7.5 6.687 4.032 3.218a.575.575 0 0 0-.814.814L6.687 7.5l-3.469 3.468a.575.575 0 0 0 .814.814L7.5 8.313l3.469 3.469a.575.575 0 0 0 .813-.814L8.313 7.5l3.469-3.468Z"/>
            </svg>
          </button>
        </div>

        <div className="player-iframe-wrapper">
          <iframe
            key={iframeKey}
            src={embedUrl}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="no-referrer"
            title={mediaTitle(item)}
          />
        </div>
      </div>
    </div>
  );
}
