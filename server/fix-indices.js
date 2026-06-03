import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('server', '.env') });

async function fixIndices() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const collection = mongoose.connection.db.collection('moods');
        const indices = await collection.indexes();

        console.log('Current indices for "moods":', JSON.stringify(indices, null, 2));

        for (const index of indices) {
            // Check if there's a unique index on user_id or a combination that shouldn't be unique
            if (index.unique && index.name !== '_id_') {
                console.log(`Found unique index: ${index.name}. Dropping it to prevent overwrite issues...`);
                await collection.dropIndex(index.name);
                console.log(`Dropped index: ${index.name}`);
            }
        }

        // Ensure our desired index exists as non-unique
        console.log('Ensuring non-unique index { user_id: 1, logged_at: -1 } exists...');
        await collection.createIndex({ user_id: 1, logged_at: -1 }, { unique: false });
        console.log('Index ensured.');

        const finalIndices = await collection.indexes();
        console.log('Final indices for "moods":', JSON.stringify(finalIndices, null, 2));

        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error('Error during index fix:', err);
        process.exit(1);
    }
}

fixIndices();
