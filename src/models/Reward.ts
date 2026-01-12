import mongoose from 'mongoose';

const RewardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
    },
    description: {
        type: String,
    },
    points: {
        type: Number,
        required: [true, 'Please provide points'],
        min: 0,
    },
    stock: {
        type: Number,
        default: -1, // -1 means unlimited
    },
    familyId: {
        type: String,
        required: true,
    },
    createdBy: {
        type: String, // User ID
    },
    status: {
        type: String,
        enum: ['approved', 'pending', 'rejected'],
        default: 'approved',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Reward || mongoose.model('Reward', RewardSchema);
