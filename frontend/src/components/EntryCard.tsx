import { Trash2, Pencil, RefreshCw, History } from 'lucide-react';
import type { Entry, WatchStatus } from '../types';
import { deleteEntry } from '../api/entries';
import { TMDB_IMAGE_BASE } from '../api/tmdb';
import styles from './EntryCard.module.css';

interface EntryCardProps {
  entry: Entry;
  onDeleted: (id: number) => void;
  onEdit: (entry: Entry) => void;
  onRewatch: (entry: Entry) => void;
  onHistory: (entry: Entry) => void;
}

const STATUS_LABELS: Record<WatchStatus, string> = {
  WATCHED:       'Watched',
  WATCHING:      'Watching',
  PLAN_TO_WATCH: 'Plan to Watch',
  DROPPED:       'Dropped',
};

const STATUS_CLASS: Record<WatchStatus, string> = {
  WATCHED:       'statusWatched',
  WATCHING:      'statusWatching',
  PLAN_TO_WATCH: 'statusPlan',
  DROPPED:       'statusDropped',
};

const BORDER_CLASS: Record<WatchStatus, string> = {
  WATCHED:       'borderWatched',
  WATCHING:      'borderWatching',
  PLAN_TO_WATCH: 'borderPlan',
  DROPPED:       'borderDropped',
};

export default function EntryCard({ entry, onDeleted, onEdit, onRewatch, onHistory }: EntryCardProps) {
  const handleDelete = async () => {
    if (!confirm(`Delete "${entry.title}"?`)) return;
    try {
      await deleteEntry(entry.id);
      onDeleted(entry.id);
    } catch {
      alert('Failed to delete entry.');
    }
  };

  const formattedDate = new Date(entry.watchedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const genres = entry.genre
    ? entry.genre.split(',').map((g) => g.trim()).filter(Boolean)
    : [];

  const rewatchCount = entry.rewatches?.length ?? 0;

  return (
    <article className={`${styles.card} ${styles[BORDER_CLASS[entry.status]]}`}>
      {/* Poster */}
      <div className={styles.posterWrap}>
        {entry.posterPath ? (
          <img
            src={`${TMDB_IMAGE_BASE}${entry.posterPath}`}
            alt={`${entry.title} poster`}
            className={styles.poster}
          />
        ) : (
          <div className={styles.posterFallback}>
            <span className={styles.fallbackLabel}>
              {entry.type === 'MOVIE' ? 'FILM' : 'SERIES'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={`${styles.badge} ${entry.type === 'MOVIE' ? styles.badgeMovie : styles.badgeTv}`}>
            {entry.type === 'MOVIE' ? 'MOVIE' : 'TV'}
          </span>
          <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[entry.status]]}`}>
            {STATUS_LABELS[entry.status]}
          </span>
          {entry.rating !== null && (
            <span className={styles.rating}>{entry.rating.toFixed(1)}</span>
          )}
        </div>

        <h3 className={styles.title}>{entry.title}</h3>

        {/* Season indicator for TV shows */}
        {entry.type === 'TV_SHOW' && entry.seasonNumber != null && (
          <span className={styles.season}>
            Season {entry.seasonNumber}
            {entry.totalSeasons != null && (
              <span className={styles.seasonTotal}> / {entry.totalSeasons}</span>
            )}
          </span>
        )}

        {genres.length > 0 && (
          <div className={styles.genres}>
            {genres.slice(0, 3).map((g) => (
              <span key={g} className={styles.genre}>{g}</span>
            ))}
          </div>
        )}

        <div className={styles.bottomRow}>
          <span className={styles.date}>{formattedDate}</span>
          {rewatchCount > 0 && (
            <button
              className={styles.rewatchCount}
              onClick={() => onHistory(entry)}
              title="View history"
            >
              <RefreshCw size={10} strokeWidth={2} />
              {rewatchCount}x
            </button>
          )}
        </div>

        {entry.notes && <p className={styles.notes}>{entry.notes}</p>}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={() => onHistory(entry)}
          aria-label={`History for ${entry.title}`}
          title="History"
        >
          <History size={16} strokeWidth={1.5} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => onRewatch(entry)}
          aria-label={`Log rewatch of ${entry.title}`}
          title="Log rewatch"
        >
          <RefreshCw size={16} strokeWidth={1.5} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => onEdit(entry)}
          aria-label={`Edit ${entry.title}`}
          title="Edit"
        >
          <Pencil size={16} strokeWidth={1.5} />
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={handleDelete}
          aria-label={`Delete ${entry.title}`}
          title="Delete"
        >
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
