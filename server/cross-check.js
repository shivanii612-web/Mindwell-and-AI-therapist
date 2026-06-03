import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function crossCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const moods = await mongoose.connection.db.collection('moods').find({}).toArray();
        const users = await mongoose.connection.db.collection('users').find({}).toArray();

        console.log('--- Users ---');
        users.forEach(u => console.log(`ID: ${u._id}, Email: ${u.email}`));

        console.log('\n--- Moods ---');
        moods.forEach(m => {
            const user = users.find(u => u._id.toString() === m.user_id.toString());
            console.log(`Mood: ${m.mood}, Date: ${m.logged_at}, UserID: ${m.user_id}, UserEmail: ${user ? user.email : 'UNKNOWN'}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
crossCheck();
