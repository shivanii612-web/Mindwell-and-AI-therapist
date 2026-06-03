import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        enum: ['Pending Review', 'Pending Therapist Assignment'],
        default: 'Pending Review'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

appointmentSchema.index({ userId: 1, preferredDate: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
