import mongoose from 'mongoose';

const PointHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
    },
    type: {
        type: String,
        enum: ['earn', 'spend'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    relatedId: {
        type: String, // ID of Task or Reward
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.PointHistory || mongoose.model('PointHistory', PointHistorySchema);
