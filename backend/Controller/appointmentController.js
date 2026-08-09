import Appointment from '../Models/Appointment.js';
import User from '../Models/User.js';
import Journal from '../Models/Journal.js';
import Mood from '../Models/Mood.js';
import CommunityPost from '../Models/CommunityPost.js';
import CommunityComment from '../Models/CommunityComment.js';
import TherapistApplication from '../Models/TherapistApplication.js';
import { queueAppointmentConfirmation, queueAppointmentReminder } from '../services/notificationService.js';
import { getCachedData, setCachedData, deleteCachedData } from '../Utils/redisClient.js';
import logger from '../Utils/logger.js';

const getAppointmentDateTime = (appointment) => {
    try {
        if (!appointment.preferredDate) return new Date();
        const dateStr = typeof appointment.preferredDate === 'string'
            ? appointment.preferredDate.split('T')[0]
            : new Date(appointment.preferredDate).toISOString().split('T')[0];
        
        const timePart = appointment.preferredTime || '09:00 AM';
        let hours = 9;
        let minutes = 0;
        
        const ampmMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (ampmMatch) {
            hours = parseInt(ampmMatch[1], 10);
            minutes = parseInt(ampmMatch[2], 10);
            const ampm = ampmMatch[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
        } else {
            const match = timePart.match(/(\d+):(\d+)/);
            if (match) {
                hours = parseInt(match[1], 10);
                minutes = parseInt(match[2], 10);
            }
        }
        
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, hours, minutes, 0, 0);
    } catch (e) {
        return new Date(appointment.preferredDate || Date.now());
    }
};

const autoUpdateMissedAppointments = async () => {
    try {
        const now = new Date();
        const durationMins = 60; // 60 minutes session duration
        
        // Find all accepted appointments where session has not started/ended
        const appointments = await Appointment.find({
            status: 'Accepted',
            $or: [
                { sessionStatus: 'pending_session' },
                { sessionStatus: { $exists: false } },
                { sessionStatus: null }
            ]
        });
        
        let updatedCount = 0;
        for (const app of appointments) {
            const appStartTime = getAppointmentDateTime(app);
            const appEndTime = new Date(appStartTime.getTime() + durationMins * 60 * 1000);
            
            if (now > appEndTime) {
                app.status = 'Missed';
                app.sessionStatus = 'pending_session';
                await app.save();
                updatedCount++;
                const patientId = app.userId || app.user_id;
                if (patientId) {
                    try {
                        await deleteCachedData(`appointments:user:${patientId.toString()}`);
                    } catch (_) {}
                }
            } else if (!app.sessionStatus) {
                app.sessionStatus = 'pending_session';
                await app.save();
            }
        }
        
        if (updatedCount > 0) {
            logger.info(`MindWell: Auto-marked ${updatedCount} appointments as Missed`);
        }
    } catch (err) {
        logger.error('MindWell: autoUpdateMissedAppointments error: ' + err.message);
    }
};

const formatDateString = (dateInput) => {
    try {
        const d = new Date(dateInput);
        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    } catch {
        return new Date(dateInput).toDateString();
    }
};

// USER: Cancel their own appointment (only allowed status update from user side)
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;
        const role = req.user.role;

        // Users may only cancel their own appointments
        // Admins may set any status
        const allowedUserStatuses = ['Cancelled'];
        const allowedAdminStatuses = ['Cancelled', 'Completed', 'Pending Review', 'Accepted', 'Rejected'];

        const allowed = role === 'admin' ? allowedAdminStatuses : allowedUserStatuses;
        if (!allowed.includes(status)) {
            return res.status(403).json({ message: `Status '${status}' not permitted for your role.` });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Non-admin users can only modify their own appointments
        const isOwner = appointment.userId?.toString() === userId.toString() ||
            appointment.user_id?.toString() === userId.toString();

        if (role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'Access denied' });
        }

        appointment.status = status;
        await appointment.save();

        if (status === 'Cancelled' || status === 'Rejected') {
            // Notifications removed
        }

        // Invalidate cache
        try {
            await deleteCachedData(`appointments:user:${userId}`);
        } catch (_) { /* non-fatal */ }

        res.json(appointment);
    } catch (error) {
        console.error('MindWell: updateAppointmentStatus error:', error);
        res.status(500).json({ message: 'Failed to update appointment status' });
    }
};

// Get a single appointment by ID (for consultation room)
export const getAppointmentById = async (req, res) => {
    try {
        await autoUpdateMissedAppointments();
        const { id } = req.params;
        const appointment = await Appointment.findById(id)
            .populate('userId', 'full_name email')
            .populate('therapistId', 'full_name email');

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only allow the participant themselves (user or therapist) or admin
        const uid = req.user._id.toString();
        const role = req.user.role;
        const isOwner = appointment.userId?._id.toString() === uid ||
            appointment.therapistId?._id?.toString() === uid;

        if (!isOwner && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch appointment' });
    }
};

export const createAppointment = async (req, res) => {
    console.log('MindWell: Appointment Request Body:', req.body);
    try {
        const { sessionType, preferredDate, preferredTime, reason, notes } = req.body;

        if (!preferredDate || !preferredTime) {
            return res.status(400).json({ message: 'Preferred date and time are required.' });
        }

        const appointmentDateTime = new Date(preferredDate);
        if (isNaN(appointmentDateTime.getTime()) || appointmentDateTime <= new Date()) {
            return res.status(400).json({ message: 'Please select a future date and time.' });
        }

        // Always use req.user from JWT — never trust frontend-supplied userId
        const authenticatedUser = req.user;
        const authenticatedUserId = authenticatedUser._id;

        // Do NOT assign therapistId at this stage - set to null
        const newAppointment = new Appointment({
            userId: authenticatedUserId,
            therapistId: null,
            sessionType,
            preferredDate,
            preferredTime,
            reason,
            notes,
            status: 'Pending Review'
        });

        await newAppointment.save();

        // Invalidate appointment cache for this user (non-fatal if Redis is unavailable)
        try {
            await deleteCachedData(`appointments:user:${authenticatedUserId}`);
        } catch (cacheErr) {
            console.warn('MindWell: Cache invalidation skipped (Redis may be unavailable):', cacheErr.message);
        }

        // Queue email confirmation — wrapped so a notification failure does NOT fail the request
        try {
            const emailData = {
                userName: authenticatedUser.full_name || authenticatedUser.email.split('@')[0],
                userEmail: authenticatedUser.email,
                sessionType,
                preferredDate: new Date(preferredDate).toDateString(),
                preferredTime,
                reason,
                notes
            };

            await queueAppointmentConfirmation(emailData);

            const appointmentDate = new Date(preferredDate);
            const reminderTime = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000));
            const now = new Date();
            let delay = reminderTime.getTime() - now.getTime();
            if (delay < 0) delay = 1000 * 60 * 5;

            await queueAppointmentReminder({
                ...emailData,
                isReminder: true,
                appointmentId: newAppointment._id
            }, delay);
        } catch (notifyErr) {
            console.warn('MindWell: Appointment notification queuing failed (non-fatal):', notifyErr.message);
        }

        res.status(201).json(newAppointment);
    } catch (error) {
        console.error('MindWell: Error creating appointment:', error);
        res.status(500).json({ message: error.message || 'Internal server error during appointment creation' });
    }
};

export const getAppointments = async (req, res) => {
    try {
        await autoUpdateMissedAppointments();
        const query = {
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        };

        const appointments = await Appointment.find(query)
            .populate('therapistId', 'full_name email') // so user sees assigned therapist name
            .sort({ createdAt: -1 });
        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// THERAPIST: Get all unassigned pending appointments visible to all therapists
export const getPendingAppointments = async (req, res) => {
    try {
        await autoUpdateMissedAppointments();
        // Only return appointments that are truly unassigned — status Pending Review AND therapistId is null
        // This ensures an already-accepted appointment never appears in another therapist's pending list
        const appointments = await Appointment.find({
            status: 'Pending Review',
            $or: [
                { therapistId: null },
                { therapistId: { $exists: false } }
            ]
        })
            .populate('userId', 'full_name email')
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pending appointments' });
    }
};

// THERAPIST: Get appointments assigned to this therapist
export const getTherapistAppointments = async (req, res) => {
    try {
        await autoUpdateMissedAppointments();
        const therapistId = req.user._id; // use _id consistently
        const appointments = await Appointment.find({ therapistId })
            .populate('userId', 'full_name email')
            .sort({ preferredDate: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch therapist appointments' });
    }
};

// THERAPIST: Accept an appointment — atomic to prevent race conditions
// Two therapists clicking Accept at the same moment:
//   - First request: findOneAndUpdate finds doc where status='Pending Review' AND therapistId=null → updates it
//   - Second request: findOneAndUpdate finds NO matching doc (therapistId is now set) → returns null → 409
export const acceptAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;

        // Atomic: find appointment only if it is still unassigned
        let appointment = await Appointment.findOneAndUpdate(
            {
                _id: id,
                status: 'Pending Review',
                $or: [
                    { therapistId: null },
                    { therapistId: { $exists: false } }
                ]
            },
            {
                $set: {
                    status: 'Accepted',
                    therapistId,
                    acceptedAt: new Date(),
                }
            },
            { new: true }
        ).populate('userId', 'full_name email');

        // If null → check current database state for race condition or duplicate click
        if (!appointment) {
            const appointmentToCheck = await Appointment.findById(id).populate('userId', 'full_name email');
            if (!appointmentToCheck) {
                return res.status(404).json({ message: 'Appointment not found' });
            }

            const assignedTherapistId = appointmentToCheck.therapistId?.toString();
            // Case A: Duplicate acceptance click by the same therapist — treat as success
            if (assignedTherapistId === therapistId.toString() && appointmentToCheck.status === 'Accepted') {
                console.log(`MindWell: acceptAppointment duplicate claim by same therapist=${therapistId}`);
                return res.json({ message: 'Appointment accepted', appointment: appointmentToCheck });
            }

            // Case B: Accepted by another therapist
            if (appointmentToCheck.status === 'Accepted' && assignedTherapistId && assignedTherapistId !== therapistId.toString()) {
                return res.status(409).json({
                    message: 'This session request has already been accepted by another therapist.'
                });
            }

            // Case C: Rejected, Cancelled, Completed, etc.
            return res.status(400).json({
                message: `This session request cannot be accepted because its status is ${appointmentToCheck.status}.`
            });
        }

        // Invalidate user appointment cache (non-fatal)
        try {
            const patientId = appointment.userId?._id || appointment.userId;
            await deleteCachedData(`appointments:user:${patientId}`);
        } catch (_) { /* non-fatal */ }

        const patientId = appointment.userId?._id || appointment.userId || appointment.user_id;
        const therapistName = req.user.full_name || 'Dr. Sarah Wilson';

        // Emit real-time events via Socket.io
        const io = req.app.get('io');
        if (io) {
            const appointmentId = id.toString();
            const payload = {
                appointmentId,
                therapistId: therapistId.toString(),
                therapistName,
                status: 'Accepted',
            };

            // Notify the patient
            if (patientId) {
                const patientIdStr = patientId.toString();
                io.to(`user:${patientIdStr}`).emit('appointment_accepted', payload);
            }

            // Notify ALL therapists so their pending lists update without refresh
            io.emit('appointment_taken', { appointmentId });
        }

        res.json({ message: 'Appointment accepted', appointment });
    } catch (error) {
        console.error('MindWell: acceptAppointment error:', error);
        res.status(500).json({ message: 'Failed to accept appointment' });
    }
};

// THERAPIST: Reject an appointment
export const rejectAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status: 'Rejected' },
            { new: true }
        ).populate('userId', 'full_name email');

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        await deleteCachedData(`appointments:user:${appointment.userId._id}`);

        const io = req.app.get('io');
        if (io) {
            io.emit('appointment_taken', { appointmentId: id.toString() });
        }

        res.json({ message: 'Appointment rejected', appointment });
    } catch (error) {
        console.error('rejectAppointment error:', error);
        res.status(500).json({ message: 'Failed to reject appointment' });
    }
};

// THERAPIST: Get session notes for an appointment (therapist/admin only)
export const getSessionNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const uid = req.user._id.toString();
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only the assigned therapist or admin may read notes
        const isAssignedTherapist = appointment.therapistId?.toString() === uid;
        if (!isAssignedTherapist && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: only the assigned therapist can view session notes' });
        }

        res.json({ sessionNotes: appointment.sessionNotes || '' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch session notes' });
    }
};

// THERAPIST: Save/update session notes (does NOT change appointment status)
export const addSessionNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionNotes } = req.body;
        const uid = req.user._id.toString();
        const role = req.user.role;

        if (typeof sessionNotes !== 'string') {
            return res.status(400).json({ message: 'sessionNotes must be a string' });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only the assigned therapist or admin may update notes
        const isAssignedTherapist = appointment.therapistId?.toString() === uid;
        if (!isAssignedTherapist && role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: only the assigned therapist can save session notes' });
        }

        appointment.sessionNotes = sessionNotes;
        await appointment.save();

        // Invalidate cache so user appointment list stays accurate
        await deleteCachedData(`appointments:user:${appointment.userId}`);

        res.json({ message: 'Session notes saved', sessionNotes: appointment.sessionNotes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save session notes' });
    }
};

// ADMIN: Get all appointments
export const getAllAppointments = async (req, res) => {
    try {
        await autoUpdateMissedAppointments();
        const { search, status, date, therapistId, page, limit } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.preferredDate = { $gte: startOfDay, $lte: endOfDay };
        }

        if (therapistId) {
            query.therapistId = therapistId;
        }

        if (search) {
            const users = await User.find({
                $or: [
                    { full_name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.$or = [
                { userId: { $in: userIds } },
                { user_id: { $in: userIds } },
                { therapistId: { $in: userIds } },
                { sessionType: { $regex: search, $options: 'i' } },
                { reason: { $regex: search, $options: 'i' } }
            ];
        }

        if (page && limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const total = await Appointment.countDocuments(query);
            const appointments = await Appointment.find(query)
                .populate('userId', 'full_name email')
                .populate('therapistId', 'full_name email')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum);
            return res.json({ appointments, total });
        }

        const appointments = await Appointment.find(query)
            .populate('userId', 'full_name email')
            .populate('therapistId', 'full_name email')
            .sort({ createdAt: -1 });
        res.json(appointments);
    } catch (error) {
        console.error('getAllAppointments error:', error);
        res.status(500).json({ message: 'Failed to fetch all appointments' });
    }
};

// ADMIN: Get all users
export const getAllUsers = async (req, res) => {
    try {
        const { search, role, page, limit } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { full_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && role !== 'all') {
            query.role = role;
        }

        if (page && limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const total = await User.countDocuments(query);
            const users = await User.find(query, '-password -refreshToken -resetPasswordToken')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum);
            return res.json({ users, total });
        }

        const users = await User.find(query, '-password -refreshToken -resetPasswordToken').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('getAllUsers error:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// ADMIN: Block a user
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true, select: '-password -refreshToken' });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User blocked successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to block user' });
    }
};

// ADMIN: Unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true, select: '-password -refreshToken' });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User unblocked successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unblock user' });
    }
};

// ADMIN: Delete a user and cascade delete related records
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await User.findByIdAndDelete(id);
        await Appointment.deleteMany({ $or: [{ userId: id }, { user_id: id }] });
        await Journal.deleteMany({ $or: [{ userId: id }, { user_id: id }] });
        await Mood.deleteMany({ $or: [{ userId: id }, { user_id: id }] });
        await CommunityPost.deleteMany({ userId: id });
        await CommunityComment.deleteMany({ userId: id });
        await CommunityPost.updateMany(
            {},
            { $pull: { comments: { user_id: id } } }
        );

        res.json({ message: 'User and all associated data deleted successfully' });
    } catch (error) {
        console.error('deleteUser error:', error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

// ADMIN: Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'therapist', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(id, { role }, { new: true, select: '-password -refreshToken' });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User role updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user role' });
    }
};

/**
 * THERAPIST: Start a consultation session.
 * Sets sessionStatus = 'live' and records sessionStartedAt.
 * Emits 'session_started' via Socket.io to the patient's personal room.
 * Only the assigned therapist (or admin) may call this.
 */
export const startSession = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Only assigned therapist or admin can start
        const isAssigned = appointment.therapistId?.toString() === therapistId.toString();
        if (!isAssigned && role !== 'admin') {
            return res.status(403).json({ message: 'Only the assigned therapist can start this session.' });
        }

        if (appointment.status !== 'Accepted') {
            return res.status(400).json({ message: 'Session can only be started for Accepted appointments.' });
        }

        appointment.sessionStatus = 'live';
        appointment.sessionStartedAt = new Date();
        await appointment.save();

        const patientId = appointment.userId || appointment.user_id;

        // Emit via Socket.io if io is available (attached to app in index.js)
        const io = req.app.get('io');
        if (io) {
            // Emit to the appointment room (both parties may already be listening)
            io.to(`consultation:${id}`).emit('session_started', {
                appointmentId: id,
                sessionStartedAt: appointment.sessionStartedAt,
            });
            // Also emit to the patient's personal room so they get notified even if
            // they haven't opened the consultation room yet
            if (patientId) {
                const patientIdStr = patientId.toString();
                io.to(`user:${patientIdStr}`).emit('session_started', {
                    appointmentId: id,
                    sessionStartedAt: appointment.sessionStartedAt,
                });
            }
        }

        res.json({ message: 'Session started', appointment });
    } catch (error) {
        console.error('MindWell: startSession error:', error);
        res.status(500).json({ message: 'Failed to start session.' });
    }
};

/**
 * THERAPIST: End a consultation session.
 * Sets sessionStatus = 'ended' and records sessionEndedAt.
 * Emits 'session_ended' via Socket.io.
 */
export const endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const isAssigned = appointment.therapistId?.toString() === userId.toString();
        const isPatient = appointment.userId?.toString() === userId.toString() || appointment.user_id?.toString() === userId.toString();

        if (!isAssigned && !isPatient && role !== 'admin') {
            return res.status(403).json({ message: 'Only session participants or admin can end this session.' });
        }

        appointment.sessionStatus = 'ended';
        appointment.sessionEndedAt = new Date();
        await appointment.save();

        const patientId = appointment.userId || appointment.user_id;
        const assignedTherapistId = appointment.therapistId;

        const io = req.app.get('io');
        if (io) {
            io.to(`consultation:${id}`).emit('session_ended', { appointmentId: id });
            if (patientId) {
                io.to(`user:${patientId.toString()}`).emit('session_ended', { appointmentId: id });
            }
            if (assignedTherapistId) {
                io.to(`user:${assignedTherapistId.toString()}`).emit('session_ended', { appointmentId: id });
            }
        }

        res.json({ message: 'Session ended', appointment });
    } catch (error) {
        console.error('MindWell: endSession error:', error);
        res.status(500).json({ message: 'Failed to end session.' });
    }
};

/**
 * THERAPIST/ADMIN: Reset a session back to pending_session.
 * Used to undo an accidentally started session.
 */
export const resetSession = async (req, res) => {
    try {
        const { id } = req.params;
        const therapistId = req.user._id;
        const role = req.user.role;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const isAssigned = appointment.therapistId?.toString() === therapistId.toString();
        if (!isAssigned && role !== 'admin') {
            return res.status(403).json({ message: 'Only the assigned therapist can reset this session.' });
        }

        appointment.sessionStatus = 'pending_session';
        appointment.sessionStartedAt = null;
        await appointment.save();

        // Notify connected clients
        const io = req.app.get('io');
        if (io) {
            // Use a dedicated 'session_reset' event so the patient's UI can return to
            // "Waiting for therapist" instead of treating this as a session end.
            io.to(`consultation:${id}`).emit('session_reset', { appointmentId: id });
            const patientId = appointment.userId?.toString() || appointment.user_id?.toString();
            if (patientId) {
                io.to(`user:${patientId}`).emit('session_reset', { appointmentId: id });
            }
        }

        res.json({ message: 'Session reset to pending', appointment });
    } catch (error) {
        console.error('MindWell: resetSession error:', error);
        res.status(500).json({ message: 'Failed to reset session.' });
    }
};

// ADMIN: Suspend a therapist
export const suspendTherapist = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOneAndUpdate(
            { _id: id, role: 'therapist' },
            { isSuspended: true },
            { new: true, select: '-password -refreshToken' }
        );
        if (!user) return res.status(404).json({ message: 'Therapist not found' });
        res.json({ message: 'Therapist suspended successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to suspend therapist' });
    }
};

// ADMIN: Unsuspend a therapist
export const unsuspendTherapist = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOneAndUpdate(
            { _id: id, role: 'therapist' },
            { isSuspended: false },
            { new: true, select: '-password -refreshToken' }
        );
        if (!user) return res.status(404).json({ message: 'Therapist not found' });
        res.json({ message: 'Therapist unsuspended successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to unsuspend therapist' });
    }
};

// ADMIN: Delete a therapist (safety check for future appointments)
export const deleteTherapist = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id, role: 'therapist' });
        if (!user) return res.status(404).json({ message: 'Therapist not found' });

        const { force } = req.query;
        const futureAppointmentsCount = await Appointment.countDocuments({
            therapistId: id,
            status: { $in: ['Accepted', 'Pending Review'] },
            preferredDate: { $gte: new Date() }
        });

        if (futureAppointmentsCount > 0 && force !== 'true') {
            return res.status(409).json({
                warning: true,
                message: `This therapist has ${futureAppointmentsCount} future appointment(s). Are you sure you want to delete them?`
            });
        }

        await User.findByIdAndDelete(id);
        // Reset therapist's appointments to unassigned
        await Appointment.updateMany(
            { therapistId: id },
            { $set: { therapistId: null, status: 'Pending Review' } }
        );

        res.json({ message: 'Therapist deleted successfully and appointments reset to unassigned.' });
    } catch (error) {
        console.error('deleteTherapist error:', error);
        res.status(500).json({ message: 'Failed to delete therapist' });
    }
};

// ADMIN: Manually assign therapist to appointment
export const assignTherapist = async (req, res) => {
    try {
        const { id } = req.params;
        const { therapistId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(therapistId)) {
            return res.status(400).json({ message: 'Invalid therapist ID.' });
        }

        const therapist = await User.findOne({ _id: therapistId, role: 'therapist', isBlocked: false, isSuspended: false });
        if (!therapist) {
            return res.status(404).json({ message: 'Approved active therapist not found.' });
        }

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        appointment.therapistId = therapistId;
        appointment.status = 'Accepted';
        appointment.acceptedAt = new Date();
        await appointment.save();

        const patientId = appointment.userId || appointment.user_id;
        const therapistName = therapist.full_name || 'Dr. Sarah Wilson';

        const io = req.app.get('io');
        if (io) {
            const payload = {
                appointmentId: id.toString(),
                therapistId: therapistId.toString(),
                therapistName,
                status: 'Accepted',
            };

            if (patientId) {
                const patientIdStr = patientId.toString();
                io.to(`user:${patientIdStr}`).emit('appointment_accepted', payload);
            }
            io.emit('appointment_taken', { appointmentId: id.toString() });
        }

        try {
            const patientId = appointment.userId || appointment.user_id;
            await deleteCachedData(`appointments:user:${patientId}`);
        } catch (_) {}

        res.json({ message: 'Therapist assigned successfully', appointment });
    } catch (error) {
        console.error('assignTherapist error:', error);
        res.status(500).json({ message: 'Failed to assign therapist' });
    }
};

// ADMIN: Automatically assign therapist to appointment based on least active load
export const autoAssignTherapist = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        const therapists = await User.find({ role: 'therapist', isBlocked: false, isSuspended: false });
        if (therapists.length === 0) {
            return res.status(404).json({ message: 'No active therapists found for assignment.' });
        }

        const therapistCounts = await Promise.all(
            therapists.map(async (therapist) => {
                const count = await Appointment.countDocuments({
                    therapistId: therapist._id,
                    status: 'Accepted'
                });
                return { therapist, count };
            })
        );

        therapistCounts.sort((a, b) => a.count - b.count);
        const selectedTherapist = therapistCounts[0].therapist;

        appointment.therapistId = selectedTherapist._id;
        appointment.status = 'Accepted';
        appointment.acceptedAt = new Date();
        await appointment.save();

        const patientId = appointment.userId || appointment.user_id;
        const therapistName = selectedTherapist.full_name || 'Dr. Sarah Wilson';

        const io = req.app.get('io');
        if (io) {
            const payload = {
                appointmentId: id.toString(),
                therapistId: selectedTherapist._id.toString(),
                therapistName,
                status: 'Accepted',
            };

            if (patientId) {
                const patientIdStr = patientId.toString();
                io.to(`user:${patientIdStr}`).emit('appointment_accepted', payload);
            }
            io.emit('appointment_taken', { appointmentId: id.toString() });
        }

        try {
            const patientId = appointment.userId || appointment.user_id;
            await deleteCachedData(`appointments:user:${patientId}`);
        } catch (_) {}

        res.json({ message: 'Therapist auto-assigned successfully', appointment, therapistName: selectedTherapist.full_name });
    } catch (error) {
        console.error('autoAssignTherapist error:', error);
        res.status(500).json({ message: 'Failed to auto-assign therapist' });
    }
};

// ADMIN: Get dashboard stats
export const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalTherapists = await User.countDocuments({ role: 'therapist' });
        const pendingRequests = await TherapistApplication.countDocuments({ status: 'pending' });
        const assignedAppointments = await Appointment.countDocuments({ status: 'Accepted' });
        const completedSessions = await Appointment.countDocuments({ status: 'Completed' });
        const emergencyReports = 0;

        res.json({
            totalUsers,
            totalTherapists,
            pendingRequests,
            assignedAppointments,
            completedSessions,
            emergencyReports
        });
    } catch (error) {
        console.error('getAdminStats error:', error);
        res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
};
