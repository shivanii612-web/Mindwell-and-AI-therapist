import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import TherapistApplication from '../models/TherapistApplication.js';
import User from '../models/User.js';

/**
 * POST /api/therapist-applications/apply
 * Public — no auth required.
 * Accepts the therapist application form submission.
 * Password is hashed immediately; plain text is never stored.
 */
export const submitApplication = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            qualification,
            specialization,
            experience_years,
            license_number,
            bio,
            available_timings,
            certificate_url,
            password,
        } = req.body;

        // Basic required field check
        const missing = [];
        if (!full_name) missing.push('full_name');
        if (!email) missing.push('email');
        if (!phone) missing.push('phone');
        if (!qualification) missing.push('qualification');
        if (!specialization) missing.push('specialization');
        if (experience_years === undefined || experience_years === null) missing.push('experience_years');
        if (!license_number) missing.push('license_number');
        if (!bio) missing.push('bio');
        if (!available_timings) missing.push('available_timings');
        if (!password) missing.push('password');

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missing.join(', ')}`,
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check for duplicate application
        const existingApplication = await TherapistApplication.findOne({ email: normalizedEmail });
        if (existingApplication) {
            if (existingApplication.status === 'pending') {
                return res.status(409).json({
                    error: 'An application with this email is already under review.',
                });
            }
            if (existingApplication.status === 'rejected') {
                return res.status(409).json({
                    error: 'A previous application with this email was rejected. Please contact support.',
                });
            }
            if (existingApplication.status === 'approved') {
                return res.status(409).json({
                    error: 'This email is already registered as a therapist. Please login.',
                });
            }
        }

        // Also check if a User account with this email already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({
                error: 'An account with this email already exists. Please login instead.',
            });
        }

        // Hash password — never store plain text
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const application = new TherapistApplication({
            full_name: full_name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            qualification: qualification.trim(),
            specialization: specialization.trim(),
            experience_years: parseInt(experience_years),
            license_number: license_number.trim(),
            bio: bio.trim(),
            available_timings: available_timings.trim(),
            certificate_url: certificate_url?.trim() || '',
            password_hash,
        });

        await application.save();

        console.log(`MindWell: ✅ Therapist application SAVED — ID: ${application._id} | email: ${normalizedEmail} | collection: TherapistApplications`);

        res.status(201).json({
            success: true,
            message:
                'Your application has been submitted successfully. We will review it and notify you via email.',
        });
    } catch (error) {
        console.error('MindWell: therapistApplication submitApplication error:', error.message);
        res.status(500).json({ error: 'Failed to submit application. Please try again.' });
    }
};

/**
 * GET /api/therapist-applications
 * Admin only.
 * Returns all applications, sorted newest first.
 */
export const getApplications = async (req, res) => {
    try {
        const { status } = req.query; // optional filter: ?status=pending
        const filter = status ? { status } : {};

        const applications = await TherapistApplication.find(filter)
            .select('-password_hash') // never expose hash to frontend
            .sort({ createdAt: -1 });

        console.log(`MindWell: Admin fetched therapist applications — count: ${applications.length} | filter: ${JSON.stringify(filter)}`);

        res.json(applications);
    } catch (error) {
        console.error('MindWell: getApplications error:', error.message);
        res.status(500).json({ error: 'Failed to fetch applications.' });
    }
};

/**
 * GET /api/therapist-applications/:id
 * Admin only — view a single application's details.
 */
export const getApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid application ID.' });
        }

        const application = await TherapistApplication.findById(id).select('-password_hash');
        if (!application) {
            return res.status(404).json({ error: 'Application not found.' });
        }

        res.json(application);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch application.' });
    }
};

/**
 * POST /api/therapist-applications/:id/approve
 * Admin only.
 *
 * Creates a real User account with role = 'therapist' using the
 * stored password_hash, then marks the application as approved.
 */
export const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid application ID.' });
        }

        const application = await TherapistApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found.' });
        }
        if (application.status !== 'pending') {
            return res.status(400).json({
                error: `Application is already ${application.status}.`,
            });
        }

        // Check if a User with this email already exists (guard against double-approval)
        const existingUser = await User.findOne({ email: application.email });
        if (existingUser) {
            // Already created — just mark approved
            application.status = 'approved';
            application.approved_user_id = existingUser._id;
            application.reviewed_at = new Date();
            application.reviewed_by = req.user._id;
            await application.save();
            return res.json({
                success: true,
                message: 'Application approved. User account already existed.',
            });
        }

        // Create the therapist User account.
        // We bypass the pre-save bcrypt hook by directly setting the already-hashed password.
        // We do this by using Model.collection.insertOne to skip the hook entirely.
        const now = new Date();
        const userDoc = {
            email: application.email,
            password: application.password_hash, // already bcrypt-hashed
            full_name: application.full_name,
            role: 'therapist',
            isVerified: true,
            refreshToken: '',
            createdAt: now,
            updatedAt: now,
        };

        const insertResult = await User.collection.insertOne(userDoc);
        const createdUserId = insertResult.insertedId;

        // Mark application approved
        application.status = 'approved';
        application.approved_user_id = createdUserId;
        application.reviewed_at = now;
        application.reviewed_by = req.user._id;
        await application.save();

        console.log(
            `MindWell: Therapist application approved — created User ${createdUserId} for ${application.email}`
        );

        res.json({
            success: true,
            message: `Therapist account created for ${application.email}. They can now login.`,
        });
    } catch (error) {
        console.error('MindWell: approveApplication error:', error.message);
        res.status(500).json({ error: 'Failed to approve application.' });
    }
};

/**
 * POST /api/therapist-applications/:id/reject
 * Admin only.
 * Marks application as rejected. Optionally stores admin notes.
 */
export const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid application ID.' });
        }

        const application = await TherapistApplication.findById(id);
        if (!application) {
            return res.status(404).json({ error: 'Application not found.' });
        }
        if (application.status !== 'pending') {
            return res.status(400).json({
                error: `Application is already ${application.status}.`,
            });
        }

        application.status = 'rejected';
        application.admin_notes = admin_notes?.trim() || '';
        application.reviewed_at = new Date();
        application.reviewed_by = req.user._id;
        await application.save();

        console.log(`MindWell: Therapist application rejected for ${application.email}`);

        res.json({ success: true, message: 'Application rejected.' });
    } catch (error) {
        console.error('MindWell: rejectApplication error:', error.message);
        res.status(500).json({ error: 'Failed to reject application.' });
    }
};

/**
 * GET /api/therapist-applications/status/:email
 * Public — allows the applicant to check their application status.
 */
export const checkApplicationStatus = async (req, res) => {
    try {
        const email = req.params.email?.toLowerCase().trim();
        const application = await TherapistApplication.findOne({ email }).select(
            'status createdAt reviewed_at admin_notes email full_name'
        );

        if (!application) {
            return res.status(404).json({ error: 'No application found for this email.' });
        }

        res.json({
            status: application.status,
            submittedAt: application.createdAt,
            reviewedAt: application.reviewed_at,
            message:
                application.status === 'pending'
                    ? 'Your application is under review.'
                    : application.status === 'approved'
                        ? 'Your application was approved! You can now login.'
                        : `Your application was rejected. ${application.admin_notes || 'Please contact support.'}`,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check status.' });
    }
};
