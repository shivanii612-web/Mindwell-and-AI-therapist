import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: false, // Changed to false for legacy account compatibility
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'therapist', 'admin'],
        default: 'user'
    },
    profile_picture: {
        type: String,
        default: ''
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    username: {
        type: String,
        trim: true,
        unique: true,
        sparse: true // Allow null for existing users
    },
    refreshToken: {
        type: String,
        default: ''
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        console.log('MindWell: Hashing password for user:', this.email);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error('MindWell: Password hashing error:', error);
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


const User = mongoose.model('User', userSchema);
export default User;
