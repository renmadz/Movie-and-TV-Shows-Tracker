import { Router } from 'express';
import {
  getAllEntries,
  createEntry,
  createEntries,
  updateEntry,
  deleteEntry,
} from '../controllers/entriesController';
import {
  getRewatches,
  addRewatch,
  deleteRewatch,
} from '../controllers/rewatchController';

const router = Router();

router.get('/',               getAllEntries);
router.post('/',              createEntry);
router.post('/bulk',          createEntries);
router.put('/:id',            updateEntry);
router.delete('/:id',         deleteEntry);

// Rewatch sub-resource
router.get('/:id/rewatches',        getRewatches);
router.post('/:id/rewatches',       addRewatch);
router.delete('/:id/rewatches/:rid', deleteRewatch);

export default router;
