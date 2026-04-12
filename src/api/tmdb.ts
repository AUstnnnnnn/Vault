const API_KEY = import.meta.env.VITE_TMDB_KEY as string;
const BASE = 'https://api.themoviedb.org/3';
export const IMG = (path: string, size = 'w500') =>
  `https://image.tmdb.org/t/p/${size}${path}`;

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  media_type?: 'movie' | 'tv' | 'person';
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  number_of_seasons?: number;
}

export interface Season {
  season_number: number;
  episode_count: number;
  name: string;
}

async function get(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export const getTrending = () => get('/trending/all/week');

export const getEssentialViewing = () =>
  get('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '1000',
    'vote_average.gte': '8',
    with_genres: '18',
  });

const intlLanguages = ['ja', 'ko', 'fr', 'it', 'es', 'de', 'pt', 'zh', 'sv', 'da'];
export const getWorldCinema = () => {
  const lang = intlLanguages[Math.floor(Math.random() * intlLanguages.length)];
  return get('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '200',
    'vote_average.gte': '7.5',
    with_original_language: lang,
  });
};

export const getDeepCuts = () =>
  get('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    'vote_count.lte': '800',
    'vote_average.gte': '7.5',
    'primary_release_date.lte': '1990-12-31',
  });

export const getNewArrivals = () =>
  get('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '50',
    'vote_average.gte': '6.5',
    'primary_release_date.gte': new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
  });

export const getSlowBurn = () =>
  get('/discover/tv', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '500',
    'vote_average.gte': '8',
  });

export const get2000sTV = () =>
  get('/discover/tv', {
    sort_by: 'popularity.desc',
    'vote_count.gte': '200',
    'vote_average.gte': '7',
    'first_air_date.gte': '2000-01-01',
    'first_air_date.lte': '2009-12-31',
  });

export const getClassicCartoons = () =>
  get('/discover/tv', {
    sort_by: 'popularity.desc',
    'vote_count.gte': '50',
    with_genres: '16',
    with_networks: '56',
    'first_air_date.gte': '1992-01-01',
    'first_air_date.lte': '2010-12-31',
  });

export const getTVDetails = (id: number) => get(`/tv/${id}`);

export const search = (query: string) =>
  get('/search/multi', { query, include_adult: 'false' });

export function mediaTitle(item: MediaItem) {
  return item.title ?? item.name ?? 'Untitled';
}

export function mediaYear(item: MediaItem) {
  const date = item.release_date ?? item.first_air_date ?? '';
  return date.slice(0, 4);
}
