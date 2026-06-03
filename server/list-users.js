import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('Users:');
        users.forEach(u => {
            console.log(`- ID: ${u._id}, Name: ${u.full_name}, Email: ${u.email}`);
        });
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
listUsers();
