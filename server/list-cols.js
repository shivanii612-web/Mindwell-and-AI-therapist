import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function listCollections() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} docs`);
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
listCollections();
