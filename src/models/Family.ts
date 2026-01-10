import mongoose from 'mongoose';

const FamilySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a family name'],
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Family || mongoose.model('Family', FamilySchema);
