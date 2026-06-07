import Journal from '../models/Journal.js';

export const createJournal = async (req, res) => {
    try {
        const journal = new Journal({
            ...req.body,
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
        const query = {
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };

        const journals = await Journal.find(query)
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));

        res.json(journals);
    } catch (error) {
        console.error('Get Journals Error:', error);
        res.status(500).json({ error: 'Failed to fetch journal entries.' });
    }
};

export const getJournal = async (req, res) => {
    try {
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
        const query = {
            _id: req.params.id,
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };
        const journal = await Journal.findOneAndUpdate(
            query,
            req.body,
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
