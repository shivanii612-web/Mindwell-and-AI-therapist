import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Backward compatibility only
    },
    therapistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sessionType: {
        type: String,
        enum: ['Video', 'Audio', 'Chat'],
        required: true
    },
    preferredDate: {
        type: Date,
        required: true
    },
    preferredTime: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['Pending Review', 'Pending Therapist Assignment', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
        default: 'Pending Review'
    },
    sessionNotes: {
        type: String,
        default: ''
    },
    // Session lifecycle: pending_session → live → ended
    sessionStatus: {
        type: String,
        enum: ['pending_session', 'live', 'ended'],
        default: 'pending_session'
    },
    sessionStartedAt: {
        type: Date,
        default: null
    },
    sessionEndedAt: {
        type: Date,
        default: null
    },
    // Daily.co video/audio room — created on first join, reused on subsequent joins
    dailyRoomName: {
        type: String,
        default: null
    },
    dailyRoomUrl: {
        type: String,
        default: null
    },
    // Timestamp of when a therapist accepted — used for audit
    acceptedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

appointmentSchema.index({ userId: 1, preferredDate: 1 });
appointmentSchema.index({ user_id: 1, preferredDate: 1 });
appointmentSchema.index({ therapistId: 1, status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
