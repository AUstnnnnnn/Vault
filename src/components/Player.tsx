import { useEffect, useState, useRef, useCallback } from 'react';
import { getTVDetails, mediaTitle, IMG } from '../api/tmdb';
import type { MediaItem, Season } from '../api/tmdb';

interface Provider {
  name: string;
  tier: number;
  movie: (id: number) => string;
  tv: (id: number, s: number, e: number) => string;
}

const providers: Provider[] = [
  {
    name: 'VidSrc',
    tier: 1,
    movie: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
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
    name: 'VidBinge',
    tier: 3,
    movie: (id) => `https://vidbinge.dev/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidbinge.dev/embed/tv/${id}/${s}/${e}`,
  },
];

const PREF_KEY = 'vault-preferred-provider';

function getPreferredProvider(): number {
  const name = localStorage.getItem(PREF_KEY);
  if (!name) return -1;
  return providers.findIndex(p => p.name === name);
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
  if (preferred >= 0 && live.some(r => r.idx === preferred)) return preferred;
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
  const [chromeVisible, setChromeVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);

  const probeId = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const startHideTimer = useCallback(() => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!sourceMenuOpen) setChromeVisible(false);
    }, 3500);
  }, [sourceMenuOpen]);

  const showChrome = useCallback(() => {
    setChromeVisible(true);
    startHideTimer();
  }, [startHideTimer]);

  // Mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    startHideTimer();

    if (type === 'tv') {
      getTVDetails(item.id).then(data => {
        const filtered: Season[] = (data.seasons ?? []).filter(
          (s: Season) => s.season_number > 0
        );
        setSeasons(filtered);
        if (filtered.length && !initialSeason) setSeason(filtered[0].season_number);
      });
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else close();
      }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    }

    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    // Detect mouse entering the player area (works even when iframe has focus)
    function onMouseEnter() { showChrome(); }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    container?.addEventListener('mouseenter', onMouseEnter);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      container?.removeEventListener('mouseenter', onMouseEnter);
      document.body.style.overflow = '';
      clearTimeout(hideTimer.current);
    };
  }, []);

  // Periodically check mouse position to show chrome even when iframe has focus
  useEffect(() => {
    let active = true;

    function onWindowMouseMove() {
      if (active) showChrome();
    }

    // Use capture phase to catch events before iframe swallows them
    window.addEventListener('mousemove', onWindowMouseMove, true);

    return () => {
      active = false;
      window.removeEventListener('mousemove', onWindowMouseMove, true);
    };
  }, [showChrome]);

  // Probe providers
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
    if (document.fullscreenElement) document.exitFullscreen();
    setVisible(false);
    setTimeout(onClose, 300);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
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
    setSourceMenuOpen(false);
  }

  function prevEpisode() {
    if (episode > 1) handleEpisodeChange(episode - 1);
  }

  function nextEpisode() {
    const cs = seasons.find(s => s.season_number === season);
    const max = cs?.episode_count ?? 24;
    if (episode < max) handleEpisodeChange(episode + 1);
  }

  const provider = providerIdx >= 0 ? providers[providerIdx] : null;
  const embedUrl = provider
    ? type === 'movie'
      ? provider.movie(item.id)
      : provider.tv(item.id, season, episode)
    : '';

  const currentSeason = seasons.find(s => s.season_number === season);
  const episodeCount = currentSeason?.episode_count ?? 24;
  const title = mediaTitle(item);

  return (
    <div
      ref={containerRef}
      className={`player-cinema ${visible ? 'visible' : ''}`}
      onMouseMove={showChrome}
    >
      {/* Backdrop art while probing */}
      {probing && item.backdrop_path && (
        <div
          className="player-backdrop-art"
          style={{ backgroundImage: `url(${IMG(item.backdrop_path, 'w1280')})` }}
        />
      )}

      {/* Loading state */}
      {probing && (
        <div className="player-loading">
          <div className="player-loader">
            <div className="player-loader-ring" />
          </div>
          <span className="player-loading-text">Finding best source</span>
        </div>
      )}

      {/* Iframe */}
      {!probing && embedUrl && (
        <iframe
          key={iframeKey}
          className="player-frame"
          src={embedUrl}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          referrerPolicy="no-referrer"
          title={title}
        />
      )}

      {/* Transparent hover zone over iframe to detect mouse movement */}
      <div className="player-hover-zone" onMouseMove={showChrome} />

      {/* Top chrome */}
      <div className={`player-top ${chromeVisible ? 'show' : ''}`}>
        <button className="player-back" onClick={close} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="player-info">
          <span className="player-title">{title}</span>
          {type === 'tv' && (
            <span className="player-episode-label">S{season} E{episode}</span>
          )}
          {provider && (
            <span className="player-provider-badge">{provider.name}</span>
          )}
        </div>

        <button className="player-fullscreen-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Bottom chrome */}
      <div className={`player-bottom ${chromeVisible ? 'show' : ''}`}>
        <div className="player-controls">
          <div className="player-controls-left">
            {type === 'tv' && seasons.length > 0 && (
              <div className="player-tv-nav">
                <button className="player-ep-btn" onClick={prevEpisode} disabled={episode <= 1}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>

                <div className="player-select-wrap">
                  <select className="player-select" value={season} onChange={e => handleSeasonChange(Number(e.target.value))}>
                    {seasons.map(s => (
                      <option key={s.season_number} value={s.season_number}>S{s.season_number}</option>
                    ))}
                  </select>
                  <svg className="player-select-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>

                <div className="player-select-wrap">
                  <select className="player-select" value={episode} onChange={e => handleEpisodeChange(Number(e.target.value))}>
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                      <option key={ep} value={ep}>E{ep}</option>
                    ))}
                  </select>
                  <svg className="player-select-chevron" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                </div>

                <button className="player-ep-btn" onClick={nextEpisode} disabled={episode >= episodeCount}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="player-controls-right">
            {/* Settings menu (contains Source section) */}
            <div className="player-source">
              <button
                className="player-settings-btn"
                onClick={() => setSourceMenuOpen(o => !o)}
                aria-label="Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>

              {sourceMenuOpen && (
                <>
                  <div className="player-source-scrim" onClick={() => setSourceMenuOpen(false)} />
                  <div className="player-source-menu">
                    <div className="player-source-section-label">Source</div>
                    {providers.map((p, i) => (
                      <button
                        key={p.name}
                        className={`player-source-option ${i === providerIdx ? 'active' : ''}`}
                        onClick={() => handleProviderChange(i)}
                      >
                        <span className="player-source-name">{p.name}</span>
                        <span className="player-source-tier">T{p.tier}</span>
                        {i === providerIdx && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
