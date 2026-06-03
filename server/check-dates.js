import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const moodSchema = new mongoose.Schema({
    logged_at: { type: Date, default: Date.now }
});
const Mood = mongoose.model('Mood', moodSchema);

async function inspectDates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const moods = await Mood.find({}, 'logged_at').sort({ logged_at: -1 });
        const dates = moods.map(m => m.logged_at.toISOString().split('T')[0]);
        const uniqueDates = [...new Set(dates)];
        console.log('Unique logged dates:', uniqueDates);
        console.log('Total records:', moods.length);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
inspectDates();
