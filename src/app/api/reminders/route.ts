import dbConnect from '@/lib/db';
import Reminder from '@/models/Reminder';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get('familyId');
        const userId = searchParams.get('userId');

        if (!familyId) {
            return NextResponse.json({ error: 'Missing familyId' }, { status: 400 });
        }

        const user = userId ? await User.findById(userId) : null;
        let query: any = { familyId };

        if (user && user.role === 'child') {
            // Children see reminders targeted at them OR created by them
            query = {
                familyId,
                $or: [
                    { targetUserIds: user._id },
                    { createdBy: user._id }
                ]
            };
        }

        const reminders = await Reminder.find(query)
            .populate('createdBy', 'name')
            .populate('targetUserIds', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(reminders, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const reminder = await Reminder.create(body);
        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        console.error('Reminder creation error:', error);
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
    }
}
