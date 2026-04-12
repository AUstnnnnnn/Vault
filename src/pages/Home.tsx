import { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { Row } from '../components/Row';
import { Player } from '../components/Player';
import { DetailModal } from '../components/DetailModal';
import {
  getEssentialViewing,
  getWorldCinema,
  getDeepCuts,
  getNewArrivals,
  getSlowBurn,
  get2000sTV,
  getClassicCartoons,
} from '../api/tmdb';
import { getWatchlist, getSeen } from '../lib/library';
import type { MediaItem } from '../api/tmdb';

interface HomeProps {
  filter?: 'movie' | 'tv';
  onHover: (src: string | null) => void;
}

export function Home({ filter, onHover }: HomeProps) {
  const [essential, setEssential] = useState<MediaItem[]>([]);
  const [world, setWorld] = useState<MediaItem[]>([]);
  const [deepCuts, setDeepCuts] = useState<MediaItem[]>([]);
  const [newArrivals, setNewArrivals] = useState<MediaItem[]>([]);
  const [slowBurn, setSlowBurn] = useState<MediaItem[]>([]);
  const [y2kTV, setY2kTV] = useState<MediaItem[]>([]);
  const [cartoons, setCartoons] = useState<MediaItem[]>([]);
  const [detail, setDetail] = useState<{ item: MediaItem; type: 'movie' | 'tv' } | null>(null);
  const [playing, setPlaying] = useState<{ item: MediaItem; type: 'movie' | 'tv'; season?: number; episode?: number } | null>(null);
  const [libraryKey, setLibraryKey] = useState(0);

  useEffect(() => {
    getEssentialViewing().then(d => setEssential(d.results ?? []));
    getWorldCinema().then(d => setWorld(d.results ?? []));
    getDeepCuts().then(d => setDeepCuts(d.results ?? []));
    getNewArrivals().then(d => setNewArrivals(d.results ?? []));
    getSlowBurn().then(d => setSlowBurn(d.results ?? []));
    get2000sTV().then(d => setY2kTV(d.results ?? []));
    getClassicCartoons().then(d => setCartoons(d.results ?? []));
  }, []);

  const watchlist = getWatchlist();
  const seen = getSeen();

  function openDetail(item: MediaItem, type: 'movie' | 'tv') {
    setDetail({ item, type });
  }

  function openPlayer(item: MediaItem, type: 'movie' | 'tv', season?: number, episode?: number) {
    setPlaying({ item, type, season, episode });
  }

  const libraryRows = [
    ...(watchlist.length > 0 ? [{ title: 'Your Watchlist', items: watchlist.map(e => e.item), type: watchlist[0].type }] : []),
    ...(seen.length > 0 ? [{ title: 'Recently Watched', items: seen.map(e => e.item), type: seen[0].type }] : []),
  ];

  const movieRows = [
    { title: 'Essential Viewing', items: essential, type: 'movie' as const },
    { title: 'World Cinema', items: world, type: 'movie' as const },
    { title: 'New Arrivals', items: newArrivals, type: 'movie' as const },
    { title: 'Deep Cuts', items: deepCuts, type: 'movie' as const },
  ];

  const tvRows = [
    { title: 'Slow Burn', items: slowBurn, type: 'tv' as const },
    { title: '2000s TV', items: y2kTV, type: 'tv' as const },
    { title: 'Cartoon Network Vault', items: cartoons, type: 'tv' as const },
  ];

  const contentRows = filter === 'movie' ? movieRows
    : filter === 'tv' ? tvRows
    : [...movieRows, ...tvRows];

  const rows = [...libraryRows, ...contentRows];

  const hero = essential.find(i => i.backdrop_path) ?? null;

  return (
    <div className="page-content">
      <Hero
        item={hero}
        onSelect={item => openDetail(item, item.media_type === 'tv' ? 'tv' : 'movie')}
        onPlay={item => openPlayer(item, item.media_type === 'tv' ? 'tv' : 'movie')}
      />

      <div className="rows-section">
        {rows.map(row => (
          <Row
            key={row.title}
            title={row.title}
            items={row.items}
            type={row.type}
            onSelect={openDetail}
            onHover={onHover}
          />
        ))}
      </div>

      {detail && (
        <DetailModal
          key={`${detail.item.id}-${libraryKey}`}
          item={detail.item}
          type={detail.type}
          onClose={() => { setDetail(null); setLibraryKey(k => k + 1); }}
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
