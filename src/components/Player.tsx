import { useEffect, useState } from 'react';
import { getTVDetails, mediaTitle } from '../api/tmdb';
import type { MediaItem, Season } from '../api/tmdb';

interface Provider {
  name: string;
  movie: (id: number) => string;
  tv: (id: number, s: number, e: number) => string;
}

const providers: Provider[] = [
  {
    name: 'VidSrc',
    movie: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'Embed.su',
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'AutoEmbed',
    movie: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    name: 'VidLink',
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    name: 'MultiEmbed',
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
];

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
  const [providerIdx, setProviderIdx] = useState(0);
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

  function handleProviderChange(idx: number) {
    setProviderIdx(idx);
    setIframeKey(k => k + 1);
  }

  const provider = providers[providerIdx];
  const embedUrl = type === 'movie'
    ? provider.movie(item.id)
    : provider.tv(item.id, season, episode);

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

          <div className="player-selectors">
            <select
              className="player-select"
              value={providerIdx}
              onChange={e => handleProviderChange(Number(e.target.value))}
            >
              {providers.map((p, i) => (
                <option key={p.name} value={i}>{p.name}</option>
              ))}
            </select>

            {type === 'tv' && seasons.length > 0 && (
              <>
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
                    <option key={ep} value={ep}>Ep {ep}</option>
                  ))}
                </select>
              </>
            )}
          </div>

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
