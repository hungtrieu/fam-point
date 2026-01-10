import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    role: {
        type: String,
        enum: ['parent', 'child'],
        default: 'parent',
    },
    avatar: {
        type: String,
        default: '',
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
    },
    points: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.index({ email: 1, familyId: 1 }, { unique: true });

// Force delete to ensure schema update in dev
if (process.env.NODE_ENV === 'development' && mongoose.models.User) {
    delete mongoose.models.User;
}

export default mongoose.models.User || mongoose.model('User', UserSchema);
