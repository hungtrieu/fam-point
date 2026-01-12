import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
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
    assignedTo: {
        type: String, // Child's name for display
    },
    assignedToId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'approved'],
        default: 'pending',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
