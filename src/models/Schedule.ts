import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
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
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
    },
    assignments: [
        {
            dayOfWeek: {
                type: Number, // 0 (Sunday) to 6 (Saturday)
                required: true,
            },
            assignedToId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            assignedToName: {
                type: String,
            },
        },
    ],
    isActive: {
        type: Boolean,
        default: true,
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

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
