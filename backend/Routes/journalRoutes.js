import express from 'express';
import { createJournal, getJournals, getJournal, updateJournal, deleteJournal } from '../Controller/journalController.js';
import { auth } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(auth); // Protect all journal routes

router.post('/', createJournal);
router.get('/', getJournals);
router.get('/:id', getJournal);
router.put('/:id', updateJournal);
router.delete('/:id', deleteJournal);

export default router;
