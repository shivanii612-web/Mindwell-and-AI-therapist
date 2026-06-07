import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const demoUsers = [
    {
        email: 'admin@mindwell.ai',
        password: 'Admin@123',
        full_name: 'MindWell Admin',
        username: 'admin',
        role: 'admin'
    },
    {
        email: 'therapist@mindwell.ai',
        password: 'Therapist@123',
        full_name: 'Dr. Sarah Smith',
        username: 'therapist_sarah',
        role: 'therapist'
    },
    {
        email: 'user@mindwell.ai',
        password: 'User@123',
        full_name: 'John Doe',
        username: 'johndoe',
        role: 'user'
    }
];

const seedDemoUsers = async () => {
    try {
        console.log('MindWell: Starting demo user seeding...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MindWell: Connected to MongoDB');

        for (const userData of demoUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                console.log(`MindWell: Created ${userData.role} account: ${userData.email}`);
            } else {
                console.log(`MindWell: Account already exists: ${userData.email}`);
            }
        }

        console.log('MindWell: Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('MindWell: Seeding error:', error);
        process.exit(1);
    }
};

seedDemoUsers();
