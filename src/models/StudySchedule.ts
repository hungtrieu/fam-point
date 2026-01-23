import mongoose from 'mongoose';

const StudyScheduleSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: [true, 'Vui lòng nhập tên môn học'],
    },
    startTime: {
        type: String, // format "HH:mm"
        required: [true, 'Vui lòng nhập thời gian bắt đầu'],
    },
    endTime: {
        type: String, // format "HH:mm"
        required: [true, 'Vui lòng nhập thời gian kết thúc'],
    },
    dayOfWeek: {
        type: Number, // 0 (Sunday) to 6 (Saturday)
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    studentName: {
        type: String,
    },
    familyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Family',
        required: true,
    },
    location: {
        type: String,
    },
    notes: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.StudySchedule || mongoose.model('StudySchedule', StudyScheduleSchema);
