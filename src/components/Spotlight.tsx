import { useEffect, useRef, useState } from 'react';
import { search, IMG, mediaTitle, mediaYear } from '../api/tmdb';
import type { MediaItem } from '../api/tmdb';

interface SpotlightProps {
  onClose: () => void;
  onPlay: (item: MediaItem, type: 'movie' | 'tv') => void;
}

export function Spotlight({ onClose, onPlay }: SpotlightProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); return; }
      if (e.key === 'Enter' && results[selected]) {
        const item = results[selected];
        onPlay(item, item.media_type === 'tv' ? 'tv' : 'movie');
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [results, selected, onClose, onPlay]);

  function handleChange(val: string) {
    setQuery(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await search(val);
        setResults(
          (data.results ?? [])
            .filter((r: MediaItem) => r.media_type !== 'person')
            .slice(0, 7)
        );
        setSelected(0);
      } finally {
        setLoading(false);
      }
    }, 280);
  }

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-modal" onClick={e => e.stopPropagation()}>
        <div className="spotlight-input-row">
          {loading ? (
            <svg className="spotlight-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 15 15" fill="currentColor" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
              <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM9.5 10.207l3.146 3.147-.707.707L8.793 10.9A4.5 4.5 0 1 1 9.5 10.207Z" fillRule="evenodd" clipRule="evenodd"/>
            </svg>
          )}
          <input
            ref={inputRef}
            className="spotlight-input"
            value={query}
            onChange={e => handleChange(e.target.value)}
            placeholder="Search movies & TV shows..."
          />
          <kbd className="spotlight-esc">esc</kbd>
        </div>

        {results.length > 0 && (
          <ul className="spotlight-results">
            {results.map((item, i) => {
              const type = item.media_type === 'tv' ? 'tv' : 'movie';
              return (
                <li
                  key={item.id}
                  className={`spotlight-result ${i === selected ? 'selected' : ''}`}
                  onClick={() => { onPlay(item, type); onClose(); }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div className="spotlight-result-thumb">
                    {item.poster_path ? (
                      <img src={IMG(item.poster_path, 'w92')} alt="" />
                    ) : (
                      <div className="spotlight-result-thumb-empty" />
                    )}
                  </div>
                  <div className="spotlight-result-info">
                    <div className="spotlight-result-title">{mediaTitle(item)}</div>
                    <div className="spotlight-result-meta">
                      <span className={`spotlight-badge ${type}`}>{type === 'tv' ? 'TV' : 'Film'}</span>
                      {mediaYear(item) && <span>{mediaYear(item)}</span>}
                      {item.vote_average > 0 && <span>★ {item.vote_average.toFixed(1)}</span>}
                    </div>
                  </div>
                  <div className="spotlight-result-play">
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="currentColor">
                      <path d="M3 2.5a.5.5 0 0 1 .757-.429l10 5.5a.5.5 0 0 1 0 .858l-10 5.5A.5.5 0 0 1 3 13.5v-11Z"/>
                    </svg>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && query && results.length === 0 && (
          <div className="spotlight-empty">Nothing found for "<strong>{query}</strong>"</div>
        )}

        <div className="spotlight-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> play</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
