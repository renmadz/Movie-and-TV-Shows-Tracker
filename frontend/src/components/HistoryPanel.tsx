import { useState, useEffect } from 'react';
import { X, Trash2, History } from 'lucide-react';
import type { Entry, Rewatch } from '../types';
import { fetchRewatches, deleteRewatch } from '../api/entries';
import { TMDB_IMAGE_BASE } from '../api/tmdb';
import styles from './HistoryPanel.module.css';

interface Props {
  entry: Entry;
  onClose: () => void;
  onRewatchDeleted: () => void;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function HistoryPanel({ entry, onClose, onRewatchDeleted }: Props) {
  const [rewatches, setRewatches] = useState<Rewatch[]>(entry.rewatches ?? []);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRewatches(entry.id)
      .then(setRewatches)
      .finally(() => setLoading(false));
  }, [entry.id]);

  const handleDeleteRewatch = async (rw: Rewatch) => {
    if (!confirm('Remove this rewatch entry?')) return;
    await deleteRewatch(entry.id, rw.id);
    setRewatches((p) => p.filter((r) => r.id !== rw.id));
    onRewatchDeleted();
  };

  const totalWatches = 1 + rewatches.length;
  const allRatings   = [
    ...(entry.rating != null ? [{ date: entry.watchedAt, rating: entry.rating, label: 'First watch' }] : []),
    ...rewatches
      .filter((r) => r.rating != null)
      .map((r) => ({ date: r.watchedAt, rating: r.rating!, label: 'Rewatch' })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div
      className={styles.overlay}
      role="dialog" aria-modal="true" aria-labelledby="history-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTag}>// WATCH HISTORY</span>
            <h2 id="history-title" className={styles.headerTitle}>
              <History size={14} strokeWidth={1.5} className={styles.headerIcon} />
              History
            </h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Entry info */}
        <div className={styles.entryInfo}>
          {entry.posterPath && (
            <img src={`${TMDB_IMAGE_BASE}${entry.posterPath}`} alt="" className={styles.poster} />
          )}
          <div className={styles.entryMeta}>
            <h3 className={styles.entryTitle}>{entry.title}</h3>
            {entry.type === 'TV_SHOW' && entry.seasonNumber != null && (
              <span className={styles.entrySeason}>Season {entry.seasonNumber}</span>
            )}
            <div className={styles.statsRow}>
              <div className={styles.statChip}>
                <span className={styles.statVal}>{totalWatches}</span>
                <span className={styles.statKey}>TOTAL WATCHES</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statVal}>{fmt(entry.watchedAt)}</span>
                <span className={styles.statKey}>FIRST LOGGED</span>
              </div>
              {rewatches.length > 0 && (
                <div className={styles.statChip}>
                  <span className={styles.statVal}>{fmt(rewatches[0].watchedAt)}</span>
                  <span className={styles.statKey}>LAST REWATCH</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rating history */}
        {allRatings.length > 1 && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>// RATING HISTORY</p>
            <div className={styles.ratingTimeline}>
              {allRatings.map((r, i) => (
                <div key={i} className={styles.ratingRow}>
                  <span className={styles.ratingDate}>{fmt(r.date)}</span>
                  <div className={styles.ratingBarTrack}>
                    <div
                      className={styles.ratingBarFill}
                      style={{ width: `${(r.rating / 10) * 100}%` }}
                    />
                  </div>
                  <span className={styles.ratingVal}>{r.rating.toFixed(1)}</span>
                  <span className={styles.ratingLabel}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewatch log */}
        <div className={styles.section}>
          <p className={styles.sectionLabel}>// REWATCH LOG</p>
          {loading && <p className={styles.dimText}>Loading...</p>}
          {!loading && rewatches.length === 0 && (
            <p className={styles.dimText}>No rewatches logged yet.</p>
          )}
          {!loading && rewatches.length > 0 && (
            <ul className={styles.rewatchList}>
              {rewatches.map((rw, i) => (
                <li key={rw.id} className={styles.rewatchItem}>
                  <div className={styles.rewatchLeft}>
                    <span className={styles.rewatchIndex}>#{i + 1}</span>
                    <div className={styles.rewatchDetails}>
                      <span className={styles.rewatchDate}>{fmt(rw.watchedAt)}</span>
                      {rw.rating != null && (
                        <span className={styles.rewatchRating}>{rw.rating.toFixed(1)}</span>
                      )}
                    </div>
                    {rw.notes && <p className={styles.rewatchNotes}>{rw.notes}</p>}
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteRewatch(rw)}
                    aria-label="Delete rewatch"
                    title="Delete"
                  >
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
