import type { Entry, EntryFormData, EntryType, WatchStatus, SortOption, Rewatch, RewatchFormData } from '../types';

const BASE_URL = 'http://localhost:3001/api';

export class DuplicateError extends Error {
  existingId: number;
  constructor(message: string, existingId: number) {
    super(message);
    this.name = 'DuplicateError';
    this.existingId = existingId;
  }
}

export async function fetchEntries(
  type?: EntryType | 'ALL',
  status?: WatchStatus | 'ALL',
  sort?: SortOption
): Promise<Entry[]> {
  const params = new URLSearchParams();
  if (type && type !== 'ALL') params.append('type', type);
  if (status && status !== 'ALL') params.append('status', status);
  if (sort) params.append('sort', sort);
  const res = await fetch(`${BASE_URL}/entries?${params}`);
  if (!res.ok) throw new Error('Failed to fetch entries');
  return res.json();
}

export async function createEntry(data: EntryFormData): Promise<Entry> {
  const res = await fetch(`${BASE_URL}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serializeForm(data)),
  });

  if (res.status === 409) {
    const body = await res.json();
    throw new DuplicateError(body.message, body.existingId);
  }

  if (!res.ok) throw new Error('Failed to create entry');
  return res.json();
}

export async function createEntries(entries: Partial<EntryFormData>[]): Promise<Entry[]> {
  const res = await fetch(`${BASE_URL}/entries/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: entries.map(serializeForm) }),
  });
  if (!res.ok) throw new Error('Failed to create entries');
  return res.json();
}

export async function updateEntry(id: number, data: EntryFormData): Promise<Entry> {
  const res = await fetch(`${BASE_URL}/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serializeForm(data)),
  });
  if (!res.ok) throw new Error('Failed to update entry');
  return res.json();
}

export async function deleteEntry(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/entries/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete entry');
}

// ── Rewatch API ──

export async function fetchRewatches(entryId: number): Promise<Rewatch[]> {
  const res = await fetch(`${BASE_URL}/entries/${entryId}/rewatches`);
  if (!res.ok) throw new Error('Failed to fetch rewatches');
  return res.json();
}

export async function addRewatch(entryId: number, data: RewatchFormData): Promise<Rewatch> {
  const res = await fetch(`${BASE_URL}/entries/${entryId}/rewatches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      watchedAt: data.watchedAt,
      rating: data.rating !== '' ? parseFloat(data.rating) : null,
      notes: data.notes || null,
    }),
  });
  if (!res.ok) throw new Error('Failed to add rewatch');
  return res.json();
}

export async function deleteRewatch(entryId: number, rewatchId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/entries/${entryId}/rewatches/${rewatchId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete rewatch');
}

function serializeForm(data: Partial<EntryFormData>) {
  return {
    ...data,
    rating:       data.rating       !== '' ? parseFloat(data.rating ?? '')     : null,
    seasonNumber: data.seasonNumber !== '' ? parseInt(data.seasonNumber ?? '')  : null,
    totalSeasons: data.totalSeasons !== '' ? parseInt(data.totalSeasons ?? '')  : null,
    posterPath:   data.posterPath || null,
  };
}
