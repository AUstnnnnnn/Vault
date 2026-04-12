import type { MediaItem } from '../api/tmdb';

interface LibraryEntry {
  item: MediaItem;
  type: 'movie' | 'tv';
  addedAt: number;
}

const WATCHLIST_KEY = 'vault-watchlist';
const SEEN_KEY = 'vault-seen';

function read(key: string): LibraryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write(key: string, entries: LibraryEntry[]) {
  localStorage.setItem(key, JSON.stringify(entries));
}

export function getWatchlist(): LibraryEntry[] {
  return read(WATCHLIST_KEY);
}

export function getSeen(): LibraryEntry[] {
  return read(SEEN_KEY);
}

export function isInWatchlist(id: number): boolean {
  return read(WATCHLIST_KEY).some(e => e.item.id === id);
}

export function isSeen(id: number): boolean {
  return read(SEEN_KEY).some(e => e.item.id === id);
}

export function toggleWatchlist(item: MediaItem, type: 'movie' | 'tv'): boolean {
  const entries = read(WATCHLIST_KEY);
  const idx = entries.findIndex(e => e.item.id === item.id);
  if (idx >= 0) {
    entries.splice(idx, 1);
    write(WATCHLIST_KEY, entries);
    return false;
  }
  entries.unshift({ item, type, addedAt: Date.now() });
  write(WATCHLIST_KEY, entries);
  return true;
}

export function toggleSeen(item: MediaItem, type: 'movie' | 'tv'): boolean {
  const entries = read(SEEN_KEY);
  const idx = entries.findIndex(e => e.item.id === item.id);
  if (idx >= 0) {
    entries.splice(idx, 1);
    write(SEEN_KEY, entries);
    return false;
  }
  entries.unshift({ item, type, addedAt: Date.now() });
  write(SEEN_KEY, entries);
  return true;
}
