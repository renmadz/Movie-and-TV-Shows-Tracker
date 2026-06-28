import { Router } from 'express';
import {
  getAllEntries,
  createEntry,
  createEntries,
  updateEntry,
  deleteEntry,
} from '../controllers/entriesController';

const router = Router();

router.get('/',        getAllEntries);
router.post('/',       createEntry);
router.post('/bulk',   createEntries);
router.put('/:id',     updateEntry);
router.delete('/:id',  deleteEntry);

export default router;
