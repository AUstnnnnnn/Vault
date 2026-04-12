import { useEffect, useState, useRef } from 'react';
import { getTVDetails, mediaTitle } from '../api/tmdb';
import type { MediaItem, Season } from '../api/tmdb';

interface Provider {
  name: string;
  tier: number;
  movie: (id: number) => string;
  tv: (id: number, s: number, e: number) => string;
}

const providers: Provider[] = [
  {
    name: 'Embed.su',
    tier: 1,
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: 'MultiEmbed',
    tier: 2,
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: 'AutoEmbed',
    tier: 2,
    movie: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    tv: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    name: 'VidLink',
    tier: 3,
    movie: (id) => `https://vidlink.pro/movie/${id}`,
    tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    name: 'VidSrc',
    tier: 3,
    movie: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
];

const PREF_KEY = 'vault-preferred-provider';

function getPreferredProvider(): number {
  const name = localStorage.getItem(PREF_KEY);
  if (!name) return -1;
  const idx = providers.findIndex(p => p.name === name);
  return idx;
}

function setPreferredProvider(idx: number) {
  localStorage.setItem(PREF_KEY, providers[idx].name);
}

async function probeProvider(url: string, timeout = 4000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    await fetch(url, { mode: 'no-cors', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function findBestProvider(
  type: 'movie' | 'tv',
  id: number,
  season: number,
  episode: number,
): Promise<number> {
  const preferred = getPreferredProvider();

  const results = await Promise.all(
    providers.map(async (p, idx) => {
      const url = type === 'movie' ? p.movie(id) : p.tv(id, season, episode);
      const alive = await probeProvider(url);
      return { idx, tier: p.tier, alive };
    })
  );

  const live = results.filter(r => r.alive);

  if (preferred >= 0 && live.some(r => r.idx === preferred)) {
    return preferred;
  }

  live.sort((a, b) => a.tier - b.tier);
  return live.length > 0 ? live[0].idx : 0;
}

interface PlayerProps {
  item: MediaItem;
  type: 'movie' | 'tv';
  initialSeason?: number;
  initialEpisode?: number;
  onClose: () => void;
}

export function Player({ item, type, initialSeason, initialEpisode, onClose }: PlayerProps) {
  const [visible, setVisible] = useState(false);
  const [season, setSeason] = useState(initialSeason ?? 1);
  const [episode, setEpisode] = useState(initialEpisode ?? 1);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [providerIdx, setProviderIdx] = useState(-1);
  const [probing, setProbing] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const probeId = useRef(0);

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

  useEffect(() => {
    const id = ++probeId.current;
    setProbing(true);
    findBestProvider(type, item.id, season, episode).then(best => {
      if (id !== probeId.current) return;
      setProviderIdx(best);
      setProbing(false);
    });
  }, [item.id, type, season, episode]);

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
    setPreferredProvider(idx);
    setProbing(false);
    setIframeKey(k => k + 1);
  }

  const provider = providerIdx >= 0 ? providers[providerIdx] : null;
  const embedUrl = provider
    ? type === 'movie'
      ? provider.movie(item.id)
      : provider.tv(item.id, season, episode)
    : '';

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
                <option key={p.name} value={i}>
                  {p.name}{providerIdx === i && !probing ? ' ✓' : ''}
                </option>
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
          {probing ? (
            <div className="player-probing">
              <span className="player-probing-dot" />
              Finding best source
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src={embedUrl}
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              referrerPolicy="no-referrer"
              title={mediaTitle(item)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
