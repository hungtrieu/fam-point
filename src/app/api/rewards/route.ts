import dbConnect from '@/lib/db';
import Reward from '@/models/Reward';
import User from '@/models/User';
import Reminder from '@/models/Reminder';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const familyId = searchParams.get('familyId');

        const filter = familyId ? { familyId } : {};
        const rewards = await Reward.find(filter).sort({ createdAt: -1 });

        return NextResponse.json(rewards, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await dbConnect();
    try {
        const body = await req.json();
        const reward = await Reward.create(body);

        // Notify parents if created by a child
        if (body.createdBy) {
            const creator = await User.findById(body.createdBy);
            if (creator && creator.role === 'child') {
                const parents = await User.find({
                    familyId: creator.familyId,
                    role: 'parent'
                });

                if (parents.length > 0) {
                    await Reminder.create({
                        title: 'Quà tặng mới',
                        content: `Con (${creator.name}) đã tạo một quà tặng mới: ${reward.title}. Cần bạn kiểm duyệt.`,
                        familyId: creator.familyId,
                        targetUserIds: parents.map(p => p._id),
                        createdBy: creator._id,
                    });
                }
            }
        }

        return NextResponse.json(reward, { status: 201 });
    } catch (error) {
        console.error('Create reward error:', error);
        return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
    }
}
