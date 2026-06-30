import { Request, Response } from 'express';
import prisma from '../prismaClient';

// GET /api/entries/:id/rewatches
export const getRewatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id);
    const rewatches = await prisma.rewatch.findMany({
      where: { entryId },
      orderBy: { watchedAt: 'desc' },
    });
    res.json(rewatches);
  } catch {
    res.status(500).json({ error: 'Failed to fetch rewatches' });
  }
};

// POST /api/entries/:id/rewatches
export const addRewatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const entryId = parseInt(req.params.id);
    const { watchedAt, rating, notes } = req.body;

    // Verify entry exists
    const entry = await prisma.entry.findUnique({ where: { id: entryId } });
    if (!entry) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const rewatch = await prisma.rewatch.create({
      data: {
        entryId,
        watchedAt: watchedAt ? new Date(watchedAt) : new Date(),
        rating: rating != null && rating !== '' ? parseFloat(rating) : null,
        notes: notes || null,
      },
    });

    res.status(201).json(rewatch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add rewatch' });
  }
};

// DELETE /api/entries/:id/rewatches/:rid
export const deleteRewatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.rid);
    await prisma.rewatch.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete rewatch' });
  }
};
