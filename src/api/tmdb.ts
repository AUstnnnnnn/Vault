const API_KEY = '32b413ce8db3c5dd14e1ca22953c5175';
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
export const getPopularMovies = () => get('/movie/popular');
export const getTopRatedTV = () => get('/tv/top_rated');
export const getNowPlaying = () => get('/movie/now_playing');
export const getUpcoming = () => get('/movie/upcoming');

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
