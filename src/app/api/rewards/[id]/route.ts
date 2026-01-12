import dbConnect from '@/lib/db';
import Reward from '@/models/Reward';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const body = await req.json();
        const reward = await Reward.findByIdAndUpdate(params.id, body, {
            new: true,
            runValidators: true,
        });
        if (!reward) {
            return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
        }
        return NextResponse.json(reward, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const reward = await Reward.findByIdAndDelete(params.id);
        if (!reward) {
            return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Reward deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
    }
}
