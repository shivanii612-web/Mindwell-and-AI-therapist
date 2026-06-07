import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * TherapistApplication
 *
 * Stores therapist applications submitted via /therapist-apply.
 * An application is SEPARATE from a User record.
 * Only after admin approval is a proper User account created.
 *
 * Status flow: pending → approved | rejected
 */
const therapistApplicationSchema = new mongoose.Schema(
    {
        full_name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, required: true, trim: true },
        qualification: { type: String, required: true, trim: true },
        specialization: { type: String, required: true, trim: true },
        experience_years: { type: Number, required: true, min: 0 },
        license_number: { type: String, required: true, trim: true },
        bio: { type: String, required: true, trim: true },
        available_timings: { type: String, required: true, trim: true },
        certificate_url: { type: String, default: '' },

        // Password is hashed — used to create the User account on approval
        password_hash: { type: String, required: true },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        // Set when admin approves — points to the created User document
        approved_user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        admin_notes: { type: String, default: '' },
        reviewed_at: { type: Date, default: null },
        reviewed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

therapistApplicationSchema.index({ status: 1, createdAt: -1 });

const TherapistApplication = mongoose.model(
    'TherapistApplication',
    therapistApplicationSchema
);
export default TherapistApplication;
