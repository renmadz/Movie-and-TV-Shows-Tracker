import { Request, Response } from 'express';
import prisma from '../prismaClient';

type SortKey = 'rating_desc' | 'rating_asc' | 'watched_desc' | 'watched_asc';

function getOrderBy(sort: unknown): object {
  switch (sort as SortKey) {
    case 'rating_desc':  return { rating: 'desc' };
    case 'rating_asc':   return { rating: 'asc' };
    case 'watched_asc':  return { watchedAt: 'asc' };
    default:             return { watchedAt: 'desc' };
  }
}

function parseOptionalInt(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = parseInt(String(val));
  return isNaN(n) ? null : n;
}

function parseOptionalFloat(val: unknown): number | null {
  if (val == null || val === '') return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

// GET /api/entries?type=MOVIE|TV_SHOW&status=...&sort=...
export const getAllEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, sort } = req.query;

    const where: Record<string, unknown> = {};
    if (type === 'MOVIE' || type === 'TV_SHOW') where.type = type;
    if (['WATCHING', 'WATCHED', 'PLAN_TO_WATCH', 'DROPPED'].includes(String(status))) {
      where.status = status;
    }

    const entries = await prisma.entry.findMany({
      where,
      orderBy: getOrderBy(sort),
      include: { rewatches: { orderBy: { watchedAt: 'desc' } } },
    });
    res.json(entries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};

// POST /api/entries
export const createEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, status, rating, genre, notes, watchedAt, posterPath, seasonNumber, totalSeasons } = req.body;

    if (!title || !type) {
      res.status(400).json({ error: 'Title and type are required' });
      return;
    }

    // Duplicate check — same title + type (case-insensitive), same season if TV
    const duplicate = await prisma.entry.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        type,
        ...(seasonNumber != null && seasonNumber !== ''
          ? { seasonNumber: parseOptionalInt(seasonNumber) }
          : {}),
      },
    });

    if (duplicate) {
      res.status(409).json({
        error: 'DUPLICATE',
        message: 'An entry with this title already exists.',
        existingId: duplicate.id,
      });
      return;
    }

    const entry = await prisma.entry.create({
      data: {
        title,
        type,
        status: status || 'WATCHED',
        rating: parseOptionalFloat(rating),
        genre: genre || null,
        notes: notes || null,
        posterPath: posterPath || null,
        seasonNumber: parseOptionalInt(seasonNumber),
        totalSeasons: parseOptionalInt(totalSeasons),
        watchedAt: watchedAt ? new Date(watchedAt) : new Date(),
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
};

// POST /api/entries/bulk — create multiple entries at once (for remaining seasons)
export const createEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { entries } = req.body as { entries: Array<Record<string, unknown>> };
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: 'entries array is required' });
      return;
    }

    const created = await prisma.$transaction(
      entries.map((e) =>
        prisma.entry.create({
          data: {
            title: String(e.title),
            type: e.type as 'MOVIE' | 'TV_SHOW',
            status: (e.status as 'WATCHING' | 'WATCHED' | 'PLAN_TO_WATCH' | 'DROPPED') || 'PLAN_TO_WATCH',
            rating: parseOptionalFloat(e.rating),
            genre: (e.genre as string) || null,
            notes: (e.notes as string) || null,
            posterPath: (e.posterPath as string) || null,
            seasonNumber: parseOptionalInt(e.seasonNumber),
            totalSeasons: parseOptionalInt(e.totalSeasons),
            watchedAt: e.watchedAt ? new Date(e.watchedAt as string) : new Date(),
          },
        })
      )
    );

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entries' });
  }
};

// PUT /api/entries/:id
export const updateEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { title, type, status, rating, genre, notes, watchedAt, posterPath, seasonNumber, totalSeasons } = req.body;

    const entry = await prisma.entry.update({
      where: { id },
      data: {
        title,
        type,
        status,
        rating: parseOptionalFloat(rating),
        genre: genre || null,
        notes: notes || null,
        posterPath: posterPath || null,
        seasonNumber: parseOptionalInt(seasonNumber),
        totalSeasons: parseOptionalInt(totalSeasons),
        watchedAt: watchedAt ? new Date(watchedAt) : undefined,
      },
    });

    res.json(entry);
  } catch {
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

// DELETE /api/entries/:id
export const deleteEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await prisma.entry.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
};
