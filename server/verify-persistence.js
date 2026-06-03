import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server', '.env') });

const moodSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    mood: String,
    mood_score: Number,
    notes: String,
    triggers: [String],
    logged_at: { type: Date, default: Date.now }
});

const Mood = mongoose.model('Mood', moodSchema);

async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const testUserId = new mongoose.Types.ObjectId(); // Fresh random ID
        console.log(`Using Test User ID: ${testUserId}`);

        // 1. Log first mood
        console.log('Logging first mood...');
        const m1 = new Mood({
            user_id: testUserId,
            mood: 'happy',
            mood_score: 8,
            notes: 'First entry today',
            logged_at: new Date()
        });
        await m1.save();
        console.log('First mood saved.');

        // 2. Log second mood today
        console.log('Logging second mood today (should not overwrite)...');
        const m2 = new Mood({
            user_id: testUserId,
            mood: 'calm',
            mood_score: 9,
            notes: 'Second entry today',
            logged_at: new Date()
        });
        await m2.save();
        console.log('Second mood saved.');

        // 3. Log a mood for "tomorrow"
        console.log('Logging mood for tomorrow...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const m3 = new Mood({
            user_id: testUserId,
            mood: 'peaceful',
            mood_score: 10,
            notes: 'Future entry',
            logged_at: tomorrow
        });
        await m3.save();
        console.log('Future mood saved.');

        // 4. Verify results
        const count = await Mood.countDocuments({ user_id: testUserId });
        console.log(`Total entries found for test user: ${count}`);

        if (count === 3) {
            console.log('SUCCESS: All 3 entries were saved as separate documents.');
        } else {
            console.error(`FAILURE: Expected 3 entries, found ${count}.`);
        }

        const entries = await Mood.find({ user_id: testUserId }).sort({ logged_at: 1 });
        entries.forEach((e, i) => {
            console.log(`Entry ${i + 1}: Mood=${e.mood}, Date=${e.logged_at.toISOString()}, Notes="${e.notes}"`);
        });

        // Cleanup
        await Mood.deleteMany({ user_id: testUserId });
        console.log('Cleaned up test data.');

        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('Verification Error:', err);
        process.exit(1);
    }
}

verify();
