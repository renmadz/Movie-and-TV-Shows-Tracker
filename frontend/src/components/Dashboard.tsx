import { useEffect, useState, useCallback } from 'react';
import { Film, Tv, PlusCircle, SlidersHorizontal, Clapperboard } from 'lucide-react';
import type { Entry, EntryType, WatchStatus, SortOption, EntryFormData } from '../types';
import { fetchEntries, createEntry, createEntries, updateEntry } from '../api/entries';
import EntryCard from './EntryCard';
import AddEntryModal from './AddEntryModal';
import styles from './Dashboard.module.css';

type TypeFilter = 'ALL' | EntryType;

interface StatusTab {
  value: WatchStatus | 'ALL';
  label: string;
}

const STATUS_TABS: StatusTab[] = [
  { value: 'ALL',           label: 'All' },
  { value: 'WATCHING',      label: 'Watching' },
  { value: 'WATCHED',       label: 'Watched' },
  { value: 'PLAN_TO_WATCH', label: 'Plan to Watch' },
  { value: 'DROPPED',       label: 'Dropped' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'watched_desc', label: 'Recently Watched' },
  { value: 'watched_asc',  label: 'Oldest First' },
  { value: 'rating_desc',  label: 'Rating: High to Low' },
  { value: 'rating_asc',   label: 'Rating: Low to High' },
];

export default function Dashboard() {
  const [entries, setEntries]       = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [statusTab, setStatusTab]   = useState<WatchStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [sort, setSort]             = useState<SortOption>('watched_desc');
  const [showModal, setShowModal]   = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEntries(typeFilter, statusTab, sort);
      setEntries(data);
    } catch {
      setError('Could not connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusTab, sort]);

  const loadAllEntries = useCallback(async () => {
    try {
      const data = await fetchEntries('ALL', 'ALL');
      setAllEntries(data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadEntries(); },    [loadEntries]);
  useEffect(() => { loadAllEntries(); }, [loadAllEntries]);

  const handleAdd = async (data: EntryFormData) => {
    await createEntry(data);
    await loadEntries();
    await loadAllEntries();
  };

  const handleBulkAdd = async (entries: EntryFormData[]) => {
    await createEntries(entries);
    await loadEntries();
    await loadAllEntries();
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
  };

  const handleUpdate = async (data: EntryFormData) => {
    if (!editingEntry) return;
    await updateEntry(editingEntry.id, data);
    setEditingEntry(null);
    await loadEntries();
    await loadAllEntries();
  };

  const handleDeleted = (id: number) => {
    setEntries((p) => p.filter((e) => e.id !== id));
    setAllEntries((p) => p.filter((e) => e.id !== id));
  };

  const movieCount    = allEntries.filter((e) => e.type === 'MOVIE').length;
  const tvCount       = allEntries.filter((e) => e.type === 'TV_SHOW').length;
  const totalCount    = allEntries.length;
  const watchingCount = allEntries.filter((e) => e.status === 'WATCHING').length;
  const watchedCount  = allEntries.filter((e) => e.status === 'WATCHED').length;
  const planCount     = allEntries.filter((e) => e.status === 'PLAN_TO_WATCH').length;
  const droppedCount  = allEntries.filter((e) => e.status === 'DROPPED').length;

  const tabCount = (v: WatchStatus | 'ALL') => {
    if (v === 'ALL')           return undefined;
    if (v === 'WATCHING')      return watchingCount;
    if (v === 'WATCHED')       return watchedCount;
    if (v === 'PLAN_TO_WATCH') return planCount;
    return droppedCount;
  };

  return (
    <div className={styles.page}>

      {/* ── Navbar ── */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <Clapperboard size={18} strokeWidth={1.5} className={styles.brandIcon} />
          <span className={styles.brandName}>AFTER CREDITS</span>
          <span className={styles.brandTag}>// v1.0</span>
        </div>

        <div className={styles.navTabs} role="tablist">
          {STATUS_TABS.map((tab) => {
            const count = tabCount(tab.value);
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={statusTab === tab.value}
                className={`${styles.navTab} ${statusTab === tab.value ? styles.navTabActive : ''}`}
                onClick={() => setStatusTab(tab.value)}
              >
                {tab.label}
                {count !== undefined && (
                  <span className={styles.tabCount}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* List */}
        <section className={styles.listSection}>
          <div className={styles.listControls}>
            <span className={styles.resultLabel}>
              {loading ? 'LOADING...' : `${entries.length} RECORD${entries.length !== 1 ? 'S' : ''} FOUND`}
            </span>
            <div className={styles.sortRow}>
              <SlidersHorizontal size={13} className={styles.sortIcon} />
              <label htmlFor="sort" className={styles.sortLabel}>SORT</label>
              <select
                id="sort"
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.listScroll}>
            {loading && (
              <div className={styles.center}>
                <div className={styles.spinner} />
              </div>
            )}
            {!loading && error && <p className={styles.errorMsg}>{error}</p>}
            {!loading && !error && entries.length === 0 && (
              <div className={styles.empty}>
                <Clapperboard size={40} strokeWidth={1} className={styles.emptyIcon} />
                <p className={styles.emptyText}>No records found.</p>
                <p className={styles.emptyHint}>Log your first entry using the panel on the right.</p>
              </div>
            )}
            {!loading && !error && entries.length > 0 && (
              <ul className={styles.list}>
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <EntryCard entry={entry} onDeleted={handleDeleted} onEdit={handleEdit} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className={styles.sidebar}>

          {/* Type filter */}
          <div className={styles.panel}>
            <p className={styles.panelHeading}>// FILTER</p>
            <div className={styles.typeButtons}>
              <button
                className={`${styles.typeBtn} ${typeFilter === 'ALL' ? styles.typeBtnActive : ''}`}
                onClick={() => setTypeFilter('ALL')}
              >
                All
              </button>
              <button
                className={`${styles.typeBtn} ${typeFilter === 'MOVIE' ? styles.typeBtnActive : ''}`}
                onClick={() => setTypeFilter('MOVIE')}
              >
                <Film size={13} strokeWidth={1.5} /> Movies
              </button>
              <button
                className={`${styles.typeBtn} ${typeFilter === 'TV_SHOW' ? styles.typeBtnActive : ''}`}
                onClick={() => setTypeFilter('TV_SHOW')}
              >
                <Tv size={13} strokeWidth={1.5} /> TV Shows
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.panel}>
            <p className={styles.panelHeading}>// OVERVIEW</p>
            <div className={styles.statGrid}>
              <div className={`${styles.statCell} ${styles.statBlue}`}>
                <span className={styles.statNum}>{movieCount}</span>
                <span className={styles.statLabel}>MOVIES</span>
              </div>
              <div className={`${styles.statCell} ${styles.statGreen}`}>
                <span className={styles.statNum}>{tvCount}</span>
                <span className={styles.statLabel}>TV SHOWS</span>
              </div>
            </div>
            <div className={`${styles.statCell} ${styles.statPurple} ${styles.statFull}`}>
              <span className={styles.statNum}>{totalCount}</span>
              <span className={styles.statLabel}>TOTAL LOGGED</span>
            </div>
          </div>

          {/* Add button */}
          <button
            className={styles.addBtn}
            onClick={() => setShowModal(true)}
            aria-label="Add new entry"
          >
            <PlusCircle size={16} strokeWidth={1.5} />
            LOG ENTRY
          </button>

        </aside>
      </div>

      {showModal && (
        <AddEntryModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
          onSubmitBulk={handleBulkAdd}
        />
      )}

      {editingEntry && (
        <AddEntryModal
          mode="edit"
          initialData={{
            title:        editingEntry.title,
            type:         editingEntry.type,
            status:       editingEntry.status,
            rating:       editingEntry.rating != null ? String(editingEntry.rating) : '',
            genre:        editingEntry.genre ?? '',
            notes:        editingEntry.notes ?? '',
            watchedAt:    editingEntry.watchedAt.split('T')[0],
            posterPath:   editingEntry.posterPath ?? '',
            seasonNumber: editingEntry.seasonNumber != null ? String(editingEntry.seasonNumber) : '',
            totalSeasons: editingEntry.totalSeasons != null ? String(editingEntry.totalSeasons) : '',
          }}
          onClose={() => setEditingEntry(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}
