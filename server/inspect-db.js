import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

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

        const moods = await Mood.find({}).sort({ logged_at: -1 }).limit(50);
        console.log('Last 50 mood records:');
        moods.forEach(m => {
            console.log(`- User: ${m.user_id}, Mood: ${m.mood}, Date: ${m.logged_at}`);
        });

        // Check for May entries
        const may1 = new Date('2026-05-01T00:00:00Z');
        const june1 = new Date('2026-06-01T00:00:00Z');
        const mayEntries = await Mood.find({
            logged_at: { $gte: may1, $lt: june1 }
        });
        console.log(`Mood records in May: ${mayEntries.length}`);

        if (mayEntries.length > 0) {
            console.log('May Entries:');
            mayEntries.forEach(m => {
                console.log(`- User: ${m.user_id}, Mood: ${m.mood}, Date: ${m.logged_at}`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

inspectData();
