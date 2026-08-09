import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  sentiment: { type: String },
  isCrisis: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

// Indexing for faster retrieval of conversation context
messageSchema.index({ sessionId: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
