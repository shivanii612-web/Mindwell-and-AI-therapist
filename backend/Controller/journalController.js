import Journal from '../Models/Journal.js';
import mongoose from 'mongoose';

export const createJournal = async (req, res) => {
    try {
        const { title, content, mood, mood_score, tags, is_private } = req.body;
        const journal = new Journal({
            title,
            content,
            mood,
            mood_score,
            tags,
            is_private,
            userId: req.user._id // Use standard field going forward
        });
        await journal.save();

        res.status(201).json(journal);
    } catch (error) {
        console.error('Create Journal Error:', error);
        res.status(400).json({ error: error.message });
    }
};

export const getJournals = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        // Clamp to safe integers — prevents injection via non-numeric values
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);
        const query = {
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };

        const journals = await Journal.find(query)
            .sort({ created_at: -1 })
            .limit(safeLimit)
            .skip(safeOffset);

        res.json(journals);
    } catch (error) {
        console.error('Get Journals Error:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries.' });
    }
};

export const getJournal = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid journal ID.' });
        }
        const query = {
            _id: req.params.id,
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };
        const journal = await Journal.findOne(query);
        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found.' });
        }
        res.json(journal);
    } catch (error) {
        console.error('Get Journal Error:', error);
        res.status(500).json({ error: 'Failed to fetch journal entry.' });
    }
};

export const updateJournal = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid journal ID.' });
        }
        // Only allow known editable fields — prevents operator injection via req.body
        const { title, content, mood, tags } = req.body;
        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (content !== undefined) updateFields.content = content;
        if (mood !== undefined) updateFields.mood = mood;
        if (tags !== undefined) updateFields.tags = tags;

        const query = {
            _id: req.params.id,
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };
        const journal = await Journal.findOneAndUpdate(
            query,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found.' });
        }

        res.json(journal);
    } catch (error) {
        console.error('Update Journal Error:', error);
        res.status(400).json({ error: error.message });
    }
};

export const deleteJournal = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid journal ID.' });
        }
        const query = {
            _id: req.params.id,
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };
        const journal = await Journal.findOneAndDelete(query);
        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found.' });
        }
        res.json({ message: 'Journal entry deleted successfully.' });
    } catch (error) {
        console.error('Delete Journal Error:', error);
        res.status(500).json({ error: 'Failed to delete journal entry.' });
    }
};
