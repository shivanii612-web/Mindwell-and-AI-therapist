import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'server/.env' });

const moodSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    mood: String,
    mood_score: Number,
    notes: String,
    triggers: [String],
    logged_at: { type: Date, default: Date.now }
});

const Mood = mongoose.model('Mood', moodSchema);

async function inspectData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const totalCount = await Mood.countDocuments({});
        console.log(`Total mood records in DB: ${totalCount}`);

        const moods = await Mood.find({}).sort({ logged_at: -1 }).limit(10);
        console.log('Last 10 mood records:');
        moods.forEach(m => {
            console.log(`- User: ${m.user_id}, Mood: ${m.mood}, Date: ${m.logged_at}`);
        });

        // Check for May 31 specifically
        const may31 = new Date('2026-05-31T00:00:00Z');
        const june1 = new Date('2026-06-01T00:00:00Z');
        const mayEntries = await Mood.find({
            logged_at: { $gte: may31, $lt: june1 }
        });
        console.log(`Mood records on May 31: ${mayEntries.length}`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

inspectData();
