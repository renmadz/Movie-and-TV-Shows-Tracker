export type EntryType = 'MOVIE' | 'TV_SHOW';

export type WatchStatus = 'WATCHING' | 'WATCHED' | 'PLAN_TO_WATCH' | 'DROPPED';

export type SortOption =
  | 'watched_desc'
  | 'watched_asc'
  | 'rating_desc'
  | 'rating_asc';

export interface Entry {
  id: number;
  title: string;
  type: EntryType;
  status: WatchStatus;
  rating: number | null;
  genre: string | null;
  notes: string | null;
  posterPath: string | null;
  seasonNumber: number | null;
  totalSeasons: number | null;
  watchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryFormData {
  title: string;
  type: EntryType;
  status: WatchStatus;
  rating: string;
  genre: string;
  notes: string;
  watchedAt: string;
  posterPath: string;
  seasonNumber: string;
  totalSeasons: string;
}
