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
        type: String, // User ID or specific child identifier. For now, string is flexible.
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'approved'],
        default: 'pending',
    },
    createdBy: {
        type: String, // Parent User ID
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
