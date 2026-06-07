import mongoose from 'mongoose';

/**
 * ConsultationMessage — persists real-time chat messages exchanged
 * during a booked therapy consultation session.
 *
 * Separate from the AI Therapist Message model which stores AI chat history.
 */
const consultationMessageSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        senderRole: {
            type: String,
            enum: ['user', 'therapist', 'admin'],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: false },
    }
);

// Fast retrieval of all messages for a consultation in chronological order
consultationMessageSchema.index({ appointmentId: 1, createdAt: 1 });

const ConsultationMessage = mongoose.model('ConsultationMessage', consultationMessageSchema);
export default ConsultationMessage;
