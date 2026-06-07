/**
 * seed-accounts.js
 *
 * Creates admin and therapist seed accounts for testing.
 * Safe to run multiple times — uses upsert logic (findOne → create if missing).
 *
 * Rules:
 *  - NEVER deletes existing users.
 *  - NEVER overwrites a user that already exists.
 *  - Passwords are hashed via the User model's pre-save bcrypt hook.
 *  - Public signup still only creates 'user' role accounts.
 *
 * Usage:
 *   node seed-accounts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const SEED_ACCOUNTS = [
    {
        email: 'admin@mindwell.ai',
        password: 'Admin@123',
        full_name: 'MindWell Admin',
        role: 'admin',
        isVerified: true,
    },
    {
        email: 'therapist@mindwell.ai',
        password: 'Therapist@123',
        full_name: 'Dr. Sarah Smith',
        role: 'therapist',
        isVerified: true,
    },
];

const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/mindwell';

async function seed() {
    console.log('MindWell Seed: Connecting to MongoDB…');
    await mongoose.connect(uri);
    console.log('MindWell Seed: Connected.');

    for (const account of SEED_ACCOUNTS) {
        const existing = await User.findOne({ email: account.email });

        if (existing) {
            console.log(
                `MindWell Seed: Account already exists — skipping: ${account.email} (role: ${existing.role})`
            );
            continue;
        }

        // Creating via new User() triggers the pre-save bcrypt hook — password is hashed automatically.
        const user = new User({
            email: account.email,
            password: account.password, // plain — will be hashed by model hook
            full_name: account.full_name,
            role: account.role,
            isVerified: account.isVerified,
        });

        await user.save();
        console.log(
            `MindWell Seed: Created account — ${account.email} (role: ${account.role}) ✓`
        );
    }

    await mongoose.disconnect();
    console.log('MindWell Seed: Done. Connection closed.');
}

seed().catch((err) => {
    console.error('MindWell Seed Error:', err.message);
    process.exit(1);
});
