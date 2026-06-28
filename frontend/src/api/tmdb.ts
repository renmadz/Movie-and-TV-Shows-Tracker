const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

// Set via import.meta.env — add VITE_TMDB_TOKEN to frontend/.env.local
const TOKEN = import.meta.env.VITE_TMDB_TOKEN as string | undefined;

function authHeaders(): HeadersInit {
  if (!TOKEN) return {};
  return { Authorization: `Bearer ${TOKEN}` };
}

export interface TmdbResult {
  id: number;
  title: string; // movies
  name: string;  // tv shows
  poster_path: string | null;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  number_of_seasons?: number; // present on full TV detail, not search
}

export interface TmdbGenre {
  id: number;
  name: string;
}

// Search for a movie or TV show by title
export async function searchTmdb(
  query: string,
  type: 'movie' | 'tv'
): Promise<TmdbResult[]> {
  if (!TOKEN || !query.trim()) return [];
  const params = new URLSearchParams({ query, include_adult: 'false', language: 'en-US', page: '1' });
  const res = await fetch(`${TMDB_BASE}/search/${type}?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

// Fetch total number of seasons for a TV show by TMDB id
export async function getTvSeasonCount(tmdbId: number): Promise<number | null> {
  if (!TOKEN) return null;
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?language=en-US`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return typeof data.number_of_seasons === 'number' ? data.number_of_seasons : null;
}

// Fetch genre list (call once and cache)
let movieGenreCache: Record<number, string> | null = null;
let tvGenreCache: Record<number, string> | null = null;

export async function getGenreMap(type: 'movie' | 'tv'): Promise<Record<number, string>> {
  if (type === 'movie' && movieGenreCache) return movieGenreCache;
  if (type === 'tv' && tvGenreCache) return tvGenreCache;

  if (!TOKEN) return {};
  const res = await fetch(`${TMDB_BASE}/genre/${type}/list?language=en`, {
    headers: authHeaders(),
  });
  if (!res.ok) return {};
  const data = await res.json();
  const map: Record<number, string> = {};
  for (const g of data.genres as TmdbGenre[]) {
    map[g.id] = g.name;
  }
  if (type === 'movie') movieGenreCache = map;
  else tvGenreCache = map;
  return map;
}
