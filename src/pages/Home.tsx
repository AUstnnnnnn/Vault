import { useEffect, useState } from 'react';
import { Hero } from '../components/Hero';
import { Row } from '../components/Row';
import { Player } from '../components/Player';
import {
  getTrending,
  getPopularMovies,
  getTopRatedTV,
  getNowPlaying,
} from '../api/tmdb';
import type { MediaItem } from '../api/tmdb';

interface HomeProps {
  onHover: (src: string | null) => void;
}

export function Home({ onHover }: HomeProps) {
  const [trending, setTrending] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topTV, setTopTV] = useState<MediaItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>([]);
  const [playing, setPlaying] = useState<{ item: MediaItem; type: 'movie' | 'tv' } | null>(null);

  useEffect(() => {
    getTrending().then(d => setTrending(d.results ?? []));
    getPopularMovies().then(d => setPopularMovies(d.results ?? []));
    getTopRatedTV().then(d => setTopTV(d.results ?? []));
    getNowPlaying().then(d => setNowPlaying(d.results ?? []));
  }, []);

  function openPlayer(item: MediaItem, type: 'movie' | 'tv') {
    setPlaying({ item, type });
  }

  const hero = trending.find(i => i.backdrop_path) ?? null;

  return (
    <div className="page-content">
      <Hero
        item={hero}
        onPlay={item => openPlayer(item, item.media_type === 'tv' ? 'tv' : 'movie')}
      />

      <div className="rows-section">
        <Row
          title="Trending This Week"
          items={trending.filter(i => i.media_type !== 'person')}
          onPlay={openPlayer}
          onHover={onHover}
        />
        <Row
          title="Now Playing"
          items={nowPlaying}
          type="movie"
          onPlay={openPlayer}
          onHover={onHover}
        />
        <Row
          title="Popular Movies"
          items={popularMovies}
          type="movie"
          onPlay={openPlayer}
          onHover={onHover}
        />
        <Row
          title="Top Rated TV"
          items={topTV}
          type="tv"
          onPlay={openPlayer}
          onHover={onHover}
        />
      </div>

      {playing && (
        <Player
          item={playing.item}
          type={playing.type}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}
