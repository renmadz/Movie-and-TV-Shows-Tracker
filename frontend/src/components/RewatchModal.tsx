import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { Entry, RewatchFormData } from '../types';
import { TMDB_IMAGE_BASE } from '../api/tmdb';
import styles from './RewatchModal.module.css';

interface Props {
  entry: Entry;
  onClose: () => void;
  onSubmit: (data: RewatchFormData) => Promise<void>;
}

export default function RewatchModal({ entry, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<RewatchFormData>({
    watchedAt: new Date().toISOString().split('T')[0],
    rating: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating && (parseFloat(form.rating) < 0 || parseFloat(form.rating) > 10)) {
      setError('Rating must be between 0 and 10.'); return;
    }
    setLoading(true); setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog" aria-modal="true" aria-labelledby="rewatch-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTag}>// LOG REWATCH</span>
            <h2 id="rewatch-title" className={styles.headerTitle}>
              <RefreshCw size={14} strokeWidth={1.5} className={styles.rewatchIcon} />
              Rewatch
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Entry reference */}
        <div className={styles.entryRef}>
          {entry.posterPath && (
            <img
              src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
              alt="" className={styles.refPoster}
            />
          )}
          <div className={styles.refInfo}>
            <span className={styles.refTitle}>{entry.title}</span>
            {entry.type === 'TV_SHOW' && entry.seasonNumber != null && (
              <span className={styles.refSeason}>Season {entry.seasonNumber}</span>
            )}
            <span className={styles.refCount}>
              {entry.rewatches.length} previous rewatch{entry.rewatches.length !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="rw-date" className={styles.label}>DATE REWATCHED</label>
              <input
                id="rw-date" name="watchedAt" type="date"
                value={form.watchedAt} onChange={handleChange}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="rw-rating" className={styles.label}>RATING (0–10)</label>
              <input
                id="rw-rating" name="rating" type="number"
                min="0" max="10" step="0.1"
                value={form.rating} onChange={handleChange}
                placeholder="e.g. 7" className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="rw-notes" className={styles.label}>NOTES</label>
            <textarea
              id="rw-notes" name="notes" rows={3}
              value={form.notes} onChange={handleChange}
              placeholder="Thoughts on this rewatch..."
              className={`${styles.input} ${styles.textarea}`}
            />
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>CANCEL</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'LOGGING...' : 'LOG REWATCH'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
