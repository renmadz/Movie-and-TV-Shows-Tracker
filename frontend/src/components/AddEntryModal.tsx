import { useState, useEffect, useRef } from 'react';
import { X, Film, Tv, RefreshCw } from 'lucide-react';
import type { EntryFormData, EntryType, WatchStatus } from '../types';
import { searchTmdb, getGenreMap, getTvSeasonCount, TMDB_IMAGE_BASE, type TmdbResult } from '../api/tmdb';
import { DuplicateError } from '../api/entries';
import styles from './AddEntryModal.module.css';

interface Props {
  onClose: () => void;
  onSubmit: (data: EntryFormData) => Promise<void>;
  onSubmitBulk?: (entries: EntryFormData[]) => Promise<void>;
  onRewatchExisting?: (existingId: number) => void;
  initialData?: EntryFormData;
  mode?: 'add' | 'edit';
}

const defaultForm: EntryFormData = {
  title: '',
  type: 'MOVIE',
  status: 'WATCHED',
  rating: '',
  genre: '',
  notes: '',
  watchedAt: new Date().toISOString().split('T')[0],
  posterPath: '',
  seasonNumber: '',
  totalSeasons: '',
};

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'WATCHED',       label: 'Watched' },
  { value: 'WATCHING',      label: 'Watching' },
  { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
  { value: 'DROPPED',       label: 'Dropped' },
];

export default function AddEntryModal({ onClose, onSubmit, onSubmitBulk, onRewatchExisting, initialData, mode = 'add' }: Props) {
  const [form, setForm]               = useState<EntryFormData>(initialData ?? defaultForm);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [duplicateId, setDuplicateId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<TmdbResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showSugg, setShowSugg]       = useState(false);
  const [addRemaining, setAddRemaining] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressSearch = useRef(false);

  // Debounced search
  useEffect(() => {
    if (timeout.current) clearTimeout(timeout.current);
    // Don't re-search immediately after user picks a suggestion
    if (suppressSearch.current) {
      suppressSearch.current = false;
      return;
    }
    if (!form.title.trim() || form.title.length < 2) {
      setSuggestions([]); setShowSugg(false); return;
    }
    setSearching(true);
    timeout.current = setTimeout(async () => {
      const results = await searchTmdb(form.title, form.type === 'MOVIE' ? 'movie' : 'tv');
      setSuggestions(results.slice(0, 5));
      setShowSugg(results.length > 0);
      setSearching(false);
    }, 400);
  }, [form.title, form.type]);

  // Reset season fields when switching type
  const handleTypeSwitch = (t: EntryType) => {
    setForm((p) => ({ ...p, type: t, posterPath: '', genre: '', seasonNumber: '', totalSeasons: '' }));
    setTmdbId(null);
    setAddRemaining(false);
  };

  const handleSelect = async (r: TmdbResult) => {
    const isTv = form.type === 'TV_SHOW';
    const genreMap = await getGenreMap(isTv ? 'tv' : 'movie');
    const genres = r.genre_ids.map((id) => genreMap[id]).filter(Boolean).join(', ');

    let totalSeasons = '';
    if (isTv) {
      const count = await getTvSeasonCount(r.id);
      if (count != null) totalSeasons = String(count);
    }

    // Suppress the search useEffect that would fire when title changes
    suppressSearch.current = true;
    setSuggestions([]);
    setShowSugg(false);

    setForm((p) => ({
      ...p,
      title: r.title || r.name,
      genre: genres,
      posterPath: r.poster_path ?? '',
      totalSeasons,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  // Derived values for season logic
  const isTv          = form.type === 'TV_SHOW';
  const seasonNum     = parseInt(form.seasonNumber);
  const totalSeasonsN = parseInt(form.totalSeasons);
  const hasRemaining  = isTv && !isNaN(seasonNum) && !isNaN(totalSeasonsN) && seasonNum < totalSeasonsN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (form.rating && (parseFloat(form.rating) < 0 || parseFloat(form.rating) > 10)) {
      setError('Rating must be between 0 and 10.'); return;
    }
    if (isTv && form.seasonNumber !== '' && (isNaN(seasonNum) || seasonNum < 1)) {
      setError('Season number must be a positive number.'); return;
    }

    setLoading(true); setError(''); setDuplicateId(null);
    try {
      await onSubmit(form);

      // If checkbox is ticked, bulk-create Plan to Watch entries for remaining seasons
      if (addRemaining && hasRemaining && onSubmitBulk) {
        const remaining: EntryFormData[] = [];
        for (let s = seasonNum + 1; s <= totalSeasonsN; s++) {
          remaining.push({
            ...form,
            status: 'PLAN_TO_WATCH',
            seasonNumber: String(s),
            rating: '',
            notes: '',
          });
        }
        await onSubmitBulk(remaining);
      }

      onClose();
    } catch (err) {
      if (err instanceof DuplicateError) {
        setDuplicateId(err.existingId);
        setError('This title is already in your list.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTag}>{mode === 'edit' ? '// EDIT ENTRY' : '// NEW ENTRY'}</span>
            <h2 id="modal-title" className={styles.headerTitle}>{mode === 'edit' ? 'Edit Entry' : 'Log Entry'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Type */}
          <div className={styles.field}>
            <label className={styles.label}>TYPE</label>
            <div className={styles.typeToggle}>
              {(['MOVIE', 'TV_SHOW'] as EntryType[]).map((t) => (
                <button key={t} type="button"
                  className={`${styles.typeBtn} ${form.type === t ? styles.typeBtnActive : ''}`}
                  onClick={() => handleTypeSwitch(t)}
                >
                  {t === 'MOVIE'
                    ? <><Film size={13} strokeWidth={1.5} /> Movie</>
                    : <><Tv  size={13} strokeWidth={1.5} /> TV Show</>
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>TITLE *</label>
            <div className={styles.acWrapper}>
              <input
                id="title" name="title" type="text"
                value={form.title} onChange={handleChange}
                placeholder={form.type === 'MOVIE' ? 'e.g. Iron Man 3' : 'e.g. The Office'}
                autoComplete="off" autoFocus
                className={styles.input}
              />
              {searching && <span className={styles.searchHint}>SEARCHING...</span>}
              {showSugg && (
                <ul className={styles.suggestions} role="listbox">
                  {suggestions.map((r) => (
                    <li key={r.id} role="option" aria-selected="false"
                      className={styles.suggestion}
                      onMouseDown={() => handleSelect(r)}
                    >
                      {r.poster_path
                        ? <img src={`${TMDB_IMAGE_BASE}${r.poster_path}`} alt="" className={styles.suggPoster} />
                        : <div className={styles.suggPosterFallback} />
                      }
                      <span className={styles.suggInfo}>
                        <span className={styles.suggTitle}>{r.title || r.name}</span>
                        <span className={styles.suggYear}>{(r.release_date || r.first_air_date || '').slice(0, 4)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Poster preview */}
          {form.posterPath && (
            <div className={styles.posterPreview}>
              <img src={`${TMDB_IMAGE_BASE}${form.posterPath}`} alt="Poster preview" className={styles.posterThumb} />
              <div className={styles.posterInfo}>
                <span className={styles.posterLabel}>POSTER LOADED</span>
                <button type="button" className={styles.removePoster}
                  onClick={() => setForm((p) => ({ ...p, posterPath: '' }))}>
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className={styles.field}>
            <label htmlFor="status" className={styles.label}>STATUS</label>
            <select id="status" name="status" value={form.status}
              onChange={handleChange} className={styles.input}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Season fields — TV only */}
          {isTv && (
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="seasonNumber" className={styles.label}>UP TO SEASON</label>
                <input
                  id="seasonNumber" name="seasonNumber" type="number"
                  min="1" max={form.totalSeasons || undefined} step="1"
                  value={form.seasonNumber} onChange={handleChange}
                  placeholder="e.g. 3"
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="totalSeasons" className={styles.label}>TOTAL SEASONS</label>
                <input
                  id="totalSeasons" name="totalSeasons" type="number"
                  min="1" step="1"
                  value={form.totalSeasons} onChange={handleChange}
                  placeholder="Auto-filled"
                  className={styles.input}
                />
              </div>
            </div>
          )}

          {/* Add remaining seasons checkbox */}
          {hasRemaining && mode === 'add' && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={addRemaining}
                onChange={(e) => setAddRemaining(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                Add seasons {seasonNum + 1}–{totalSeasonsN} as{' '}
                <span className={styles.checkboxAccent}>Plan to Watch</span>
              </span>
            </label>
          )}

          {/* Rating + Date */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="rating" className={styles.label}>RATING (0–10)</label>
              <input id="rating" name="rating" type="number"
                min="0" max="10" step="0.1"
                value={form.rating} onChange={handleChange}
                placeholder="e.g. 7" className={styles.input} />
            </div>
            <div className={styles.field}>
              <label htmlFor="watchedAt" className={styles.label}>DATE</label>
              <input id="watchedAt" name="watchedAt" type="date"
                value={form.watchedAt} onChange={handleChange} className={styles.input} />
            </div>
          </div>

          {/* Genre */}
          <div className={styles.field}>
            <label htmlFor="genre" className={styles.label}>GENRE</label>
            <input id="genre" name="genre" type="text"
              value={form.genre} onChange={handleChange}
              placeholder="Auto-filled from TMDB, or enter manually"
              className={styles.input} />
          </div>

          {/* Notes */}
          <div className={styles.field}>
            <label htmlFor="notes" className={styles.label}>NOTES</label>
            <textarea id="notes" name="notes" rows={3}
              value={form.notes} onChange={handleChange}
              placeholder="Optional thoughts..."
              className={`${styles.input} ${styles.textarea}`} />
          </div>

          {error && (
            <div className={styles.errorBlock} role="alert">
              <p className={styles.error}>{error}</p>
              {duplicateId != null && onRewatchExisting && (
                <button
                  type="button"
                  className={styles.rewatchPromptBtn}
                  onClick={() => { onRewatchExisting(duplicateId); onClose(); }}
                >
                  <RefreshCw size={13} strokeWidth={1.5} />
                  Log as a rewatch instead
                </button>
              )}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>CANCEL</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? (mode === 'edit' ? 'SAVING...' : 'LOGGING...')
                : (mode === 'edit' ? 'SAVE CHANGES' : 'CONFIRM LOG')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
