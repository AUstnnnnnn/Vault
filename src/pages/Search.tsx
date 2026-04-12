import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { search } from '../api/tmdb';
import type { MediaItem } from '../api/tmdb';
import { PosterCard } from '../components/PosterCard';
import { DetailModal } from '../components/DetailModal';
import { Player } from '../components/Player';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<{ item: MediaItem; type: 'movie' | 'tv' } | null>(null);
  const [playing, setPlaying] = useState<{ item: MediaItem; type: 'movie' | 'tv'; season?: number; episode?: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    if (q) doSearch(q);
  }, [searchParams]);

  function doSearch(q: string) {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    search(q)
      .then(d => setResults((d.results ?? []).filter((r: MediaItem) => r.media_type !== 'person' && r.poster_path)))
      .finally(() => setLoading(false));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchParams(val.trim() ? { q: val.trim() } : {});
      doSearch(val);
    }, 300);
  }

  function openPlayer(item: MediaItem, type: 'movie' | 'tv', season?: number, episode?: number) {
    setPlaying({ item, type, season, episode });
  }

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-heading">What are you watching?</h1>
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 15 15" fill="none">
            <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM9.5 10.207l3.146 3.147-.707.707L8.793 10.9A4.5 4.5 0 1 1 9.5 10.207Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Search movies and TV shows..."
            aria-label="Search"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSearchParams({}); inputRef.current?.focus(); }}
              style={{ color: 'var(--text-dim)', fontSize: 18, lineHeight: 1 }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {loading && (
          <div className="search-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 10 }} />
              </div>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <p className="search-results-label">{results.length} results for "{query}"</p>
            <div className="search-grid">
              {results.map((item, i) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  type={item.media_type === 'tv' ? 'tv' : 'movie'}
                  onSelect={(it, t) => setDetail({ item: it, type: t })}
                  animationDelay={i * 40}
                />
              ))}
            </div>
          </>
        )}

        {!loading && query && results.length === 0 && (
          <div className="search-empty">
            <div className="search-empty-title">Nothing found</div>
            <p>Try a different search term</p>
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          item={detail.item}
          type={detail.type}
          onClose={() => setDetail(null)}
          onPlay={openPlayer}
        />
      )}

      {playing && (
        <Player
          item={playing.item}
          type={playing.type}
          initialSeason={playing.season}
          initialEpisode={playing.episode}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}
